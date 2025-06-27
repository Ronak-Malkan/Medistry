"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeExpiredMedicines = removeExpiredMedicines;
exports.checkLowStockThreshold = checkLowStockThreshold;
const typeorm_1 = require("typeorm");
const medicineRepository_1 = require("../repositories/medicineRepository");
const accountRepository_1 = require("../repositories/accountRepository");
const email_1 = require("../utils/email");
const logger_1 = require("../utils/logger");
/**
 * Remove expired medicines (expiryDate < today) per account,
 * then email each account.contactEmail listing removed medicine names.
 */
async function removeExpiredMedicines() {
    const today = new Date();
    // find all expired entries
    const expired = await medicineRepository_1.medicineRepository.find({
        where: { expiryDate: (0, typeorm_1.LessThan)(today) },
    });
    // group by account
    const byAccount = new Map();
    for (const m of expired) {
        const list = byAccount.get(m.accountId) ?? [];
        list.push(m.name);
        byAccount.set(m.accountId, list);
    }
    // delete expired and send email
    for (const [accountId, names] of byAccount.entries()) {
        await medicineRepository_1.medicineRepository.delete({
            accountId,
            expiryDate: (0, typeorm_1.LessThan)(today),
        });
        const account = await accountRepository_1.accountRepository.findOneBy({ accountId });
        if (!account)
            continue;
        const subject = 'Expired Medicines Removed';
        const text = `The following medicines were expired and removed from stock:\n\n` +
            names.map((n, i) => `${i + 1}. ${n}`).join('\n');
        try {
            await (0, email_1.sendEmail)(account.contactEmail, subject, text);
        }
        catch (err) {
            logger_1.logger.error('Failed to send expiry removal email', {
                error: err,
                accountId,
            });
        }
    }
}
/**
 * For each account, sum up quantityAvailable per medicine name.
 * If sum < lowStockThreshold (>0), send an email listing all low-stock items.
 */
async function checkLowStockThreshold() {
    const accounts = await accountRepository_1.accountRepository.find();
    for (const account of accounts) {
        const threshold = account.lowStockThreshold;
        if (!threshold)
            continue;
        const meds = await medicineRepository_1.medicineRepository.find({
            where: { accountId: account.accountId },
        });
        const sums = meds.reduce((map, m) => {
            map.set(m.name, (map.get(m.name) ?? 0) + m.quantityAvailable);
            return map;
        }, new Map());
        const lowItems = Array.from(sums.entries()).filter(([, qty]) => qty < threshold);
        if (lowItems.length === 0)
            continue;
        const subject = 'Low-Stock Alert';
        const text = `The following medicines are below your low-stock threshold (${threshold}):\n\n` +
            lowItems.map(([name, qty], i) => `${i + 1}. ${name}: ${qty}`).join('\n');
        try {
            await (0, email_1.sendEmail)(account.contactEmail, subject, text);
        }
        catch (err) {
            logger_1.logger.error('Failed to send low-stock email', {
                error: err,
                accountId: account.accountId,
            });
        }
    }
}

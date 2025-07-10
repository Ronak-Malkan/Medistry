import { LessThan } from 'typeorm';
import { accountRepository } from '../repositories/accountRepository';
import { sendEmail } from '../utils/email';
import { logger } from '../utils/logger';
import { medicineStockRepository } from '../repositories/medicineStockRepository';

/**
 * Remove expired medicines (expiryDate < today) per account,
 * then email each account.contactEmail listing removed medicine names.
 */
export async function removeExpiredMedicines() {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  // find all expired entries
  const expired = await medicineStockRepository.find({
    where: { expiryDate: LessThan(todayStr) },
    relations: ['medicine'],
  });
  // group by account
  const byAccount = new Map<number, string[]>();
  for (const s of expired) {
    const list = byAccount.get(s.accountId) ?? [];
    const medName = s.medicine?.name || String(s.medicineId);
    list.push(medName);
    byAccount.set(s.accountId, list);
  }

  // delete expired and send email
  for (const [accountId, names] of byAccount.entries()) {
    await medicineStockRepository.delete({
      accountId,
      expiryDate: LessThan(todayStr),
    });

    const account = await accountRepository.findOneBy({ accountId });
    if (!account) continue;

    const subject = 'Expired Medicines Removed';
    const text =
      `The following medicines were expired and removed from stock:\n\n` +
      names.map((n, i) => `${i + 1}. ${n}`).join('\n');
    try {
      await sendEmail(account.contactEmail, subject, text);
    } catch (err) {
      logger.error('Failed to send expiry removal email', {
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
export async function checkLowStockThreshold() {
  const accounts = await accountRepository.find();
  for (const account of accounts) {
    const threshold = account.lowStockThreshold;
    if (!threshold) continue;

    const stocks = await medicineStockRepository.find({
      where: { accountId: account.accountId },
      relations: ['medicine'],
    });
    const sums = stocks.reduce((map, s) => {
      const medName = s.medicine?.name || String(s.medicineId);
      map.set(medName, (map.get(medName) ?? 0) + s.quantityAvailable);
      return map;
    }, new Map<string, number>());

    const lowItems = Array.from(sums.entries()).filter(
      ([, qty]) => qty < threshold,
    );
    if (lowItems.length === 0) continue;

    const subject = 'Low-Stock Alert';
    const text =
      `The following medicines are below your low-stock threshold (${threshold}):\n\n` +
      lowItems.map(([name, qty], i) => `${i + 1}. ${name}: ${qty}`).join('\n');
    try {
      await sendEmail(account.contactEmail, subject, text);
    } catch (err) {
      logger.error('Failed to send low-stock email', {
        error: err,
        accountId: account.accountId,
      });
    }
  }
}

export async function getExpiredStocks(today: Date) {
  const todayStr = today.toISOString().slice(0, 10);
  return medicineStockRepository.find({
    where: { expiryDate: LessThan(todayStr) },
    relations: ['medicine'],
  });
}

export async function getLowStockByAccount(account: { accountId: number }) {
  const stocks = await medicineStockRepository.find({
    where: { accountId: account.accountId },
    relations: ['medicine'],
  });
  const map = new Map<string, number>();
  for (const s of stocks) {
    const medName = s.medicine?.name || String(s.medicineId);
    map.set(medName, (map.get(medName) ?? 0) + s.quantityAvailable);
  }
  return map;
}

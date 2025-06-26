"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAccount = getAccount;
exports.updateAccount = updateAccount;
const accountRepository_1 = require("../repositories/accountRepository");
/**
 * Retrieves an account by its ID.
 */
async function getAccount(accountId) {
    const account = await accountRepository_1.accountRepository.findOneBy({ accountId });
    if (!account) {
        throw new Error('Account not found');
    }
    return account;
}
/**
 * Updates an account with new data.
 */
async function updateAccount(accountId, data) {
    await accountRepository_1.accountRepository.update({ accountId }, data);
    return getAccount(accountId);
}

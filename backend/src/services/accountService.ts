import { accountRepository } from '../repositories/accountRepository';
import { Account } from '../entities/Account';

/**
 * Retrieves an account by its ID.
 */
export async function getAccount(accountId: number): Promise<Account> {
  const account = await accountRepository.findOneBy({ accountId });
  if (!account) {
    throw new Error('Account not found');
  }
  return account;
}

/**
 * Updates an account with new data.
 */
export async function updateAccount(
  accountId: number,
  data: Partial<Account>,
): Promise<Account> {
  await accountRepository.update({ accountId }, data);
  return getAccount(accountId);
}

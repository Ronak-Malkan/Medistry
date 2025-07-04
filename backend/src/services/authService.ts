import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { accountRepository } from '../repositories/accountRepository';
import { userRepository } from '../repositories/userRepository';
import { Account } from '../entities/Account';

const JWT_SECRET = process.env.JWT_SECRET!;
const TOKEN_EXPIRY = '8h';

interface CompanyInput {
  name: string;
  drugLicenseNumber: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  lowStockThreshold?: number;
  expiryAlertLeadTime?: number;
}

export async function registerCompany(
  companyData: CompanyInput,
): Promise<Account> {
  const account = accountRepository.create(companyData as Partial<Account>);
  const savedAccount = await accountRepository.save(account);
  return savedAccount;
}

export async function loginUser(
  username: string,
  password: string,
): Promise<string> {
  const user = await userRepository.findOneBy({ username });
  if (!user) {
    throw new Error('Invalid credentials');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new Error('Invalid credentials');
  }

  return jwt.sign(
    {
      userId: user.userId,
      accountId: user.accountId,
      role: user.role,
      username: user.username,
      fullName: user.fullName,
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY },
  );
}

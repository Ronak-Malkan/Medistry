import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { accountRepository } from '../repositories/accountRepository';
import { userRepository } from '../repositories/userRepository';
import { Account } from '../entities/Account';
import type { UserRole } from '../entities/User';

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

interface AdminInput {
  username: string;
  password: string;
  fullName: string;
  email: string;
}

export async function registerCompany(
  companyData: CompanyInput,
  adminData: AdminInput,
): Promise<string> {
  const account = accountRepository.create(companyData as Partial<Account>);
  const savedAccount = await accountRepository.save(account);

  const passwordHash = await bcrypt.hash(adminData.password, 10);
  const user = userRepository.create({
    username: adminData.username,
    passwordHash,
    fullName: adminData.fullName,
    email: adminData.email,
    role: 'account_admin' as UserRole,
    accountId: savedAccount.accountId,
  });
  const savedUser = await userRepository.save(user);

  return jwt.sign(
    {
      userId: savedUser.userId,
      accountId: savedAccount.accountId,
      role: savedUser.role,
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY },
  );
}

export async function loginUser(
  username: string,
  password: string,
  loginAs: 'company' | 'user',
): Promise<string> {
  const user = await userRepository.findOneBy({ username });
  if (!user) {
    throw new Error('Invalid credentials');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new Error('Invalid credentials');
  }

  if (loginAs === 'company' && user.role !== 'account_admin') {
    throw new Error('Must be account admin to log in as company');
  }
  if (loginAs === 'user' && user.role !== 'app_admin') {
    throw new Error('Must be app admin to log in as user');
  }

  return jwt.sign(
    {
      userId: user.userId,
      accountId: user.accountId,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY },
  );
}

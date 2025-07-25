import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { accountRepository } from '../repositories/accountRepository';
import { userRepository } from '../repositories/userRepository';
import { Account } from '../entities/Account';

// Debug all environment variables
console.log(
  'DEBUG: All environment variables:',
  Object.keys(process.env).filter(
    (key) =>
      key.includes('JWT') || key.includes('NODE') || key.includes('DATABASE'),
  ),
);
console.log('DEBUG: JWT_SECRET value:', process.env.JWT_SECRET);

const JWT_SECRET = process.env.JWT_SECRET;
console.log(
  'DEBUG: JWT_SECRET loaded:',
  JWT_SECRET ? 'YES (length: ' + JWT_SECRET.length + ')' : 'NO',
);
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
}
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
  console.log('DEBUG: Attempting login for username:', username);

  // Check total users in database
  const totalUsers = await userRepository.count();
  console.log('DEBUG: Total users in database:', totalUsers);

  const user = await userRepository.findOneBy({ username });
  console.log(
    'DEBUG: User found:',
    user ? 'YES (userId: ' + user.userId + ')' : 'NO',
  );
  if (!user) {
    throw new Error('Invalid credentials, no user found');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new Error('Invalid credentials, password does not match');
  }

  return jwt.sign(
    {
      userId: user.userId,
      accountId: user.accountId,
      role: user.role,
      username: user.username,
      fullName: user.fullName,
    },
    JWT_SECRET as string,
    { expiresIn: TOKEN_EXPIRY },
  );
}

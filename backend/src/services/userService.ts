import bcrypt from 'bcryptjs';
import { userRepository } from '../repositories/userRepository';
import { User, UserRole } from '../entities/User';

interface CreateUserInput {
  username: string;
  password: string;
  fullName: string;
  email: string;
  role?: UserRole;
}

/** Lists all users for a given account. */
export async function listUsers(accountId: number): Promise<User[]> {
  return userRepository.find({
    where: { accountId },
    select: ['userId', 'username', 'fullName', 'email', 'role', 'createdAt'],
  });
}

/** Creates a new user under the specified account. */
export async function createUser(
  accountId: number,
  data: CreateUserInput,
): Promise<User> {
  if (await userRepository.findOneBy({ username: data.username })) {
    throw new Error('Username already exists');
  }
  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = userRepository.create({
    username: data.username,
    passwordHash,
    fullName: data.fullName,
    email: data.email,
    role: data.role ?? 'app_admin',
    accountId,
  });
  return userRepository.save(user);
}

/** Updates an existing user by loading, mutating, and saving. */
export async function updateUser(
  accountId: number,
  userId: number,
  data: Partial<{
    fullName: string;
    email: string;
    role: UserRole;
    password: string;
  }>,
): Promise<User> {
  const user = await userRepository.findOneBy({ userId, accountId });
  if (!user) throw new Error('User not found');

  if (data.fullName) user.fullName = data.fullName;
  if (data.email) user.email = data.email;
  if (data.role) user.role = data.role;
  if (data.password) user.passwordHash = await bcrypt.hash(data.password, 10);

  return userRepository.save(user);
}

/** Deletes a user. */
export async function deleteUser(
  accountId: number,
  userId: number,
): Promise<void> {
  const result = await userRepository.delete({ userId, accountId });
  if (result.affected === 0) throw new Error('User not found');
}

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUsers = listUsers;
exports.createUser = createUser;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const userRepository_1 = require("../repositories/userRepository");
/** Lists all users for a given account. */
async function listUsers(accountId) {
    return userRepository_1.userRepository.find({
        where: { accountId },
        select: ['userId', 'username', 'fullName', 'email', 'role', 'createdAt'],
    });
}
/** Creates a new user under the specified account. */
async function createUser(accountId, data) {
    if (await userRepository_1.userRepository.findOneBy({ username: data.username })) {
        throw new Error('Username already exists');
    }
    const passwordHash = await bcryptjs_1.default.hash(data.password, 10);
    const user = userRepository_1.userRepository.create({
        username: data.username,
        passwordHash,
        fullName: data.fullName,
        email: data.email,
        role: data.role ?? 'app_admin',
        accountId,
    });
    return userRepository_1.userRepository.save(user);
}
/** Updates an existing user by loading, mutating, and saving. */
async function updateUser(accountId, userId, data) {
    const user = await userRepository_1.userRepository.findOneBy({ userId, accountId });
    if (!user)
        throw new Error('User not found');
    if (data.fullName)
        user.fullName = data.fullName;
    if (data.email)
        user.email = data.email;
    if (data.role)
        user.role = data.role;
    if (data.password)
        user.passwordHash = await bcryptjs_1.default.hash(data.password, 10);
    return userRepository_1.userRepository.save(user);
}
/** Deletes a user. */
async function deleteUser(accountId, userId) {
    const result = await userRepository_1.userRepository.delete({ userId, accountId });
    if (result.affected === 0)
        throw new Error('User not found');
}

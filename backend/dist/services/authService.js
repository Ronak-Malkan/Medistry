"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCompany = registerCompany;
exports.loginUser = loginUser;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const accountRepository_1 = require("../repositories/accountRepository");
const userRepository_1 = require("../repositories/userRepository");
const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_EXPIRY = '8h';
async function registerCompany(companyData, adminData) {
    const account = accountRepository_1.accountRepository.create(companyData);
    const savedAccount = await accountRepository_1.accountRepository.save(account);
    const passwordHash = await bcryptjs_1.default.hash(adminData.password, 10);
    const user = userRepository_1.userRepository.create({
        username: adminData.username,
        passwordHash,
        fullName: adminData.fullName,
        email: adminData.email,
        role: 'account_admin',
        accountId: savedAccount.accountId,
    });
    const savedUser = await userRepository_1.userRepository.save(user);
    return jsonwebtoken_1.default.sign({
        userId: savedUser.userId,
        accountId: savedAccount.accountId,
        role: savedUser.role,
    }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}
async function loginUser(username, password, loginAs) {
    const user = await userRepository_1.userRepository.findOneBy({ username });
    if (!user) {
        throw new Error('Invalid credentials');
    }
    const valid = await bcryptjs_1.default.compare(password, user.passwordHash);
    if (!valid) {
        throw new Error('Invalid credentials');
    }
    if (loginAs === 'company' && user.role !== 'account_admin') {
        throw new Error('Must be account admin to log in as company');
    }
    if (loginAs === 'user' && user.role !== 'app_admin') {
        throw new Error('Must be app admin to log in as user');
    }
    return jsonwebtoken_1.default.sign({
        userId: user.userId,
        accountId: user.accountId,
        role: user.role,
    }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

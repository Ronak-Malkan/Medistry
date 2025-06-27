"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
require("dotenv/config");
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const authController_1 = __importDefault(require("./controllers/authController"));
const accountController_1 = __importDefault(require("./controllers/accountController"));
const userController_1 = __importDefault(require("./controllers/userController"));
const contentController_1 = __importDefault(require("./controllers/contentController"));
const medicineController_1 = __importDefault(require("./controllers/medicineController"));
const auth_1 = require("./middleware/auth");
exports.app = (0, express_1.default)();
exports.app.use((0, cors_1.default)());
exports.app.use(express_1.default.json());
// Public routes
exports.app.get('/health', (_req, res) => res.json({ status: 'ok' }));
exports.app.use('/auth', authController_1.default);
// Protected routes
exports.app.use('/api', auth_1.jwtMiddleware);
exports.app.use('/api/accounts', accountController_1.default);
exports.app.use('/api/users', userController_1.default);
exports.app.use('/api/contents', contentController_1.default);
exports.app.use('/api/medicines', medicineController_1.default);

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authService_1 = require("../services/authService");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
router.post('/company/register', async (req, res) => {
    try {
        const token = await (0, authService_1.registerCompany)(req.body.company, req.body.admin);
        res.status(201).json({ token });
    }
    catch (err) {
        logger_1.logger.error('Company registration error', { error: err });
        const message = err instanceof Error ? err.message : 'Registration failed';
        res.status(400).json({ message });
    }
});
router.post('/login', async (req, res) => {
    try {
        const { username, password, loginAs } = req.body;
        const token = await (0, authService_1.loginUser)(username, password, loginAs);
        res.status(200).json({ token });
    }
    catch (err) {
        logger_1.logger.error('Login error', { error: err });
        const message = err instanceof Error ? err.message : 'Login failed';
        res.status(401).json({ message });
    }
});
exports.default = router;

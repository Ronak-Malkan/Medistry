"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const accountService_1 = require("../services/accountService");
const auth_1 = require("../middleware/auth");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
/**
 * GET /api/accounts
 */
router.get('/', (0, auth_1.requireRole)('account_admin'), async (req, res) => {
    try {
        const accountId = req.auth.accountId;
        const account = await (0, accountService_1.getAccount)(accountId);
        res.status(200).json(account);
    }
    catch (err) {
        logger_1.logger.error('Get account error', { error: err });
        res
            .status(500)
            .json({ message: err instanceof Error ? err.message : 'Failed' });
    }
});
/**
 * PUT /api/accounts
 */
router.put('/', (0, auth_1.requireRole)('account_admin'), async (req, res) => {
    try {
        const accountId = req.auth.accountId;
        const updated = await (0, accountService_1.updateAccount)(accountId, req.body);
        res.status(200).json(updated);
    }
    catch (err) {
        logger_1.logger.error('Update account error', { error: err });
        res
            .status(500)
            .json({ message: err instanceof Error ? err.message : 'Failed' });
    }
});
exports.default = router;

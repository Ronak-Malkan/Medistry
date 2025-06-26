"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userService_1 = require("../services/userService");
const auth_1 = require("../middleware/auth");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
/** GET /api/users */
router.get('/', (0, auth_1.requireRole)('account_admin'), async (req, res) => {
    try {
        const accountId = req.auth.accountId;
        const users = await (0, userService_1.listUsers)(accountId);
        res.status(200).json({ users });
    }
    catch (err) {
        logger_1.logger.error('List users error', { error: err });
        res
            .status(500)
            .json({ message: err instanceof Error ? err.message : 'Failed' });
    }
});
/** POST /api/users */
router.post('/', (0, auth_1.requireRole)('account_admin'), async (req, res) => {
    try {
        const accountId = req.auth.accountId;
        const user = await (0, userService_1.createUser)(accountId, req.body);
        res.status(201).json(user);
    }
    catch (err) {
        logger_1.logger.error('Create user error', { error: err });
        res
            .status(400)
            .json({ message: err instanceof Error ? err.message : 'Failed' });
    }
});
/** PUT /api/users/:userId */
router.put('/:userId', (0, auth_1.requireRole)('account_admin'), async (req, res) => {
    try {
        const accountId = req.auth.accountId;
        const userId = Number(req.params.userId);
        const updated = await (0, userService_1.updateUser)(accountId, userId, req.body);
        res.status(200).json(updated);
    }
    catch (err) {
        logger_1.logger.error('Update user error', { error: err });
        res
            .status(400)
            .json({ message: err instanceof Error ? err.message : 'Failed' });
    }
});
/** DELETE /api/users/:userId */
router.delete('/:userId', (0, auth_1.requireRole)('account_admin'), async (req, res) => {
    try {
        const accountId = req.auth.accountId;
        const userId = Number(req.params.userId);
        await (0, userService_1.deleteUser)(accountId, userId);
        res.status(204).end();
    }
    catch (err) {
        logger_1.logger.error('Delete user error', { error: err });
        res
            .status(400)
            .json({ message: err instanceof Error ? err.message : 'Failed' });
    }
});
exports.default = router;

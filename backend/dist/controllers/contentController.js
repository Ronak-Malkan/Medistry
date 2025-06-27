"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const contentService_1 = require("../services/contentService");
const auth_1 = require("../middleware/auth");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
/** GET /api/contents?q=&r → { contents: Content[] } */
router.get('/', (0, auth_1.requireRole)('app_admin'), async (req, res) => {
    try {
        const q = typeof req.query.q === 'string' ? req.query.q : undefined;
        const contents = await (0, contentService_1.listContents)(q);
        res.status(200).json({ contents });
    }
    catch (err) {
        logger_1.logger.error('List content error', { error: err });
        res.status(500).json({ message: err.message || 'Failed' });
    }
});
/** POST /api/contents → { contentId, name } */
router.post('/', (0, auth_1.requireRole)('app_admin'), async (req, res) => {
    try {
        const { name } = req.body;
        const content = await (0, contentService_1.createContent)(name);
        res.status(201).json(content);
    }
    catch (err) {
        logger_1.logger.error('Create content error', { error: err });
        res.status(400).json({ message: err.message || 'Failed' });
    }
});
/** PUT /api/contents/:contentId → { contentId, name } */
router.put('/:contentId', (0, auth_1.requireRole)('app_admin'), async (req, res) => {
    try {
        const id = Number(req.params.contentId);
        const { name } = req.body;
        const updated = await (0, contentService_1.updateContent)(id, name);
        res.status(200).json(updated);
    }
    catch (err) {
        logger_1.logger.error('Update content error', { error: err });
        res.status(400).json({ message: err.message || 'Failed' });
    }
});
/** DELETE /api/contents/:contentId → 204 */
router.delete('/:contentId', (0, auth_1.requireRole)('app_admin'), async (req, res) => {
    try {
        const id = Number(req.params.contentId);
        await (0, contentService_1.deleteContent)(id);
        res.status(204).end();
    }
    catch (err) {
        logger_1.logger.error('Delete content error', { error: err });
        res.status(400).json({ message: err.message || 'Failed' });
    }
});
exports.default = router;

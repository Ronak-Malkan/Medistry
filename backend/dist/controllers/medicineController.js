"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const medicineService_1 = require("../services/medicineService");
const auth_1 = require("../middleware/auth");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
// GET /api/medicines?q=
router.get('/', (0, auth_1.requireRole)('app_admin'), async (req, res) => {
    try {
        const accountId = req.auth.accountId;
        const q = typeof req.query.q === 'string' ? req.query.q : undefined;
        const meds = await (0, medicineService_1.listMedicines)(accountId, q);
        res.status(200).json({ medicines: meds });
    }
    catch (e) {
        logger_1.logger.error('List medicines failed', { error: e });
        res.status(500).json({ message: e.message });
    }
});
// POST /api/medicines
router.post('/', (0, auth_1.requireRole)('app_admin'), async (req, res) => {
    try {
        const accountId = req.auth.accountId;
        const dto = req.body;
        const med = await (0, medicineService_1.createOrUpdateMedicine)(accountId, dto);
        res.status(201).json(med);
    }
    catch (e) {
        logger_1.logger.error('Create medicine failed', { error: e });
        res.status(400).json({ message: e.message });
    }
});
// PUT /api/medicines/:id
router.put('/:medicineId', (0, auth_1.requireRole)('app_admin'), async (req, res) => {
    try {
        const accountId = req.auth.accountId;
        const id = Number(req.params.medicineId);
        const dto = req.body;
        const updated = await (0, medicineService_1.updateMedicine)(accountId, id, dto);
        res.status(200).json(updated);
    }
    catch (e) {
        logger_1.logger.error('Update medicine failed', { error: e });
        res.status(400).json({ message: e.message });
    }
});
// DELETE /api/medicines/:id
router.delete('/:medicineId', (0, auth_1.requireRole)('app_admin'), async (req, res) => {
    try {
        const accountId = req.auth.accountId;
        const id = Number(req.params.medicineId);
        await (0, medicineService_1.deleteMedicine)(accountId, id);
        res.status(204).end();
    }
    catch (e) {
        logger_1.logger.error('Delete medicine failed', { error: e });
        res.status(400).json({ message: e.message });
    }
});
exports.default = router;

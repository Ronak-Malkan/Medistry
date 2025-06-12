"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
// GET /api/users
router.get('/', (_req, res) => {
    res.json({ users: [] }); // stub
});
exports.default = router;

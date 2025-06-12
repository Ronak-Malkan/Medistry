"use strict";
// backend/src/middleware/auth.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtMiddleware = void 0;
exports.requireRole = requireRole;
const express_jwt_1 = require("express-jwt");
const jwtSecret = process.env.JWT_SECRET;
// If no JWT_SECRET is provided (e.g. in CI/test), skip JWT verification
exports.jwtMiddleware = jwtSecret
    ? (0, express_jwt_1.expressjwt)({
        secret: jwtSecret,
        algorithms: ['HS256'],
        credentialsRequired: true,
    })
    : (_req, _res, next) => {
        next();
    };
/**
 * Checks that req.auth.role is one of the allowedRoles.
 */
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        const { role } = req.auth;
        if (!allowedRoles.includes(role)) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        next();
    };
}

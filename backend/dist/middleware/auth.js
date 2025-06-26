"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.jwtMiddleware = void 0;
const express_jwt_1 = require("express-jwt");
const jwtSecret = process.env.JWT_SECRET;
// Skip JWT in tests if no secret
exports.jwtMiddleware = jwtSecret
    ? (0, express_jwt_1.expressjwt)({
        secret: jwtSecret,
        algorithms: ['HS256'],
        credentialsRequired: true,
    })
    : (_req, _res, next) => next();
/**
 * Guard routes by allowedRoles.
 */
const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        const auth = req.auth;
        if (!auth?.role || !allowedRoles.includes(auth.role)) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        next();
    };
};
exports.requireRole = requireRole;

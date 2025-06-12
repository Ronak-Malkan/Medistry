"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtMiddleware = void 0;
exports.requireRole = requireRole;
const express_jwt_1 = require("express-jwt");
const jwtSecret = process.env.JWT_SECRET;
// JWT middleware to parse & verify tokens, attaching payload to req.auth
exports.jwtMiddleware = (0, express_jwt_1.expressjwt)({
    secret: jwtSecret,
    algorithms: ['HS256'],
    credentialsRequired: true,
});
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

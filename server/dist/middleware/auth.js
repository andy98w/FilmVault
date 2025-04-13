"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticateToken = (req, res, next) => {
    var _a;
    // First try to get token from cookies (prioritize this)
    const tokenFromCookie = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.auth_token;
    // Fallback to Authorization header for backward compatibility
    const authHeader = req.headers['authorization'];
    const tokenFromHeader = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN format
    const token = tokenFromCookie || tokenFromHeader;
    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
    try {
        // Check if JWT_SECRET is set
        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET environment variable is not set');
            return res.status(500).json({ message: 'Server configuration error' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        return res.status(403).json({ message: 'Invalid or expired token.' });
    }
};
exports.authenticateToken = authenticateToken;

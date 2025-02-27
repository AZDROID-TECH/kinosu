"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../../.env') });
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Giriş etmək lazımdır' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        // Tutarlı yapı için id'yi userId olarak ata
        req.user = {
            userId: decoded.id,
            username: decoded.username
        };
        next();
    }
    catch (error) {
        console.error('Token doğrulama xətası:', error);
        return res.status(403).json({ error: 'Token etibarsızdır' });
    }
};
exports.authenticateToken = authenticateToken;

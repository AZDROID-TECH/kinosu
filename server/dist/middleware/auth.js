"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
// Kök dizinde otomatik olarak .env yüklenir
dotenv_1.default.config();
// Fallback için sabit anahtar ama Render.com'da çevre değişkeni kullanılacak
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
// JWT_SECRET kontrolü ve uyarı
if (!process.env.JWT_SECRET) {
    console.warn('UYARI: JWT_SECRET çevre değişkeni ayarlanmamış! Varsayılan güvenli olmayan anahtar kullanılıyor.');
}
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

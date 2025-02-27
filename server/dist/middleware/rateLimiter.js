"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimiter = void 0;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const db = new better_sqlite3_1.default('kinosu.db');
// Rate limiter tablosunu oluştur
db.exec(`
  CREATE TABLE IF NOT EXISTS rate_limits (
    ip TEXT PRIMARY KEY,
    requests INTEGER DEFAULT 0,
    reset_time INTEGER
  )
`);
const WINDOW_SIZE = 15 * 60 * 1000; // 15 dakika
const MAX_REQUESTS = 100; // 15 dakikada maksimum 100 istek
const rateLimiter = (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();
    try {
        // Mevcut limiti kontrol et
        const stmt = db.prepare('SELECT * FROM rate_limits WHERE ip = ?');
        const limit = stmt.get(ip);
        if (!limit) {
            // Yeni IP için kayıt oluştur
            const insertStmt = db.prepare('INSERT INTO rate_limits (ip, requests, reset_time) VALUES (?, 1, ?)');
            insertStmt.run(ip, now + WINDOW_SIZE);
            return next();
        }
        if (now > limit.reset_time) {
            // Süre dolmuş, limiti sıfırla
            const resetStmt = db.prepare('UPDATE rate_limits SET requests = 1, reset_time = ? WHERE ip = ?');
            resetStmt.run(now + WINDOW_SIZE, ip);
            return next();
        }
        if (limit.requests >= MAX_REQUESTS) {
            return res.status(429).json({
                error: 'Həddindən artıq sorğu. Zəhmət olmasa bir az gözləyin.',
                resetTime: new Date(limit.reset_time).toISOString()
            });
        }
        // İstek sayısını artır
        const updateStmt = db.prepare('UPDATE rate_limits SET requests = requests + 1 WHERE ip = ?');
        updateStmt.run(ip);
        next();
    }
    catch (error) {
        console.error('Rate limiter error:', error);
        next();
    }
};
exports.rateLimiter = rateLimiter;

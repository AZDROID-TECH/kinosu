import { Request, Response, NextFunction } from 'express';
import Database from 'better-sqlite3';

interface RateLimit {
  ip: string;
  requests: number;
  reset_time: number;
}

const db = new Database('kinosu.db');

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

export const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip;
  const now = Date.now();

  try {
    // Mevcut limiti kontrol et
    const stmt = db.prepare('SELECT * FROM rate_limits WHERE ip = ?');
    const limit = stmt.get(ip) as RateLimit | undefined;

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
  } catch (error) {
    console.error('Rate limiter error:', error);
    next();
  }
}; 
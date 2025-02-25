import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Database from 'better-sqlite3';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import dotenv from 'dotenv';

// .env faylını yüklə
dotenv.config();

interface User {
  id: number;
  username: string;
  password: string;
  email: string;
}

const db = new Database('kinosu.db');
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';

console.log('Auth Controller - Email Configuration:', {
  host: SMTP_HOST,
  port: SMTP_PORT,
  user: SMTP_USER,
  pass: SMTP_PASS ? '***' : 'not set'
});

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: false,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

// Test email connection
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP Connection Error:', error);
  } else {
    console.log('SMTP Connection Success:', success);
  }
});

export const register = async (req: Request, res: Response) => {
  const { username, password, email } = req.body;

  if (!username || !password || !email) {
    return res.status(400).json({ error: 'Bütün sahələr doldurulmalıdır' });
  }

  if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    return res.status(400).json({ error: 'Düzgün email ünvanı daxil edin' });
  }

  try {
    const userStmt = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?');
    const existingUser = userStmt.get(username, email) as User | undefined;

    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(400).json({ error: 'Bu istifadəçi adı artıq mövcuddur' });
      }
      if (existingUser.email === email) {
        return res.status(400).json({ error: 'Bu email ünvanı artıq qeydiyyatdan keçib' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const insertStmt = db.prepare('INSERT INTO users (username, password, email) VALUES (?, ?, ?)');
    insertStmt.run(username, hashedPassword, email);

    res.status(201).json({ message: 'İstifadəçi uğurla qeydiyyatdan keçdi' });
  } catch (error) {
    res.status(500).json({ error: 'Qeydiyyat zamanı xəta baş verdi' });
  }
};

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?');
    const user = stmt.get(username, username) as User | undefined;

    if (!user) {
      return res.status(401).json({ error: 'İstifadəçi adı və ya şifrə yanlışdır' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'İstifadəçi adı və ya şifrə yanlışdır' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, username: user.username });
  } catch (error) {
    res.status(500).json({ error: 'Giriş zamanı xəta baş verdi' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email ünvanı daxil edilməlidir' });
  }

  try {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    const user = stmt.get(email) as User | undefined;

    if (!user) {
      return res.status(404).json({ error: 'Bu email ünvanına aid istifadəçi tapılmadı' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 saat

    const updateStmt = db.prepare('UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?');
    updateStmt.run(resetToken, resetTokenExpiry, email);

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    await transporter.sendMail({
      from: SMTP_USER,
      to: email,
      subject: 'Kinosu - Şifrə Yeniləmə Tələbi',
      html: `
        <h1>Kinosu</h1>
        <p>Şifrənizi yeniləmək üçün aşağıdakı linkə klikləyin:</p>
        <a href="${resetUrl}">Şifrəni Yenilə</a>
        <p>Bu link 1 saat ərzində etibarlıdır.</p>
        <p>Əgər siz şifrə yeniləmə tələbi göndərməmisinizsə, bu emaili nəzərə almayın.</p>
      `,
    });

    res.json({ message: 'Şifrə yeniləmə linki email ünvanınıza göndərildi' });
  } catch (error) {
    res.status(500).json({ error: 'Şifrə yeniləmə tələbi zamanı xəta baş verdi' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token və yeni şifrə tələb olunur' });
  }

  try {
    const stmt = db.prepare('SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > ?');
    const user = stmt.get(token, Date.now()) as User | undefined;

    if (!user) {
      return res.status(400).json({ error: 'Etibarsız və ya vaxtı keçmiş token' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updateStmt = db.prepare('UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?');
    updateStmt.run(hashedPassword, user.id);

    res.json({ message: 'Şifrəniz uğurla yeniləndi' });
  } catch (error) {
    res.status(500).json({ error: 'Şifrə yeniləmə zamanı xəta baş verdi' });
  }
}; 
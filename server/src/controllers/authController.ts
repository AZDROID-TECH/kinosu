import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Database from 'better-sqlite3';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { getPasswordResetTemplate } from '../templates/emailTemplates';

// .env faylını yüklə
dotenv.config();

// Email doğrulama için regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface User {
  id: number;
  username: string;
  password: string;
  email: string;
  reset_token?: string | null;
  reset_token_expiry?: number | null;
}

const db = new Database('kinosu.db');
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: false,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

// Email bağlantısını doğrula (sessizce)
transporter.verify((error) => {
  if (error) {
    console.error('SMTP Connection Error:', error);
  }
});

export const register = async (req: Request, res: Response) => {
  try {
    const { username, password, email } = req.body;

    // Doğrulama: Gerekli alanlar var mı?
    if (!username || !password) {
      return res.status(400).json({ error: 'İstifadəçi adı və şifrə tələb olunur' });
    }
    
    // Email formatını doğrula
    if (email && !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: 'Düzgün e-poçt ünvanı daxil edin' });
    }

    // Kullanıcı zaten mevcut mu?
    const stmt = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?');
    const existingUser = stmt.get(username, email) as User | undefined;

    if (existingUser) {
      return res.status(409).json({ error: 'İstifadəçi adı və ya e-poçt artıq istifadə olunur' });
    }

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(password, 10);

    // Kullanıcıyı oluştur
    const insertStmt = db.prepare('INSERT INTO users (username, password, email) VALUES (?, ?, ?)');
    const result = insertStmt.run(username, hashedPassword, email || null);
    
    res.status(201).json({ message: 'İstifadəçi uğurla qeydiyyatdan keçdi' });
  } catch (error) {
    console.error('Qeydiyyat zamanı xəta baş verdi:', error);
    res.status(500).json({ error: 'Server xətası baş verdi' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // Doğrulama: Gerekli alanlar var mı?
    if (!username || !password) {
      return res.status(400).json({ error: 'İstifadəçi adı və şifrə tələb olunur' });
    }

    // Kullanıcıyı bul
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    const user = stmt.get(username) as User;

    if (!user) {
      return res.status(401).json({ error: 'Yanlış istifadəçi adı və ya şifrə' });
    }

    // Şifreyi doğrula
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Yanlış istifadəçi adı və ya şifrə' });
    }

    // JWT token oluştur
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '24h' }
    );

    res.json({ token });
  } catch (error) {
    console.error('Giriş zamanı xəta baş verdi:', error);
    res.status(500).json({ error: 'Server xətası baş verdi' });
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

    // Yeni oluşturduğumuz şablon fonksiyonunu kullanıyoruz
    const emailHtml = getPasswordResetTemplate(resetToken, user.username);

    await transporter.sendMail({
      from: {
        name: 'Kinosu Film Platforması',
        address: SMTP_USER
      },
      to: email,
      subject: 'Kinosu - Şifrə Yeniləmə Tələbi',
      html: emailHtml,
      headers: {
        'X-Priority': '1', // Yüksek öncelik
        'X-MSMail-Priority': 'High',
        'Importance': 'High'
      }
    });

    res.json({ message: 'Şifrə yeniləmə linki email ünvanınıza göndərildi' });
  } catch (error) {
    console.error('Şifrə yeniləmə xətası:', error);
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
    console.error('Şifrə yeniləmə xətası:', error);
    res.status(500).json({ error: 'Şifrə yeniləmə zamanı xəta baş verdi' });
  }
}; 
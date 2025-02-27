"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.forgotPassword = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const crypto_1 = __importDefault(require("crypto"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const emailTemplates_1 = require("../templates/emailTemplates");
// .env faylını yüklə
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../../.env') });
// Email doğrulama için regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const db = new better_sqlite3_1.default('kinosu.db');
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const transporter = nodemailer_1.default.createTransport({
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
const register = async (req, res) => {
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
        const existingUser = stmt.get(username, email);
        if (existingUser) {
            return res.status(409).json({ error: 'İstifadəçi adı və ya e-poçt artıq istifadə olunur' });
        }
        // Şifreyi hashle
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        // Kullanıcıyı oluştur
        const insertStmt = db.prepare('INSERT INTO users (username, password, email) VALUES (?, ?, ?)');
        const result = insertStmt.run(username, hashedPassword, email || null);
        res.status(201).json({ message: 'İstifadəçi uğurla qeydiyyatdan keçdi' });
    }
    catch (error) {
        console.error('Qeydiyyat zamanı xəta baş verdi:', error);
        res.status(500).json({ error: 'Server xətası baş verdi' });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        // Doğrulama: Gerekli alanlar var mı?
        if (!username || !password) {
            return res.status(400).json({ error: 'İstifadəçi adı və şifrə tələb olunur' });
        }
        // Kullanıcıyı bul
        const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
        const user = stmt.get(username);
        if (!user) {
            return res.status(401).json({ error: 'Yanlış istifadəçi adı və ya şifrə' });
        }
        // Şifreyi doğrula
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Yanlış istifadəçi adı və ya şifrə' });
        }
        // JWT token oluştur
        const token = jsonwebtoken_1.default.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET || 'default_secret', { expiresIn: '24h' });
        res.json({ token });
    }
    catch (error) {
        console.error('Giriş zamanı xəta baş verdi:', error);
        res.status(500).json({ error: 'Server xətası baş verdi' });
    }
};
exports.login = login;
const forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: 'Email ünvanı daxil edilməlidir' });
    }
    try {
        const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
        const user = stmt.get(email);
        if (!user) {
            return res.status(404).json({ error: 'Bu email ünvanına aid istifadəçi tapılmadı' });
        }
        const resetToken = crypto_1.default.randomBytes(32).toString('hex');
        const resetTokenExpiry = Date.now() + 3600000; // 1 saat
        const updateStmt = db.prepare('UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?');
        updateStmt.run(resetToken, resetTokenExpiry, email);
        // Yeni oluşturduğumuz şablon fonksiyonunu kullanıyoruz
        const emailHtml = (0, emailTemplates_1.getPasswordResetTemplate)(resetToken, user.username);
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
    }
    catch (error) {
        console.error('Şifrə yeniləmə xətası:', error);
        res.status(500).json({ error: 'Şifrə yeniləmə tələbi zamanı xəta baş verdi' });
    }
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
        return res.status(400).json({ error: 'Token və yeni şifrə tələb olunur' });
    }
    try {
        const stmt = db.prepare('SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > ?');
        const user = stmt.get(token, Date.now());
        if (!user) {
            return res.status(400).json({ error: 'Etibarsız və ya vaxtı keçmiş token' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
        const updateStmt = db.prepare('UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?');
        updateStmt.run(hashedPassword, user.id);
        res.json({ message: 'Şifrəniz uğurla yeniləndi' });
    }
    catch (error) {
        console.error('Şifrə yeniləmə xətası:', error);
        res.status(500).json({ error: 'Şifrə yeniləmə zamanı xəta baş verdi' });
    }
};
exports.resetPassword = resetPassword;

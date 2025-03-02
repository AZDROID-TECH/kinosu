"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.forgotPassword = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const crypto_1 = __importDefault(require("crypto"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const emailTemplates_1 = require("../templates/emailTemplates");
const supabase_1 = require("../utils/supabase");
// .env faylını yüklə
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../../.env') });
// Email doğrulama için regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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
        const client = (0, supabase_1.getClient)();
        let query = client
            .from(supabase_1.TABLES.USERS)
            .select('*');
        // Kullanıcı adı kontrolü
        const { data: existingUserByName, error: nameCheckError } = await query
            .eq('username', username)
            .maybeSingle();
        if (nameCheckError) {
            console.error('İstifadəçi adı yoxlama xətası:', nameCheckError);
            return res.status(500).json({ error: 'Verilənlər bazası sorğusunda xəta baş verdi' });
        }
        // Email varsa ve kullanıcı adı bulunamadıysa, email kontrolü yap
        let existingUser = existingUserByName;
        if (!existingUser && email) {
            const { data: existingUserByEmail, error: emailCheckError } = await client
                .from(supabase_1.TABLES.USERS)
                .select('*')
                .eq('email', email)
                .maybeSingle();
            if (emailCheckError) {
                console.error('E-poçt yoxlama xətası:', emailCheckError);
                return res.status(500).json({ error: 'Verilənlər bazası sorğusunda xəta baş verdi' });
            }
            existingUser = existingUserByEmail;
        }
        if (existingUser) {
            return res.status(409).json({ error: 'İstifadəçi adı və ya e-poçt artıq istifadə olunur' });
        }
        // Şifreyi hashle
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        // Kullanıcıyı oluştur
        console.log('İstifadəçi yaratmağa çalışıram:', { username, email, hashedPassword: '[GİZLİ]' });
        const { error: insertError } = await client
            .from(supabase_1.TABLES.USERS)
            .insert({
            username,
            password: hashedPassword,
            email: email || null,
            created_at: new Date().toISOString()
        });
        if (insertError) {
            console.error('İstifadəçi yaratma xətası (detaylı):', JSON.stringify(insertError));
            return res.status(500).json({ error: 'İstifadəçi yaratma zamanı xəta baş verdi' });
        }
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
        const client = (0, supabase_1.getClient)();
        const { data: user, error: userError } = await client
            .from(supabase_1.TABLES.USERS)
            .select('*')
            .eq('username', username)
            .maybeSingle();
        if (userError) {
            console.error('İstifadəçi sorğu xətası:', userError);
            return res.status(500).json({ error: 'Verilənlər bazası sorğusunda xəta baş verdi' });
        }
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
        const client = (0, supabase_1.getClient)();
        const { data: user, error: userError } = await client
            .from(supabase_1.TABLES.USERS)
            .select('*')
            .eq('email', email)
            .maybeSingle();
        if (userError) {
            console.error('İstifadəçi sorğu xətası:', userError);
            return res.status(500).json({ error: 'Verilənlər bazası sorğusunda xəta baş verdi' });
        }
        if (!user) {
            return res.status(404).json({ error: 'Bu email ünvanına aid istifadəçi tapılmadı' });
        }
        // Generate a token
        const resetToken = crypto_1.default.randomBytes(20).toString('hex');
        const resetTokenExpiry = Date.now() + 3600000; // 1 hour
        // Update user with reset token
        const { error: updateError } = await client
            .from(supabase_1.TABLES.USERS)
            .update({
            reset_token: resetToken,
            reset_token_expiry: resetTokenExpiry
        })
            .eq('id', user.id);
        if (updateError) {
            console.error('Token yeniləmə xətası:', updateError);
            return res.status(500).json({ error: 'Şifrə sıfırlama token\'i yaradılarkən xəta baş verdi' });
        }
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
        const client = (0, supabase_1.getClient)();
        const now = Date.now();
        // Find user with valid reset token
        const { data: user, error: userError } = await client
            .from(supabase_1.TABLES.USERS)
            .select('*')
            .eq('reset_token', token)
            .gt('reset_token_expiry', now)
            .maybeSingle();
        if (userError) {
            console.error('İstifadəçi axtarma xətası:', userError);
            return res.status(500).json({ error: 'Verilənlər bazası sorğusunda xəta baş verdi' });
        }
        if (!user) {
            return res.status(400).json({ error: 'Etibarsız və ya vaxtı keçmiş token' });
        }
        // Hash new password
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
        // Update user with new password and remove reset token
        const { error: updateError } = await client
            .from(supabase_1.TABLES.USERS)
            .update({
            password: hashedPassword,
            reset_token: null,
            reset_token_expiry: null
        })
            .eq('id', user.id);
        if (updateError) {
            console.error('Şifrə yeniləmə xətası:', updateError);
            return res.status(500).json({ error: 'Şifrə yeniləmə zamanı xəta baş verdi' });
        }
        res.json({ message: 'Şifrə uğurla yeniləndi' });
    }
    catch (error) {
        console.error('Şifrə sıfırlama xətası:', error);
        res.status(500).json({ error: 'Server xətası baş verdi' });
    }
};
exports.resetPassword = resetPassword;

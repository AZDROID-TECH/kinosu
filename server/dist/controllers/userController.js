"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAvatar = exports.uploadAvatar = exports.getProfile = void 0;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const dotenv_1 = __importDefault(require("dotenv"));
// .env faylını yüklə
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../../.env') });
const db = new better_sqlite3_1.default('kinosu.db');
const UPLOADS_DIR = path_1.default.join(__dirname, '../../uploads/avatars');
// Avatarlar klasörünü oluştur (yoksa)
if (!fs_1.default.existsSync(UPLOADS_DIR)) {
    fs_1.default.mkdirSync(UPLOADS_DIR, { recursive: true });
}
// Kullanılmayan avatarları temizle
const cleanupUnusedAvatars = () => {
    try {
        // Veritabanında kayıtlı tüm avatar dosyalarını al
        const avatars = db.prepare('SELECT avatar FROM users WHERE avatar IS NOT NULL').all();
        // Dosya sistemindeki tüm avatar dosyalarını al
        const files = fs_1.default.readdirSync(UPLOADS_DIR);
        // Veritabanında olmayan dosyaları bul ve sil
        for (const file of files) {
            // Sadece dosya adını karşılaştır, yolu hariç
            const isUsed = avatars.some(a => a.avatar && path_1.default.basename(a.avatar) === file);
            if (!isUsed) {
                fs_1.default.unlinkSync(path_1.default.join(UPLOADS_DIR, file));
            }
        }
    }
    catch (error) {
        console.error('Temizleme prosesində xəta:', error);
    }
};
// Her 24 saatte bir temizlik yap
setInterval(cleanupUnusedAvatars, 24 * 60 * 60 * 1000);
// Profil bilgilerini getir
const getProfile = async (req, res) => {
    try {
        const userId = req.user?.userId;
        // Önce users tablosunda created_at sütunu var mı kontrol et
        const tableInfoStmt = db.prepare("PRAGMA table_info(users)");
        const columns = tableInfoStmt.all();
        let query = `
      SELECT id, username, email, avatar
      FROM users 
      WHERE id = ?
    `;
        // created_at sütunu varsa sorguya ekle
        if (columns.some(col => col.name === 'created_at')) {
            query = `
        SELECT id, username, email, avatar, created_at 
        FROM users 
        WHERE id = ?
      `;
        }
        const stmt = db.prepare(query);
        const user = stmt.get(userId);
        if (!user) {
            return res.status(404).json({ error: 'İstifadəçi tapılmadı' });
        }
        // İzleme listesini getir
        const watchlistStmt = db.prepare(`
      SELECT status, COUNT(*) as count 
      FROM movies 
      WHERE user_id = ? 
      GROUP BY status
    `);
        const watchlistStats = watchlistStmt.all(userId);
        // created_at yoksa şu anki zamanı kullan
        const createdAt = user.created_at || new Date().toISOString();
        res.json({
            id: user.id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            createdAt: createdAt,
            watchlist: {
                watchlist: watchlistStats.find((s) => s.status === 'watchlist')?.count || 0,
                watching: watchlistStats.find((s) => s.status === 'watching')?.count || 0,
                watched: watchlistStats.find((s) => s.status === 'watched')?.count || 0
            }
        });
    }
    catch (error) {
        console.error('Profil məlumatları alınarkən xəta:', error);
        res.status(500).json({ error: 'Profil məlumatları alınarkən xəta baş verdi' });
    }
};
exports.getProfile = getProfile;
// Avatar yükleme
const uploadAvatar = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!req.file) {
            return res.status(400).json({ error: 'Şəkil yüklənmədi' });
        }
        // Kullanıcıyı bul
        const userStmt = db.prepare('SELECT avatar, username FROM users WHERE id = ?');
        const user = userStmt.get(userId);
        if (!user) {
            return res.status(404).json({ error: 'İstifadəçi tapılmadı' });
        }
        // Eski avatar dosyasını sil
        if (user.avatar) {
            const oldAvatarPath = path_1.default.join(UPLOADS_DIR, path_1.default.basename(user.avatar));
            if (fs_1.default.existsSync(oldAvatarPath)) {
                fs_1.default.unlinkSync(oldAvatarPath);
            }
        }
        // Dosya adını ayır ve uzantıyı al
        const fileExtension = path_1.default.extname(req.file.originalname);
        // Kullanıcı adını al ve geçersiz karakterleri temizle
        const sanitizedUsername = user.username.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
        // Kullanıcı adı ve benzersiz ID ile dosya adı oluştur
        const randomId = (0, uuid_1.v4)().substring(0, 8);
        const filename = `${sanitizedUsername}-${randomId}${fileExtension}`;
        const avatarPath = path_1.default.join(UPLOADS_DIR, filename);
        // Dosyayı taşı
        fs_1.default.renameSync(req.file.path, avatarPath);
        // Veritabanını güncelle
        const updateStmt = db.prepare('UPDATE users SET avatar = ? WHERE id = ?');
        updateStmt.run(`/uploads/avatars/${filename}`, userId);
        res.json({
            success: true,
            avatar: `/uploads/avatars/${filename}`
        });
    }
    catch (error) {
        console.error('Avatar yükləmə xətası:', error);
        res.status(500).json({ error: 'Avatar yükləmə zamanı xəta baş verdi' });
    }
};
exports.uploadAvatar = uploadAvatar;
// Avatar silme
const deleteAvatar = async (req, res) => {
    try {
        const userId = req.user?.userId;
        // Kullanıcıyı bul
        const userStmt = db.prepare('SELECT avatar FROM users WHERE id = ?');
        const user = userStmt.get(userId);
        if (!user) {
            return res.status(404).json({ error: 'İstifadəçi tapılmadı' });
        }
        // Avatar dosyasını sil
        if (user.avatar) {
            const avatarPath = path_1.default.join(UPLOADS_DIR, path_1.default.basename(user.avatar));
            if (fs_1.default.existsSync(avatarPath)) {
                fs_1.default.unlinkSync(avatarPath);
            }
            // Veritabanını güncelle
            const updateStmt = db.prepare('UPDATE users SET avatar = NULL WHERE id = ?');
            updateStmt.run(userId);
            res.json({ success: true });
        }
        else {
            res.status(400).json({ error: 'İstifadəçinin avatarı yoxdur' });
        }
    }
    catch (error) {
        console.error('Avatar silmə xətası:', error);
        res.status(500).json({ error: 'Avatar silmə zamanı xəta baş verdi' });
    }
};
exports.deleteAvatar = deleteAvatar;

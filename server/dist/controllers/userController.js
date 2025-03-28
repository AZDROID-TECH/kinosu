"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAvatar = exports.uploadAvatar = exports.getProfile = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const dotenv_1 = __importDefault(require("dotenv"));
const supabase_1 = require("../utils/supabase");
// .env faylını yüklə
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../../.env') });
const UPLOADS_DIR = path_1.default.join(__dirname, '../../uploads/avatars');
// Avatarlar klasörünü oluştur (yoksa)
if (!fs_1.default.existsSync(UPLOADS_DIR)) {
    fs_1.default.mkdirSync(UPLOADS_DIR, { recursive: true });
}
// Kullanılmayan avatarları temizle
const cleanupUnusedAvatars = async () => {
    try {
        // Veritabanında kayıtlı tüm avatar dosyalarını al
        const { data: avatars, error } = await (0, supabase_1.getClient)()
            .from(supabase_1.TABLES.USERS)
            .select('avatar')
            .not('avatar', 'is', null);
        if (error) {
            console.error('Avatar sorğusunda xəta:', error);
            return;
        }
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
        // Kullanıcı bilgilerini Supabase'den çek
        const { data: user, error: userError } = await (0, supabase_1.getClient)()
            .from(supabase_1.TABLES.USERS)
            .select('id, username, email, avatar, created_at')
            .eq('id', userId)
            .single();
        if (userError) {
            console.error('İstifadəçi sorğu xətası:', userError);
            return res.status(500).json({ error: 'Verilənlər bazası sorğusunda xəta baş verdi' });
        }
        if (!user) {
            return res.status(404).json({ error: 'İstifadəçi tapılmadı' });
        }
        // İzleme listesi istatistiklerini al
        // Watchlist (İzleme Listesi)
        const { count: watchlistCount, error: watchlistError } = await (0, supabase_1.getClient)()
            .from(supabase_1.TABLES.MOVIES)
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('status', 'watchlist');
        if (watchlistError) {
            console.error('Watchlist sorğu xətası:', watchlistError);
            return res.status(500).json({ error: 'Verilənlər bazası sorğusunda xəta baş verdi' });
        }
        // Watching (İzleniyor)
        const { count: watchingCount, error: watchingError } = await (0, supabase_1.getClient)()
            .from(supabase_1.TABLES.MOVIES)
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('status', 'watching');
        if (watchingError) {
            console.error('Watching sorğu xətası:', watchingError);
            return res.status(500).json({ error: 'Verilənlər bazası sorğusunda xəta baş verdi' });
        }
        // Watched (İzlendi)
        const { count: watchedCount, error: watchedError } = await (0, supabase_1.getClient)()
            .from(supabase_1.TABLES.MOVIES)
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('status', 'watched');
        if (watchedError) {
            console.error('Watched sorğu xətası:', watchedError);
            return res.status(500).json({ error: 'Verilənlər bazası sorğusunda xəta baş verdi' });
        }
        // created_at yoksa şu anki zamanı kullan
        const createdAt = user.created_at || new Date().toISOString();
        res.json({
            id: user.id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            createdAt: createdAt,
            watchlist: {
                watchlist: watchlistCount || 0,
                watching: watchingCount || 0,
                watched: watchedCount || 0
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
        const { data: user, error: userError } = await (0, supabase_1.getClient)()
            .from(supabase_1.TABLES.USERS)
            .select('avatar, username')
            .eq('id', userId)
            .single();
        if (userError) {
            console.error('İstifadəçi sorğu xətası:', userError);
            return res.status(500).json({ error: 'Verilənlər bazası sorğusunda xəta baş verdi' });
        }
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
        const { error: updateError } = await (0, supabase_1.getClient)()
            .from(supabase_1.TABLES.USERS)
            .update({ avatar: `/uploads/avatars/${filename}` })
            .eq('id', userId);
        if (updateError) {
            console.error('Avatar yeniləmə xətası:', updateError);
            return res.status(500).json({ error: 'Avatar yeniləmə zamanı xəta baş verdi' });
        }
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
        const { data: user, error: userError } = await (0, supabase_1.getClient)()
            .from(supabase_1.TABLES.USERS)
            .select('avatar')
            .eq('id', userId)
            .single();
        if (userError) {
            console.error('İstifadəçi sorğu xətası:', userError);
            return res.status(500).json({ error: 'Verilənlər bazası sorğusunda xəta baş verdi' });
        }
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
            const { error: updateError } = await (0, supabase_1.getClient)()
                .from(supabase_1.TABLES.USERS)
                .update({ avatar: null })
                .eq('id', userId);
            if (updateError) {
                console.error('Avatar silmə xətası:', updateError);
                return res.status(500).json({ error: 'Avatar silmə zamanı xəta baş verdi' });
            }
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

import { Request, Response } from 'express';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

// .env faylını yüklə
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

interface UserRecord {
  id: number;
  username: string;
  email: string | null;
  avatar: string | null;
  created_at: string;
}

interface WatchlistRecord {
  status: string;
  count: number;
}

const db = new Database('kinosu.db');
const UPLOADS_DIR = path.join(__dirname, '../../uploads/avatars');

// Avatarlar klasörünü oluştur (yoksa)
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Kullanılmayan avatarları temizle
const cleanupUnusedAvatars = () => {
  try {
    // Veritabanında kayıtlı tüm avatar dosyalarını al
    const avatars = db.prepare('SELECT avatar FROM users WHERE avatar IS NOT NULL').all() as { avatar: string }[];
    
    // Dosya sistemindeki tüm avatar dosyalarını al
    const files = fs.readdirSync(UPLOADS_DIR);
    
    // Veritabanında olmayan dosyaları bul ve sil
    for (const file of files) {
      // Sadece dosya adını karşılaştır, yolu hariç
      const isUsed = avatars.some(a => a.avatar && path.basename(a.avatar) === file);
      
      if (!isUsed) {
        fs.unlinkSync(path.join(UPLOADS_DIR, file));
      }
    }
  } catch (error) {
    console.error('Temizleme prosesində xəta:', error);
  }
};

// Her 24 saatte bir temizlik yap
setInterval(cleanupUnusedAvatars, 24 * 60 * 60 * 1000);

// Profil bilgilerini getir
export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    // Önce users tablosunda created_at sütunu var mı kontrol et
    const tableInfoStmt = db.prepare("PRAGMA table_info(users)");
    const columns = tableInfoStmt.all() as {name: string}[];
    
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
    const user = stmt.get(userId) as UserRecord | undefined;
    
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
    
    const watchlistStats = watchlistStmt.all(userId) as WatchlistRecord[];
    
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
  } catch (error) {
    console.error('Profil məlumatları alınarkən xəta:', error);
    res.status(500).json({ error: 'Profil məlumatları alınarkən xəta baş verdi' });
  }
};

// Avatar yükleme
export const uploadAvatar = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Şəkil yüklənmədi' });
    }
    
    // Kullanıcıyı bul
    const userStmt = db.prepare('SELECT avatar, username FROM users WHERE id = ?');
    const user = userStmt.get(userId) as { avatar: string | null, username: string } | undefined;
    
    if (!user) {
      return res.status(404).json({ error: 'İstifadəçi tapılmadı' });
    }
    
    // Eski avatar dosyasını sil
    if (user.avatar) {
      const oldAvatarPath = path.join(UPLOADS_DIR, path.basename(user.avatar));
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }
    
    // Dosya adını ayır ve uzantıyı al
    const fileExtension = path.extname(req.file.originalname);
    
    // Kullanıcı adını al ve geçersiz karakterleri temizle
    const sanitizedUsername = user.username.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    
    // Kullanıcı adı ve benzersiz ID ile dosya adı oluştur
    const randomId = uuidv4().substring(0, 8);
    const filename = `${sanitizedUsername}-${randomId}${fileExtension}`;
    const avatarPath = path.join(UPLOADS_DIR, filename);
    
    // Dosyayı taşı
    fs.renameSync(req.file.path, avatarPath);
    
    // Veritabanını güncelle
    const updateStmt = db.prepare('UPDATE users SET avatar = ? WHERE id = ?');
    updateStmt.run(`/uploads/avatars/${filename}`, userId);
    
    res.json({ 
      success: true, 
      avatar: `/uploads/avatars/${filename}` 
    });
  } catch (error) {
    console.error('Avatar yükləmə xətası:', error);
    res.status(500).json({ error: 'Avatar yükləmə zamanı xəta baş verdi' });
  }
};

// Avatar silme
export const deleteAvatar = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    // Kullanıcıyı bul
    const userStmt = db.prepare('SELECT avatar FROM users WHERE id = ?');
    const user = userStmt.get(userId) as { avatar: string | null } | undefined;
    
    if (!user) {
      return res.status(404).json({ error: 'İstifadəçi tapılmadı' });
    }
    
    // Avatar dosyasını sil
    if (user.avatar) {
      const avatarPath = path.join(UPLOADS_DIR, path.basename(user.avatar));
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
      
      // Veritabanını güncelle
      const updateStmt = db.prepare('UPDATE users SET avatar = NULL WHERE id = ?');
      updateStmt.run(userId);
      
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'İstifadəçinin avatarı yoxdur' });
    }
  } catch (error) {
    console.error('Avatar silmə xətası:', error);
    res.status(500).json({ error: 'Avatar silmə zamanı xəta baş verdi' });
  }
}; 
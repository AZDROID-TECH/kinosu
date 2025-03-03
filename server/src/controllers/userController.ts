import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { TABLES, getClient } from '../utils/supabase';

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

// Uploads için klasör yolları
const UPLOADS_DIR = path.join(__dirname, '../../uploads/avatars');
const TEMP_DIR = path.join(__dirname, '../../uploads/temp');

// Avatar temizleme işlemini optimize edelim
const cleanupUnusedAvatars = async () => {
  try {
    // Bu işlev sadece development modunda çalışsın
    if (process.env.NODE_ENV !== 'development') return;

    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      return;
    }

    // Veritabanında kullanılan tüm avatarları al
    const { data: users, error } = await getClient()
      .from(TABLES.USERS)
      .select('avatar')
      .not('avatar', 'is', null);

    if (error) {
      console.error('Avatar temizleme sorğusunda xəta:', error);
      return;
    }

    // Veritabanındaki avatar dosya adlarını çıkar
    const dbAvatars = users
      .filter(user => user.avatar)
      .map(user => path.basename(user.avatar));

    // Dosya sistemindeki tüm avatarları kontrol et
    const files = fs.readdirSync(UPLOADS_DIR);
    
    // Kullanılmayan dosyaları bul ve sil
    for (const file of files) {
      if (!dbAvatars.includes(file) && !file.startsWith('.')) {
        try {
          fs.unlinkSync(path.join(UPLOADS_DIR, file));
          console.log(`İstifadə edilməyən avatar silindi: ${file}`);
        } catch (err) {
          console.error(`Avatar silinərkən xəta: ${file}`, err);
        }
      }
    }
  } catch (err) {
    console.error('Avatar temizleme prosesində xəta:', err);
  }
};

// Her 24 saatte bir temizlik yap
setInterval(cleanupUnusedAvatars, 24 * 60 * 60 * 1000);

// Profil bilgilerini getir
export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    // Kullanıcı bilgilerini Supabase'den çek
    const { data: user, error: userError } = await getClient()
      .from(TABLES.USERS)
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
    const { count: watchlistCount, error: watchlistError } = await getClient()
      .from(TABLES.MOVIES)
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'watchlist');
    
    if (watchlistError) {
      console.error('Watchlist sorğu xətası:', watchlistError);
      return res.status(500).json({ error: 'Verilənlər bazası sorğusunda xəta baş verdi' });
    }
    
    // Watching (İzleniyor)
    const { count: watchingCount, error: watchingError } = await getClient()
      .from(TABLES.MOVIES)
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'watching');
    
    if (watchingError) {
      console.error('Watching sorğu xətası:', watchingError);
      return res.status(500).json({ error: 'Verilənlər bazası sorğusunda xəta baş verdi' });
    }
    
    // Watched (İzlendi)
    const { count: watchedCount, error: watchedError } = await getClient()
      .from(TABLES.MOVIES)
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
    
    // Avatar klasörünün var olduğundan emin ol
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
    
    // Kullanıcıyı bul
    const { data: user, error: userError } = await getClient()
      .from(TABLES.USERS)
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
    
    // Avatar URL'ini oluştur
    const avatarUrl = `/uploads/avatars/${filename}`;
    
    // Veritabanını güncelle
    const { error: updateError } = await getClient()
      .from(TABLES.USERS)
      .update({ avatar: avatarUrl })
      .eq('id', userId);
    
    if (updateError) {
      console.error('Avatar yeniləmə xətası:', updateError);
      return res.status(500).json({ error: 'Avatar yeniləmə zamanı xəta baş verdi' });
    }
    
    res.json({ 
      success: true, 
      avatar: avatarUrl 
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
    const { data: user, error: userError } = await getClient()
      .from(TABLES.USERS)
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
      const avatarPath = path.join(UPLOADS_DIR, path.basename(user.avatar));
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
      
      // Veritabanını güncelle
      const { error: updateError } = await getClient()
        .from(TABLES.USERS)
        .update({ avatar: null })
        .eq('id', userId);
      
      if (updateError) {
        console.error('Avatar silmə xətası:', updateError);
        return res.status(500).json({ error: 'Avatar silmə zamanı xəta baş verdi' });
      }
      
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'İstifadəçinin avatarı yoxdur' });
    }
  } catch (error) {
    console.error('Avatar silmə xətası:', error);
    res.status(500).json({ error: 'Avatar silmə zamanı xəta baş verdi' });
  }
}; 
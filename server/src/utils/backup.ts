import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

const BACKUP_DIR = path.join(__dirname, '../../backups');
const MAX_BACKUPS = 3; // Maksimum yedek sayısı

// Yedekleri limitlemek için yardımcı fonksiyon
const cleanupBackups = () => {
  try {
    // Mevcut yedekleri listele
    const backups = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.endsWith('.db'))
      .map(file => ({
        name: file,
        path: path.join(BACKUP_DIR, file),
        date: new Date(file.replace('kinosu-', '').replace('.db', '').replace(/-/g, ':')),
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime()); // Yeni yedekler önce
    
    // Eğer MAX_BACKUPS'dan fazla yedek varsa, eski olanları sil
    if (backups.length > MAX_BACKUPS) {
      // Silinecek yedekleri belirle
      const backupsToDelete = backups.slice(MAX_BACKUPS);
      
      // Eski yedekleri sil
      backupsToDelete.forEach(backup => {
        fs.unlinkSync(backup.path);
      });
    }
  } catch (error) {
    console.error('Yedekleri temizlerken xəta baş verdi:', error);
  }
};

export const createBackup = () => {
  // Yedəkləmə qovluğunu yarat
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const date = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(BACKUP_DIR, `kinosu-${date}.db`);

  try {
    // Mövcud verilənlər bazasını kopyala
    fs.copyFileSync('kinosu.db', backupPath);
    
    // Yedek sayısını sınırla
    cleanupBackups();
    
    return backupPath;
  } catch (error) {
    console.error('Yedəkləmə zamanı xəta baş verdi:', error);
    throw error;
  }
};

export const restoreBackup = (backupPath: string) => {
  try {
    // Yedəkdən bərpa et
    fs.copyFileSync(backupPath, 'kinosu.db');
  } catch (error) {
    console.error('Bərpa zamanı xəta baş verdi:', error);
    throw error;
  }
};

export const listBackups = () => {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      return [];
    }
    return fs.readdirSync(BACKUP_DIR)
      .filter(file => file.endsWith('.db'))
      .map(file => ({
        name: file,
        path: path.join(BACKUP_DIR, file),
        date: new Date(file.replace('kinosu-', '').replace('.db', '').replace(/-/g, ':')),
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  } catch (error) {
    console.error('Yedekleri listelerken xəta baş verdi:', error);
    return [];
  }
}; 
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listBackups = exports.restoreBackup = exports.createBackup = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const BACKUP_DIR = path_1.default.join(__dirname, '../../backups');
const MAX_BACKUPS = 3; // Maksimum yedek sayısı
// Yedekleri limitlemek için yardımcı fonksiyon
const cleanupBackups = () => {
    try {
        // Mevcut yedekleri listele
        const backups = fs_1.default.readdirSync(BACKUP_DIR)
            .filter(file => file.endsWith('.db'))
            .map(file => ({
            name: file,
            path: path_1.default.join(BACKUP_DIR, file),
            date: new Date(file.replace('kinosu-', '').replace('.db', '').replace(/-/g, ':')),
        }))
            .sort((a, b) => b.date.getTime() - a.date.getTime()); // Yeni yedekler önce
        // Eğer MAX_BACKUPS'dan fazla yedek varsa, eski olanları sil
        if (backups.length > MAX_BACKUPS) {
            // Silinecek yedekleri belirle
            const backupsToDelete = backups.slice(MAX_BACKUPS);
            // Eski yedekleri sil
            backupsToDelete.forEach(backup => {
                fs_1.default.unlinkSync(backup.path);
            });
        }
    }
    catch (error) {
        console.error('Yedekleri temizlerken xəta baş verdi:', error);
    }
};
const createBackup = () => {
    // Yedəkləmə qovluğunu yarat
    if (!fs_1.default.existsSync(BACKUP_DIR)) {
        fs_1.default.mkdirSync(BACKUP_DIR, { recursive: true });
    }
    const date = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path_1.default.join(BACKUP_DIR, `kinosu-${date}.db`);
    try {
        // Mövcud verilənlər bazasını kopyala
        fs_1.default.copyFileSync('kinosu.db', backupPath);
        // Yedek sayısını sınırla
        cleanupBackups();
        return backupPath;
    }
    catch (error) {
        console.error('Yedəkləmə zamanı xəta baş verdi:', error);
        throw error;
    }
};
exports.createBackup = createBackup;
const restoreBackup = (backupPath) => {
    try {
        // Yedəkdən bərpa et
        fs_1.default.copyFileSync(backupPath, 'kinosu.db');
    }
    catch (error) {
        console.error('Bərpa zamanı xəta baş verdi:', error);
        throw error;
    }
};
exports.restoreBackup = restoreBackup;
const listBackups = () => {
    try {
        if (!fs_1.default.existsSync(BACKUP_DIR)) {
            return [];
        }
        return fs_1.default.readdirSync(BACKUP_DIR)
            .filter(file => file.endsWith('.db'))
            .map(file => ({
            name: file,
            path: path_1.default.join(BACKUP_DIR, file),
            date: new Date(file.replace('kinosu-', '').replace('.db', '').replace(/-/g, ':')),
        }))
            .sort((a, b) => b.date.getTime() - a.date.getTime());
    }
    catch (error) {
        console.error('Yedekleri listelerken xəta baş verdi:', error);
        return [];
    }
};
exports.listBackups = listBackups;

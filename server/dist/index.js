"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const auth_1 = __importDefault(require("./routes/auth"));
const movies_1 = __importDefault(require("./routes/movies"));
const user_1 = __importDefault(require("./routes/user"));
const rateLimiter_1 = require("./middleware/rateLimiter");
const dotenv_1 = __importDefault(require("dotenv"));
const backup_1 = require("./utils/backup");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// .env faylını yüklə
dotenv_1.default.config();
const app = (0, express_1.default)();
const db = new better_sqlite3_1.default('kinosu.db');
// Uploads klasörünü oluştur (yoksa)
const uploadsDir = path_1.default.join(__dirname, '../uploads');
const tempDir = path_1.default.join(__dirname, '../uploads/temp');
const avatarsDir = path_1.default.join(__dirname, '../uploads/avatars');
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs_1.default.existsSync(tempDir)) {
    fs_1.default.mkdirSync(tempDir, { recursive: true });
}
if (!fs_1.default.existsSync(avatarsDir)) {
    fs_1.default.mkdirSync(avatarsDir, { recursive: true });
}
// Avtomatik yedəkləmə üçün interval (24 saat)
const BACKUP_INTERVAL = 24 * 60 * 60 * 1000;
// İlk yedəkləməni yarat
(0, backup_1.createBackup)();
// Dövri yedəkləmə
setInterval(backup_1.createBackup, BACKUP_INTERVAL);
// Verilənlər bazası cədvəllərini yarat
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    email TEXT,
    reset_token TEXT,
    reset_token_expiry INTEGER,
    avatar TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS movies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    imdb_id TEXT,
    poster TEXT,
    imdb_rating REAL,
    user_rating INTEGER,
    status TEXT CHECK(status IN ('watchlist', 'watching', 'watched')) NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );
`);
// CORS konfigürasyonu
app.use((0, cors_1.default)({
    origin: [
        'https://your-frontend-app.onrender.com',
        'http://localhost:3000'
    ]
}));
app.use(express_1.default.json());
app.use(rateLimiter_1.rateLimiter);
// Static dosya sunucusu
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// API Routes
app.use('/api/auth', auth_1.default);
app.use('/api/movies', movies_1.default);
app.use('/api/user', user_1.default);
// Frontend statik dosyalarını sunma - dağıtım klasörü
const distPath = path_1.default.join(__dirname, '../../dist');
// Frontend build dosyalarını sunmak için statik middleware
if (fs_1.default.existsSync(distPath)) {
    console.log('Frontend statik dosyaları bulundu, sunuluyor:', distPath);
    app.use(express_1.default.static(distPath));
    // SPA için tüm diğer istekleri index.html'e yönlendir
    app.get('*', (req, res) => {
        // API isteklerini hariç tut
        if (!req.path.startsWith('/api/') && !req.path.startsWith('/uploads/')) {
            res.sendFile(path_1.default.join(distPath, 'index.html'));
        }
    });
}
else {
    console.log('Frontend build dosyaları bulunamadı:', distPath);
}
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
// Tətbiq bağlandıqda yedəkləmə
process.on('SIGINT', () => {
    console.log('Tətbiq bağlanır, son yedəkləmə aparılır...');
    (0, backup_1.createBackup)();
    process.exit(0);
});
process.on('SIGTERM', () => {
    console.log('Tətbiq bağlanır, son yedəkləmə aparılır...');
    (0, backup_1.createBackup)();
    process.exit(0);
});

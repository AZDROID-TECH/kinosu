import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import authRoutes from './routes/auth';
import movieRoutes from './routes/movies';
import userRoutes from './routes/user';
import { rateLimiter } from './middleware/rateLimiter';
import dotenv from 'dotenv';
import { createBackup } from './utils/backup';
import path from 'path';
import fs from 'fs';

// .env faylını yüklə
dotenv.config();

const app = express();
const db = new Database('kinosu.db');

// Uploads klasörünü oluştur (yoksa)
const uploadsDir = path.join(__dirname, '../uploads');
const tempDir = path.join(__dirname, '../uploads/temp');
const avatarsDir = path.join(__dirname, '../uploads/avatars');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}

// Avtomatik yedəkləmə üçün interval (24 saat)
const BACKUP_INTERVAL = 24 * 60 * 60 * 1000;

// İlk yedəkləməni yarat
createBackup();

// Dövri yedəkləmə
setInterval(createBackup, BACKUP_INTERVAL);

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

// CORS parametrləri
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'];
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // İzin verilen kökenleri kontrol et
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(rateLimiter);

// Static dosya sunucusu
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/user', userRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda işləyir`);
});

// Tətbiq bağlandıqda yedəkləmə
process.on('SIGINT', () => {
  console.log('Tətbiq bağlanır, son yedəkləmə aparılır...');
  createBackup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Tətbiq bağlanır, son yedəkləmə aparılır...');
  createBackup();
  process.exit(0);
}); 
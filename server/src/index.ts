import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import movieRoutes from './routes/movies';
import userRoutes from './routes/user';
import { rateLimiter } from './middleware/rateLimiter';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { TABLES, getClient } from './utils/supabase';

// .env faylını yüklə
dotenv.config();

const app = express();

// Uploads klasörünü oluştur (yoksa)
const uploadsDir = path.join(__dirname, '../uploads');
const tempDir = path.join(__dirname, '../uploads/temp');
const avatarsDir = path.join(__dirname, '../uploads/avatars');

try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  if (!fs.existsSync(avatarsDir)) {
    fs.mkdirSync(avatarsDir, { recursive: true });
  }
} catch (error) {
  console.error('Uploads klasörü oluşturulurken hata:', error);
  // Hata olsa bile uygulamanın çalışmasına devam et
}

// Supabase cədvəl strukturunu yoxla və yarat (əgər yoxdursa)
const initializeDatabase = async () => {
  try {
    const client = getClient();
    
    // Rate Limits tablosunu kontrol et
    try {
      await client
        .from('rate_limits')
        .select('ip')
        .limit(1);
    } catch (error) {
      // Sessizce devam et
    }
    
    // USERS tablosunu kontrol et
    try {
      await client
        .from(TABLES.USERS)
        .select('id')
        .limit(1);
    } catch (error) {
      // Sessizce devam et
    }
    
    // MOVIES tablosunu kontrol et
    try {
      await client
        .from(TABLES.MOVIES)
        .select('id')
        .limit(1);
    } catch (error) {
      // Sessizce devam et
    }
  } catch (error) {
    // Sessizce devam et
  }
};

// Verilənlər bazası strukturunu yoxla
initializeDatabase();

// Basit CORS yapılandırması - frontend ve backend aynı domainde çalıştığı için minimalist
app.use(cors());

app.use(express.json());
app.use(rateLimiter);

// Static dosya sunucusu
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/user', userRoutes);

// Frontend statik dosyalarını sunma - dağıtım klasörü
const distPath = path.join(__dirname, '../public');

// Frontend build dosyalarını sunmak için statik middleware
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  
  // SPA için tüm diğer istekleri index.html'e yönlendir
  app.get('*', (req, res) => {
    // API isteklerini hariç tut
    if (!req.path.startsWith('/api/') && !req.path.startsWith('/uploads/')) {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Frontend dosyaları bulunamadı');
      }
    }
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda işləyir`);
}); 
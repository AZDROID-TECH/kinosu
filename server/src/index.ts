import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import movieRoutes from './routes/movies';
import userRoutes from './routes/user';
import { rateLimiter } from './middleware/rateLimiter';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { supabase, TABLES } from './utils/supabase';

// .env faylını yüklə
dotenv.config();

const app = express();

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

// Supabase cədvəl strukturunu yoxla və yarat (əgər yoxdursa)
const initializeDatabase = async () => {
  try {
    // Yoxla və ya yarat USERS cədvəlini 
    const { error: usersTableError } = await supabase
      .from(TABLES.USERS)
      .select('id')
      .limit(1);
    
    if (usersTableError && usersTableError.code === '42P01') {
      console.log('Users cədvəli yoxdur, yaradılır...');
      // Burada SQL sorğuları ilə cədvəl yarada bilərsiniz, lakin
      // Supabase Dashboard üzərindən yaratmaq daha məqsədəuyğundur
    }

    // Yoxla və ya yarat MOVIES cədvəlini
    const { error: moviesTableError } = await supabase
      .from(TABLES.MOVIES)
      .select('id')
      .limit(1);
    
    if (moviesTableError && moviesTableError.code === '42P01') {
      console.log('Movies cədvəli yoxdur, yaradılır...');
      // Burada SQL sorğuları ilə cədvəl yarada bilərsiniz, lakin
      // Supabase Dashboard üzərindən yaratmaq daha məqsədəuyğundur
    }

    console.log('Verilənlər bazası strukturu yoxlanıldı.');
  } catch (error) {
    console.error('Verilənlər bazası başlatma xətası:', error);
  }
};

// Verilənlər bazası strukturunu yoxla
initializeDatabase();

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

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/user', userRoutes);

// Frontend statik dosyalarını sunma - dağıtım klasörü
const distPath = path.join(__dirname, '../public');

// Frontend build dosyalarını sunmak için statik middleware
if (fs.existsSync(distPath)) {
  console.log('Frontend statik dosyaları bulundu, sunuluyor:', distPath);
  app.use(express.static(distPath));
  
  // SPA için tüm diğer istekleri index.html'e yönlendir
  app.get('*', (req, res) => {
    // API isteklerini hariç tut
    if (!req.path.startsWith('/api/') && !req.path.startsWith('/uploads/')) {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        console.log('Frontend index.html dosyası bulunamadı:', indexPath);
        res.status(404).send('Frontend dosyaları bulunamadı');
      }
    }
  });
} else {
  console.log('Frontend build dosyaları bulunamadı:', distPath);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda işləyir`);
});

// Yeni verilənlər bazasında yedəkləməyə ehtiyac olmadığı üçün, bu hissələri siliyoruz 
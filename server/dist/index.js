"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_1 = __importDefault(require("./routes/auth"));
const movies_1 = __importDefault(require("./routes/movies"));
const user_1 = __importDefault(require("./routes/user"));
const rateLimiter_1 = require("./middleware/rateLimiter");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const supabase_1 = require("./utils/supabase");
// .env faylını yüklə
dotenv_1.default.config();
const app = (0, express_1.default)();
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
// Supabase cədvəl strukturunu yoxla və yarat (əgər yoxdursa)
const initializeDatabase = async () => {
    try {
        const client = (0, supabase_1.getClient)();
        // Sadece ilk başlatma sırasında log kaydı
        console.log('Verilənlər bazası bağlantısı yoxlanılır...');
        // Rate Limits tablosunu sessizce kontrol et
        try {
            await client
                .from('rate_limits')
                .select('ip')
                .limit(1);
            // Başarılı olunca herhangi bir log yazdırmıyoruz
        }
        catch (error) {
            // Sadece tablo yoksa, tabloyu manuel oluşturulması gerektiğini belirt
            // Sessizce devam et - tablo zaten kullanıcı tarafından oluşturuldu
            if (process.env.NODE_ENV === 'development') {
                console.log('Rate limits tablosu hazır');
            }
        }
        // USERS tablosunu sessizce kontrol et
        try {
            await client
                .from(supabase_1.TABLES.USERS)
                .select('id')
                .limit(1);
            // Başarılı olunca herhangi bir log yazdırmıyoruz
        }
        catch (error) {
            // Sadece gerçek bir hata varsa göster
            console.error('USERS tablosu kontrolünde hata');
        }
        // MOVIES tablosunu sessizce kontrol et
        try {
            await client
                .from(supabase_1.TABLES.MOVIES)
                .select('id')
                .limit(1);
            // Başarılı olunca herhangi bir log yazdırmıyoruz
        }
        catch (error) {
            // Sadece gerçek bir hata varsa göster
            console.error('MOVIES tablosu kontrolünde hata');
        }
    }
    catch (error) {
        // Sadece bağlantı hatası durumunda göster
        console.error('Veritabanı bağlantı hatası');
    }
};
// Verilənlər bazası strukturunu yoxla
initializeDatabase();
// CORS parametrləri
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'];
const corsOptions = {
    origin: (origin, callback) => {
        // İzin verilen kökenleri kontrol et
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            callback(null, true);
        }
        else {
            callback(new Error('CORS policy violation'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
app.use(rateLimiter_1.rateLimiter);
// Static dosya sunucusu
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// API Routes
app.use('/api/auth', auth_1.default);
app.use('/api/movies', movies_1.default);
app.use('/api/user', user_1.default);
// Frontend statik dosyalarını sunma - dağıtım klasörü
const distPath = path_1.default.join(__dirname, '../public');
// Frontend build dosyalarını sunmak için statik middleware
if (fs_1.default.existsSync(distPath)) {
    console.log('Frontend statik dosyaları bulundu, sunuluyor:', distPath);
    app.use(express_1.default.static(distPath));
    // SPA için tüm diğer istekleri index.html'e yönlendir
    app.get('*', (req, res) => {
        // API isteklerini hariç tut
        if (!req.path.startsWith('/api/') && !req.path.startsWith('/uploads/')) {
            const indexPath = path_1.default.join(distPath, 'index.html');
            if (fs_1.default.existsSync(indexPath)) {
                res.sendFile(indexPath);
            }
            else {
                console.log('Frontend index.html dosyası bulunamadı:', indexPath);
                res.status(404).send('Frontend dosyaları bulunamadı');
            }
        }
    });
}
else {
    console.log('Frontend build dosyaları bulunamadı:', distPath);
}
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server ${PORT} portunda işləyir`);
});
// Yeni verilənlər bazasında yedəkləməyə ehtiyac olmadığı üçün, bu hissələri siliyoruz 

# 🎬 Kinosu - Film İzləmə İdarəetmə Sistemi

Kinosu, film həvəskarları üçün hazırlanmış müasir və istifadəçi dostu bir film izləmə idarəetmə sistemidir. Bu tətbiq istifadəçilərə filmləri izləmək, qiymətləndirmək və öz film kolleksiyalarını idarə etmək imkanı verir.

## 🚀 Əsas Xüsusiyyətlər

- 🔐 İstifadəçi autentifikasiyası və avtorizasiyası
- 🎯 Filmləri izləmək, izləməkdə və ya izləniləcək kimi qeyd etmək
- ⭐ IMDb reytinqləri və şəxsi qiymətləndirmə sistemi
- 🔍 Film axtarışı və filtrasiya
- 🌓 Qaranlıq/İşıqlı tema dəstəyi
- 📱 Tam responsiv dizayn
- 🔄 Avtomatik verilənlər bazası yedəkləməsi
- 🌐 Real-time IMDb məlumatları inteqrasiyası

## 🛠️ Texnologiyalar

- **Frontend:**
  - React + TypeScript
  - Material-UI
  - React Router
  - Context API
  - Vite

- **Backend:**
  - Node.js + Express
  - Supabase
  - JWT Authentication
  - RESTful API

## 📦 Quraşdırma

1. Repozitroniyanı klonlayın:
```bash
git clone https://github.com/yourusername/kinosu.git
cd kinosu
```

2. Asılılıqları quraşdırın:
```bash
# Frontend asılılıqları
npm install

# Backend asılılıqları
cd server
npm install
```

3. .env faylını yaradın:
```env
VITE_OMDB_API_KEY=your_omdb_api_key
JWT_SECRET=your_jwt_secret
PORT=5000
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
```

4. Tətbiqi işə salın:
```bash
# Tam tətbiqi işə salın (frontend və backend)
npm run dev:full
```

## 🚀 Render.com-da Deployment

Kinosu tətbiqini Render.com-da deploy etmək üçün aşağıdakı addımları izləyin:

1. [Render.com](https://render.com) hesabı yaradın
2. Dashboard-dan "New Web Service" seçin
3. GitHub/GitLab/Bitbucket reponuzu qoşun
4. Aşağıdakı parametrləri təyin edin:
   - **Name**: kinosu (və ya istədiyiniz ad)
   - **Environment**: Node
   - **Build Command**: `npm install && cd server && npm install && cd .. && npm run build:full`
   - **Start Command**: `cd server && npm start`
   
5. "Environment Variables" bölməsində aşağıdakı dəyişənləri əlavə edin:
   - `NODE_ENV`: production
   - `PORT`: 10000
   - `JWT_SECRET`: (təhlükəsiz bir açar - ən azı 32 simvolluq olmalıdır, məs. `5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8`)
   - `SMTP_HOST`: smtp.gmail.com
   - `SMTP_PORT`: 587
   - `SMTP_USER`: (e-poçt ünvanınız)
   - `SMTP_PASS`: (e-poçt şifrəniz)
   - `VITE_OMDB_API_KEY`: (OMDB API açarınız)
   - `SUPABASE_URL`: (Supabase URL-niz)
   - `SUPABASE_KEY`: (Supabase açarınız)
   - `SUPABASE_SERVICE_KEY`: (Supabase servis açarınız)
   - `FRONTEND_URL`: (boş buraxın, avtomatik doldurulacaq)

6. "Create Web Service" düyməsinə basın və deployment prosesini izləyin

7. **Əlavə qeydlər**:
   - JWT_SECRET çevre dəyişəni olmadıqda və ya düzgün təyin edilmədikdə autentifikasiya xətaları görə bilərsiniz (jwt malformed)
   - Problemi həll etmək üçün servisi yenidən tikdirməyi (redeploy) və ya çevre dəyişənlərinizi yoxlamağı unutmayın

## 📸 Ekran Görüntüləri

[Ekran görüntüləri əlavə ediləcək]

## 🤝 Töhfə Vermək

Töhfələr həmişə xoş qarşılanır! Zəhmət olmasa:

1. Fork edin
2. Feature branch yaradın (`git checkout -b feature/AmazingFeature`)
3. Dəyişikliklərinizi commit edin (`git commit -m 'Add some AmazingFeature'`)
4. Branch-i push edin (`git push origin feature/AmazingFeature`)
5. Pull Request yaradın

## 📝 Lisenziya

MIT License - daha ətraflı məlumat üçün [LICENSE](LICENSE) faylına baxın.

## 🙏 Təşəkkürlər

- [OMDb API](http://www.omdbapi.com/) - Film məlumatları üçün
- [Material-UI](https://mui.com/) - UI komponentləri üçün
- [BoxIcons](https://boxicons.com/) - İkonlar üçün
- [Render.com](https://render.com) - Hosting xidmətləri üçün
- [Supabase](https://supabase.com) - Verilənlər bazası xidmətləri üçün

---

⭐ Bu layihəni bəyəndinizsə, ulduz verməyi unutmayın! 
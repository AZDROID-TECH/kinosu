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
  - SQLite
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
```

4. Tətbiqi işə salın:
```bash
# Backend serverini işə salın
cd server
npm run dev

# Yeni terminal pəncərəsində frontend-i işə salın
cd ..
npm run dev
```

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

---

⭐ Bu layihəni bəyəndinizsə, ulduz verməyi unutmayın! 
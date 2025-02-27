import express from 'express';
import multer from 'multer';
import path from 'path';
import { getProfile, uploadAvatar, deleteAvatar } from '../controllers/userController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Geçici dosya yükleme yolu
const upload = multer({ 
  dest: 'uploads/temp',
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB boyut sınırı
  },
  fileFilter: (req, file, cb) => {
    // Sadece resim dosyalarını kabul et
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Sadəcə şəkil faylları qəbul edilir (JPG, PNG, GIF, WEBP)'));
    }
  }
});

// Profil bilgilerini getir
router.get('/profile', authenticateToken, getProfile);

// Avatar yükle
router.post('/avatar', authenticateToken, upload.single('avatar'), uploadAvatar);

// Avatar sil
router.delete('/avatar', authenticateToken, deleteAvatar);

export default router; 
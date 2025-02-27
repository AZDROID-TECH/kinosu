"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Geçici dosya yükleme yolu
const upload = (0, multer_1.default)({
    dest: 'uploads/temp',
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB boyut sınırı
    },
    fileFilter: (req, file, cb) => {
        // Sadece resim dosyalarını kabul et
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Sadəcə şəkil faylları qəbul edilir (JPG, PNG, GIF, WEBP)'));
        }
    }
});
// Profil bilgilerini getir
router.get('/profile', auth_1.authenticateToken, userController_1.getProfile);
// Avatar yükle
router.post('/avatar', auth_1.authenticateToken, upload.single('avatar'), userController_1.uploadAvatar);
// Avatar sil
router.delete('/avatar', auth_1.authenticateToken, userController_1.deleteAvatar);
exports.default = router;

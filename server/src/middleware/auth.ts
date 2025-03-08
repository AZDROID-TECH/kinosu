// Autentifikasiya middleware
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Kök dizinde otomatik olarak .env yüklenir
dotenv.config();

// Fallback için sabit anahtar ama Render.com'da çevre değişkeni kullanılacak
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';

// JWT_SECRET kontrolü ve uyarı
if (!process.env.JWT_SECRET) {
  console.warn('UYARI: JWT_SECRET çevre değişkeni ayarlanmamış! Varsayılan güvenli olmayan anahtar kullanılıyor.');
}

interface JwtPayload {
  id: number;
  username: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        username: string;
      };
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Giriş etmək lazımdır' });
  }

  try {
    // Önce token içeriğini doğrulamadan decode et (sadece içeriği görmek için)
    let decodedInfo: JwtPayload | null = null;
    try {
      decodedInfo = jwt.decode(token) as JwtPayload;
    } catch (decodeError) {
      // Decode hatası varsa sessizce devam et
    }
    
    // Token'ı doğrula
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    
    // Tutarlı yapı için id'yi userId olarak ata
    req.user = {
      userId: decoded.id,
      username: decoded.username
    };
    
    next();
  } catch (error) {
    // Özelleştirilmiş hata mesajı oluştur
    if (error instanceof jwt.TokenExpiredError) {
      const username = decodedInfo?.username || 'bilinməyən istifadəçi';
      console.log(`Token müddəti bitdiyi üçün "${username}" istifadəçi sessiyası bağlandı`);
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.log('Yanlış formatda token aşkar edildi');
    } else {
      console.log('Token doğrulama zamanı xəta baş verdi');
    }
    
    return res.status(403).json({ error: 'Token etibarsızdır' });
  }
}; 
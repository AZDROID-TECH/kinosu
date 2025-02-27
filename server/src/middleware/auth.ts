// Autentifikasiya middleware
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';

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
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    
    // Tutarlı yapı için id'yi userId olarak ata
    req.user = {
      userId: decoded.id,
      username: decoded.username
    };
    
    next();
  } catch (error) {
    console.error('Token doğrulama xətası:', error);
    return res.status(403).json({ error: 'Token etibarsızdır' });
  }
}; 
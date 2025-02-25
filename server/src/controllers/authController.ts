import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Database from 'better-sqlite3';

interface User {
  id: number;
  username: string;
  password: string;
}

const db = new Database('kinosu.db');
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';

export const register = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const stmt = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
    stmt.run(username, hashedPassword);

    res.status(201).json({ message: 'İstifadəçi uğurla qeydiyyatdan keçdi' });
  } catch (error) {
    res.status(500).json({ error: 'Qeydiyyat zamanı xəta baş verdi' });
  }
};

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    const user = stmt.get(username) as User | undefined;

    if (!user) {
      return res.status(401).json({ error: 'İstifadəçi adı və ya şifrə yanlışdır' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'İstifadəçi adı və ya şifrə yanlışdır' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: 'Giriş zamanı xəta baş verdi' });
  }
}; 
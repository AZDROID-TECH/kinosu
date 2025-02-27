import { Request, Response } from 'express';
import Database from 'better-sqlite3';
import axios from 'axios';

interface Movie {
  id: number;
  user_id: number;
  title: string;
  imdb_id: string;
  poster: string;
  imdb_rating: number;
  user_rating: number;
  status: 'watchlist' | 'watching' | 'watched';
  created_at: string;
}

interface IMDbMovie {
  Title: string;
  imdbID: string;
  Poster: string;
  imdbRating: string;
  Year: string;
  Genre: string;
}

const db = new Database('kinosu.db');
const OMDB_API_KEY = process.env.VITE_OMDB_API_KEY || 'b567a8f1';

export const getMovies = (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.userId) {
      console.error('getMovies: İstifadəçi kimliyi yok veya geçersiz', { user: req.user });
      return res.status(401).json({ error: 'İstifadəçi tapılmadı' });
    }

    const userId = req.user.userId;

    const stmt = db.prepare('SELECT * FROM movies WHERE user_id = ?');
    const movies = stmt.all(userId) as Movie[];
    
    res.json(movies);
  } catch (error) {
    console.error('Filmləri gətirərkən xəta:', error);
    res.status(500).json({ error: 'Filmləri gətirərkən xəta baş verdi' });
  }
};

export const searchMovies = async (req: Request, res: Response) => {
  try {
    const searchResponse = await axios.get(`http://www.omdbapi.com/?apikey=${OMDB_API_KEY}&s=${req.params.query}`);
    
    if (searchResponse.data.Search) {
      const detailedMovies = await Promise.all(
        searchResponse.data.Search.map(async (movie: IMDbMovie) => {
          const detailResponse = await axios.get(`http://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${movie.imdbID}`);
          return {
            ...movie,
            imdbRating: detailResponse.data.imdbRating,
            Year: detailResponse.data.Year,
            Genre: detailResponse.data.Genre
          };
        })
      );
      res.json({ Search: detailedMovies });
    } else {
      res.json({ Search: [] });
    }
  } catch (error) {
    res.status(500).json({ error: 'Film axtarışı zamanı xəta baş verdi' });
  }
};

export const addMovie = (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.userId) {
      console.error('addMovie: İstifadəçi kimliyi yok veya geçersiz', { user: req.user });
      return res.status(401).json({ error: 'İstifadəçi tapılmadı' });
    }

    const userId = req.user.userId;
    const { title, imdb_id, poster, imdb_rating, status } = req.body;

    const stmt = db.prepare(`
      INSERT INTO movies (user_id, title, imdb_id, poster, imdb_rating, status, user_rating)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `);
    
    const result = stmt.run(userId, title, imdb_id, poster, imdb_rating, status);
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: 'Film əlavə edilərkən xəta baş verdi' });
  }
};

export const updateMovie = (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.userId) {
      console.error('updateMovie: İstifadəçi kimliyi yok veya geçersiz', { user: req.user });
      return res.status(401).json({ error: 'İstifadəçi tapılmadı' });
    }

    const userId = req.user.userId;
    const movieId = req.params.id;
    const { status, user_rating } = req.body;

    let query = 'UPDATE movies SET';
    const params: any[] = [];

    if (status !== undefined) {
      query += ' status = ?,';
      params.push(status);
    }
    if (user_rating !== undefined) {
      query += ' user_rating = ?,';
      params.push(user_rating);
    }

    query = query.slice(0, -1);
    query += ' WHERE id = ? AND user_id = ?';
    params.push(movieId, userId);

    const stmt = db.prepare(query);
    stmt.run(...params);
    
    res.json({ message: 'Film uğurla yeniləndi' });
  } catch (error) {
    res.status(500).json({ error: 'Film yeniləmə zamanı xəta baş verdi' });
  }
};

export const deleteMovie = (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.userId) {
      console.error('deleteMovie: İstifadəçi kimliyi yok veya geçersiz', { user: req.user });
      return res.status(401).json({ error: 'İstifadəçi tapılmadı' });
    }

    const userId = req.user.userId;
    const movieId = req.params.id;

    const stmt = db.prepare('DELETE FROM movies WHERE id = ? AND user_id = ?');
    stmt.run(movieId, userId);
    res.json({ message: 'Film uğurla silindi' });
  } catch (error) {
    res.status(500).json({ error: 'Film silinərkən xəta baş verdi' });
  }
}; 
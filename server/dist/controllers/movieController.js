"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMovie = exports.updateMovie = exports.addMovie = exports.searchMovies = exports.getMovies = void 0;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const axios_1 = __importDefault(require("axios"));
const db = new better_sqlite3_1.default('kinosu.db');
const OMDB_API_KEY = process.env.VITE_OMDB_API_KEY || 'b567a8f1';
const getMovies = (req, res) => {
    try {
        if (!req.user || !req.user.userId) {
            console.error('getMovies: İstifadəçi kimliyi yok veya geçersiz', { user: req.user });
            return res.status(401).json({ error: 'İstifadəçi tapılmadı' });
        }
        const userId = req.user.userId;
        console.log(`${userId} ID'li istifadəçi üçün filmlər alınır`);
        const stmt = db.prepare('SELECT * FROM movies WHERE user_id = ?');
        const movies = stmt.all(userId);
        console.log(`${movies.length} film tapıldı`);
        res.json(movies);
    }
    catch (error) {
        console.error('Filmləri gətirərkən xəta:', error);
        res.status(500).json({ error: 'Filmləri gətirərkən xəta baş verdi' });
    }
};
exports.getMovies = getMovies;
const searchMovies = async (req, res) => {
    try {
        const searchResponse = await axios_1.default.get(`http://www.omdbapi.com/?apikey=${OMDB_API_KEY}&s=${req.params.query}`);
        if (searchResponse.data.Search) {
            const detailedMovies = await Promise.all(searchResponse.data.Search.map(async (movie) => {
                const detailResponse = await axios_1.default.get(`http://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${movie.imdbID}`);
                return {
                    ...movie,
                    imdbRating: detailResponse.data.imdbRating,
                    Year: detailResponse.data.Year,
                    Genre: detailResponse.data.Genre
                };
            }));
            res.json({ Search: detailedMovies });
        }
        else {
            res.json({ Search: [] });
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Film axtarışı zamanı xəta baş verdi' });
    }
};
exports.searchMovies = searchMovies;
const addMovie = (req, res) => {
    try {
        if (!req.user || !req.user.userId) {
            console.error('addMovie: İstifadəçi kimliği yok veya geçersiz', { user: req.user });
            return res.status(401).json({ error: 'İstifadəçi tapılmadı' });
        }
        const userId = req.user.userId;
        const { title, imdb_id, poster, imdb_rating, status } = req.body;
        console.log(`Film əlavə edilir: ${title} - İstifadəçi: ${userId}`);
        const stmt = db.prepare(`
      INSERT INTO movies (user_id, title, imdb_id, poster, imdb_rating, status, user_rating)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `);
        const result = stmt.run(userId, title, imdb_id, poster, imdb_rating, status);
        res.status(201).json({ id: result.lastInsertRowid });
    }
    catch (error) {
        res.status(500).json({ error: 'Film əlavə edilərkən xəta baş verdi' });
    }
};
exports.addMovie = addMovie;
const updateMovie = (req, res) => {
    try {
        if (!req.user || !req.user.userId) {
            console.error('updateMovie: İstifadəçi kimliği yok veya geçersiz', { user: req.user });
            return res.status(401).json({ error: 'İstifadəçi tapılmadı' });
        }
        const userId = req.user.userId;
        const movieId = req.params.id;
        const { status, user_rating } = req.body;
        console.log(`Film yenilənir: ${movieId} - İstifadəçi: ${userId}`);
        let query = 'UPDATE movies SET';
        const params = [];
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
    }
    catch (error) {
        res.status(500).json({ error: 'Film yeniləmə zamanı xəta baş verdi' });
    }
};
exports.updateMovie = updateMovie;
const deleteMovie = (req, res) => {
    try {
        if (!req.user || !req.user.userId) {
            console.error('deleteMovie: İstifadəçi kimliği yok veya geçersiz', { user: req.user });
            return res.status(401).json({ error: 'İstifadəçi tapılmadı' });
        }
        const userId = req.user.userId;
        const movieId = req.params.id;
        console.log(`Film silinir: ${movieId} - İstifadəçi: ${userId}`);
        const stmt = db.prepare('DELETE FROM movies WHERE id = ? AND user_id = ?');
        stmt.run(movieId, userId);
        res.json({ message: 'Film uğurla silindi' });
    }
    catch (error) {
        res.status(500).json({ error: 'Film silinərkən xəta baş verdi' });
    }
};
exports.deleteMovie = deleteMovie;

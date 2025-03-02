"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMovie = exports.updateMovie = exports.addMovie = exports.searchMovies = exports.getMovies = void 0;
const axios_1 = __importDefault(require("axios"));
const supabase_1 = require("../utils/supabase");
const OMDB_API_KEY = process.env.VITE_OMDB_API_KEY || 'b567a8f1';
const getMovies = async (req, res) => {
    try {
        if (!req.user || !req.user.userId) {
            console.error('getMovies: İstifadəçi kimliyi yok veya geçersiz', { user: req.user });
            return res.status(401).json({ error: 'İstifadəçi tapılmadı' });
        }
        const userId = req.user.userId;
        const { data: movies, error } = await supabase_1.supabase
            .from(supabase_1.TABLES.MOVIES)
            .select('*')
            .eq('user_id', userId);
        if (error) {
            console.error('Supabase sorğu xətası:', error);
            return res.status(500).json({ error: 'Verilənlər bazası sorğusunda xəta baş verdi' });
        }
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
const addMovie = async (req, res) => {
    try {
        if (!req.user || !req.user.userId) {
            console.error('addMovie: İstifadəçi kimliyi yok veya geçersiz', { user: req.user });
            return res.status(401).json({ error: 'İstifadəçi tapılmadı' });
        }
        const userId = req.user.userId;
        const { title, imdb_id, poster, imdb_rating, status } = req.body;
        const { data, error } = await supabase_1.supabase
            .from(supabase_1.TABLES.MOVIES)
            .insert({
            user_id: userId,
            title,
            imdb_id,
            poster,
            imdb_rating,
            status,
            user_rating: 0
        })
            .select()
            .single();
        if (error) {
            console.error('Film əlavə edərkən Supabase xətası:', error);
            return res.status(500).json({ error: 'Film əlavə edilərkən xəta baş verdi' });
        }
        res.status(201).json({ id: data.id });
    }
    catch (error) {
        res.status(500).json({ error: 'Film əlavə edilərkən xəta baş verdi' });
    }
};
exports.addMovie = addMovie;
const updateMovie = async (req, res) => {
    try {
        if (!req.user || !req.user.userId) {
            console.error('updateMovie: İstifadəçi kimliyi yok veya geçersiz', { user: req.user });
            return res.status(401).json({ error: 'İstifadəçi tapılmadı' });
        }
        const userId = req.user.userId;
        const movieId = req.params.id;
        const { status, user_rating } = req.body;
        const updateData = {};
        if (status !== undefined) {
            updateData.status = status;
        }
        if (user_rating !== undefined) {
            updateData.user_rating = user_rating;
        }
        const { error } = await supabase_1.supabase
            .from(supabase_1.TABLES.MOVIES)
            .update(updateData)
            .eq('id', movieId)
            .eq('user_id', userId);
        if (error) {
            console.error('Film yeniləmə Supabase xətası:', error);
            return res.status(500).json({ error: 'Film yeniləmə zamanı xəta baş verdi' });
        }
        res.json({ message: 'Film uğurla yeniləndi' });
    }
    catch (error) {
        res.status(500).json({ error: 'Film yeniləmə zamanı xəta baş verdi' });
    }
};
exports.updateMovie = updateMovie;
const deleteMovie = async (req, res) => {
    try {
        if (!req.user || !req.user.userId) {
            console.error('deleteMovie: İstifadəçi kimliyi yok veya geçersiz', { user: req.user });
            return res.status(401).json({ error: 'İstifadəçi tapılmadı' });
        }
        const userId = req.user.userId;
        const movieId = req.params.id;
        const { error } = await supabase_1.supabase
            .from(supabase_1.TABLES.MOVIES)
            .delete()
            .eq('id', movieId)
            .eq('user_id', userId);
        if (error) {
            console.error('Film silmə Supabase xətası:', error);
            return res.status(500).json({ error: 'Film silinərkən xəta baş verdi' });
        }
        res.json({ message: 'Film uğurla silindi' });
    }
    catch (error) {
        res.status(500).json({ error: 'Film silinərkən xəta baş verdi' });
    }
};
exports.deleteMovie = deleteMovie;

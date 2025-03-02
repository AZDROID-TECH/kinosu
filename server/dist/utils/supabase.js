"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TABLES = exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
// .env faylını yüklə
dotenv_1.default.config();
// Supabase quraşdırmaları
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
if (!supabaseUrl || !supabaseKey) {
    console.error('SUPABASE_URL və ya SUPABASE_KEY tapılmadı. Zəhmət olmasa .env faylını yoxlayın.');
    process.exit(1);
}
// Supabase müştəri
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
// Cədvəl adları (table names)
exports.TABLES = {
    USERS: 'users',
    MOVIES: 'movies'
};

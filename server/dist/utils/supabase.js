"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TABLES = exports.supabaseAdmin = exports.supabase = void 0;
exports.getClient = getClient;
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
// .env faylını yüklə
dotenv_1.default.config();
// Supabase quraşdırmaları
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
if (!supabaseUrl || !supabaseKey) {
    console.error('SUPABASE_URL və ya SUPABASE_KEY tapılmadı. Zəhmət olmasa .env faylını yoxlayın.');
    process.exit(1);
}
// Standart Supabase müştəri (anon key)
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
// Əgər service key mövcuddursa, admin müştəri yaradın
exports.supabaseAdmin = supabaseServiceKey
    ? (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey)
    : null;
// Ən yaxşı əlçatan müştəri funksiyası
function getClient() {
    return exports.supabaseAdmin || exports.supabase;
}
// Cədvəl adları (table names)
exports.TABLES = {
    USERS: 'users',
    MOVIES: 'movies'
};

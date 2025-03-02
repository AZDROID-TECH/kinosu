"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimiter = void 0;
const supabase_1 = require("../utils/supabase");
// Rate limiter sabitlerini tanımla
const WINDOW_SIZE = 15 * 60 * 1000; // 15 dakika
const MAX_REQUESTS = 100; // 15 dakikada maksimum 100 istek
const rateLimiter = async (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();
    try {
        const client = (0, supabase_1.getClient)();
        // Mevcut limiti kontrol et
        const { data: limit, error: selectError } = await client
            .from('rate_limits')
            .select('*')
            .eq('ip', ip)
            .maybeSingle();
        if (selectError) {
            // Sadece development modunda log üret
            if (process.env.NODE_ENV === 'development') {
                console.error('Rate limit sorğu xətası:', selectError);
            }
            return next();
        }
        if (!limit) {
            // Yeni IP için kayıt oluştur
            const { error: insertError } = await client
                .from('rate_limits')
                .insert({
                ip: ip,
                requests: 1,
                reset_time: now + WINDOW_SIZE
            });
            if (insertError && process.env.NODE_ENV === 'development') {
                console.error('Rate limit yaratma xətası:', insertError);
            }
            return next();
        }
        if (now > limit.reset_time) {
            // Süre dolmuş, limiti sıfırla
            const { error: resetError } = await client
                .from('rate_limits')
                .update({
                requests: 1,
                reset_time: now + WINDOW_SIZE
            })
                .eq('ip', ip);
            if (resetError && process.env.NODE_ENV === 'development') {
                console.error('Rate limit yeniləmə xətası:', resetError);
            }
            return next();
        }
        if (limit.requests >= MAX_REQUESTS) {
            return res.status(429).json({
                error: 'Həddindən artıq sorğu. Zəhmət olmasa bir az gözləyin.',
                resetTime: new Date(limit.reset_time).toISOString()
            });
        }
        // İstek sayısını artır
        const { error: updateError } = await client
            .from('rate_limits')
            .update({
            requests: limit.requests + 1
        })
            .eq('ip', ip);
        if (updateError && process.env.NODE_ENV === 'development') {
            console.error('Rate limit artırma xətası:', updateError);
        }
        next();
    }
    catch (error) {
        // Kritik hataları her zaman göster
        console.error('Rate limiter error:', error);
        next();
    }
};
exports.rateLimiter = rateLimiter;

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('SUPABASE_URL ve ya SUPABASE_KEY tapılmadı. Zəhmət olmasa .env faylını yoxlayın.');
    process.exit(1);
}

// Supabase müştəri
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*');

        if (error) {
            console.error('Xəta:', error);
            return;
        }

        console.log('İstifadəçilər:', data);
        console.log(`Toplam ${data.length} istifadəçi tapıldı`);
    } catch (err) {
        console.error('Əməliyyat xətası:', err);
    }
}

checkUsers(); 
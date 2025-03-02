const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
require('dotenv').config({ path: '../.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('SUPABASE_URL və ya SUPABASE_KEY tapılmadı. Zəhmət olmasa .env faylını yoxlayın.');
    process.exit(1);
}

// Supabase müştəri
const supabase = createClient(supabaseUrl, supabaseKey);

async function testUserRegistration() {
    // 1. Tabloları kontrol et
    console.log('1. Supabase cədvəllərini yoxlayıram...');
    try {
        const { data: tables, error } = await supabase.from('users').select('id').limit(1);
        console.log('Mövcud cədvəllər:', tables ? 'users cədvəli mövcuddur' : 'users cədvəli tapılmadı');
        if (error) {
            console.error('Cədvəl yoxlama xətası:', error);
        }
    } catch (err) {
        console.error('Supabase sorğu xətası:', err);
    }

    // 2. API ile kullanıcı oluştur
    console.log('\n2. API ilə istifadəçi yaratmağa çalışıram...');
    try {
        const response = await axios.post('http://localhost:5000/api/auth/register', {
            username: 'testuser2',
            password: '123456',
            email: 'test2@example.com'
        });
        console.log('Cavab:', response.data);
    } catch (err) {
        console.error('API xətası:', err.response ? err.response.data : err.message);
    }

    // 3. Doğrudan Supabase ile kullanıcı oluştur
    console.log('\n3. Birbaşa Supabase ilə istifadəçi yaratmağa çalışıram...');
    try {
        const hashedPassword = 'hashed_password_placeholder'; // Gerçek uygulamada bcrypt ile hashlenmelidir
        const { data, error } = await supabase
            .from('users')
            .insert({
                username: 'directuser',
                password: hashedPassword,
                email: 'direct@example.com',
                created_at: new Date().toISOString()
            });

        if (error) {
            console.error('Birbaşa istifadəçi yaratma xətası:', error);
        } else {
            console.log('İstifadəçi uğurla yaradıldı:', data);
        }
    } catch (err) {
        console.error('Supabase sorğu xətası:', err);
    }

    // 4. Kullanıcıları listele
    console.log('\n4. Bütün istifadəçiləri yoxlayıram...');
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*');

        if (error) {
            console.error('İstifadəçi sorğu xətası:', error);
        } else {
            console.log(`${data.length} istifadəçi tapıldı:`);
            console.log(data);
        }
    } catch (err) {
        console.error('Supabase sorğu xətası:', err);
    }
}

testUserRegistration(); 
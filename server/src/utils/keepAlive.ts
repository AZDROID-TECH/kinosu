import axios from 'axios';

/**
 * Render.com ücretsiz planında sunucunun uyku moduna geçmesini önleyen yardımcı fonksiyon.
 * 15 dakikalık inaktivite sonrası uyku moduna geçmemesi için her 5 dakikada bir ping atar.
 */
export function setupKeepAlive(): void {
  // Sunucu URL'sini al veya varsayılan olarak kendi adresini kullan
  const appUrl = process.env.RENDER_EXTERNAL_URL || process.env.FRONTEND_URL;
  
  if (!appUrl) {
    console.log('Keep-alive için geçerli bir URL bulunamadı, ping devre dışı bırakıldı');
    return;
  }

  // Ping aralığını 5 dakikaya düşürdük (milisaniye cinsinden)
  const PING_INTERVAL = 5 * 60 * 1000; 
  
  console.log(`Keep-alive script aktif: Her ${PING_INTERVAL / 60000} dakikada bir ping atılacak - ${appUrl}`);

  let consecutiveFailures = 0;
  const MAX_FAILURES = 3;

  // Ping fonksiyonu
  const pingServer = async () => {
    try {
      // Rastgele bir sorgu parametresi ekleyerek önbelleğe alınmayı önle
      const timestamp = new Date().getTime();
      const response = await axios.get(`${appUrl}/api/health?t=${timestamp}`, {
        timeout: 10000 // 10 saniye timeout
      });
      
      if (response.status === 200) {
        const currentTime = new Date().toISOString();
        console.log(`[${currentTime}] Keep-alive ping başarılı: ${response.status}`);
        consecutiveFailures = 0; // Başarılı ping sonrası hata sayacını sıfırla
      } else {
        throw new Error(`Unexpected status: ${response.status}`);
      }
    } catch (error) {
      consecutiveFailures++;
      console.error(`Keep-alive ping hatası (${consecutiveFailures}/${MAX_FAILURES}):`, 
        error instanceof Error ? error.message : 'Bilinmeyen hata');
      
      // Üst üste belirli sayıda hata olursa ping URL'sini değiştirmeyi dene
      if (consecutiveFailures >= MAX_FAILURES) {
        console.log('Çok sayıda ping hatası, alternatif ping metodu deneniyor...');
        try {
          // Farklı bir endpoint dene
          await axios.get(`${appUrl}/?t=${new Date().getTime()}`, {
            timeout: 10000
          });
          console.log('Alternatif ping başarılı');
        } catch (altError) {
          console.error('Alternatif ping de başarısız:', 
            altError instanceof Error ? altError.message : 'Bilinmeyen hata');
        }
      }
    }
  };

  // İlk ping'i hemen atmak yerine 1 dakika sonra başlat
  // Bu, sunucunun tam olarak başlamasını sağlar
  setTimeout(() => {
    // İlk ping'i at
    pingServer();
    
    // Sonraki ping'leri düzenli aralıklarla gönder
    setInterval(pingServer, PING_INTERVAL);
    
    // Ek olarak, daha güvenilir olmak için farklı bir aralıkta da ping at
    // Bu, bir ping'in herhangi bir nedenle başarısız olma ihtimaline karşı ek güvenlik sağlar
    setInterval(() => {
      setTimeout(pingServer, 30000); // Ana intervale göre 30 saniye offset
    }, PING_INTERVAL);
    
  }, 60 * 1000); // 1 dakika sonra başlat
} 
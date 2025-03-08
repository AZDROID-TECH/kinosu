import axios from 'axios';

/**
 * Render.com ücretsiz planında sunucunun uyku moduna geçmesini önleyen yardımcı fonksiyon.
 * 15 dakikalık inaktivite sonrası uyku moduna geçmemesi için her 13 dakikada bir ping atar.
 */
export function setupKeepAlive(): void {
  // Ortam production değilse çalıştırma
  if (process.env.NODE_ENV !== 'production') {
    console.log('Keep-alive script yalnızca production ortamında çalışır');
    return;
  }

  // Sunucu URL'sini al veya varsayılan olarak kendi adresini kullan
  const appUrl = process.env.RENDER_EXTERNAL_URL || process.env.FRONTEND_URL;
  
  if (!appUrl) {
    console.log('Keep-alive için geçerli bir URL bulunamadı, ping devre dışı bırakıldı');
    return;
  }

  const PING_INTERVAL = 13 * 60 * 1000; // 13 dakika (milisaniye cinsinden)
  
  console.log(`Keep-alive script aktif: Her ${PING_INTERVAL / 60000} dakikada bir ping atılacak - ${appUrl}`);

  // İlk ping 1 dakika sonra başlat (sunucunun tam olarak başlaması için)
  setTimeout(() => {
    // Ping fonksiyonu
    const pingServer = async () => {
      try {
        const response = await axios.get(`${appUrl}/api/health`);
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] Keep-alive ping başarılı: ${response.status}`);
      } catch (error) {
        console.error('Keep-alive ping hatası:', error instanceof Error ? error.message : 'Bilinmeyen hata');
      }
    };

    // İlk ping'i hemen at
    pingServer();
    
    // Sonraki ping'leri düzenli aralıklarla gönder
    setInterval(pingServer, PING_INTERVAL);
  }, 60 * 1000); // 1 dakika sonra başlat
} 
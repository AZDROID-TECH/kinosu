// API yapılandırması
const getServerUrl = () => {
  // Development ortamında tüm istekler proxy üzerinden gideceği için base URL kullan
  // Bu sayede prefix'ler tam olarak dönüştürülecek
  return '';
};

// Çevre değişkeni varsa onu kullan, yoksa dinamik URL oluştur
export const API_URL = import.meta.env.VITE_API_URL || getServerUrl();

export const OMDB_API_KEY = import.meta.env.VITE_OMDB_API_KEY || 'b567a8f1'; 
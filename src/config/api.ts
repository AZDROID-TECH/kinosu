// API yapılandırması
const getServerUrl = () => {
  // Production ortamında API base URL boş bırakılabilir çünkü API ve frontend aynı sunucuda çalışacak
  // Development ortamında proxy kullanıldığından yine boş string yeterlidir
  return '';
};

// Çevre değişkeni varsa onu kullan, yoksa dinamik URL oluştur
export const API_URL = import.meta.env.VITE_API_URL || getServerUrl();

export const OMDB_API_KEY = import.meta.env.VITE_OMDB_API_KEY || 'b567a8f1'; 
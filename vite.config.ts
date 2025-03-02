import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Development için proxy API URL'si tanımlayalım
const DEV_API_URL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    cors: true,
    proxy: {
      // API istekleri için proxy yapılandırması
      // Frontend istekleri olduğu gibi backend'e iletilir ('/api' öneki korunur)
      '/api': {
        target: DEV_API_URL,
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
        },
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
        },
      },
      // Statik dosyalar (örn. profil fotoğrafları) için proxy yapılandırması
      // Backend'deki '/uploads' klasörüne erişim sağlar
      '/uploads': {
        target: DEV_API_URL,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
  },
}); 
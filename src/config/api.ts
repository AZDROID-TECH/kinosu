// API yapılandırması
const getServerUrl = () => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const port = import.meta.env.VITE_API_PORT || '5000';
  return `${protocol}//${hostname}:${port}/api`;
};

export const API_URL = import.meta.env.VITE_API_URL || getServerUrl();
export const OMDB_API_KEY = import.meta.env.VITE_OMDB_API_KEY || 'b567a8f1'; 
// Kullanılmayan API_URL kaldırıldı - backend ve frontend tek sunucuda çalıştığı için tüm API çağrıları göreceli URL kullanıyor

interface LoginData {
  username: string;
  password: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

interface MovieData {
  title: string;
  imdb_id: string;
  poster: string;
  imdb_rating: number;
  status: 'watchlist' | 'watching' | 'watched';
}

interface UserProfile {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
  createdAt: string;
  watchlist: {
    watchlist: number;
    watching: number;
    watched: number;
  };
}

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// Yardımcı hata ayıklama fonksiyonu
const handleApiResponse = async (response: Response) => {
  if (!response.ok) {
    const contentType = response.headers.get('content-type');
    let errorData: { error: string } = { error: 'Bilinməyən xəta' };
    
    try {
      if (contentType && contentType.includes('application/json')) {
        const jsonData = await response.json();
        if (typeof jsonData.error === 'string') {
          errorData = jsonData;
        } else if (jsonData.message) {
          errorData = { error: jsonData.message };
        } else {
          errorData = { error: 'API xətası' };
        }
      } else {
        errorData = { error: 'Server cavab vermədi' };
      }
    } catch {
      errorData = { error: 'Cavabı emal etmək mümkün olmadı' };
    }
    
    // Token ilə ilgili hata ise oturumu sonlandır (401 veya 403)
    if (response.status === 401 || response.status === 403) {
      // Sonsuz döngüyü önlemek için logout endpointi çağrılıyorsa işlemi atla
      if (!response.url.includes('/api/auth/logout')) {
        // Local storage'dan token ve kullanıcı adını temizle
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        
        // Kullanıcıyı login sayfasına yönlendir
        window.location.href = '/login';
      }
    }
    
    throw errorData;
  }
  
  return response.json();
};

export const authAPI = {
  login: async (data: LoginData) => {
    try {
      const response = await fetch(`/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      return await handleApiResponse(response);
    } catch (error) {
      console.error('Giriş xətası:', error);
      throw error;
    }
  },

  register: async (data: RegisterData) => {
    try {
      const registerData = {
        username: data.username,
        password: data.password,
        email: data.email
      };
      
      const response = await fetch(`/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData),
      });
      
      return await handleApiResponse(response);
    } catch (error) {
      console.error('Qeydiyyat xətası:', error);
      throw error;
    }
  },

  forgotPassword: async (email: string) => {
    try {
      const response = await fetch(`/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      return await handleApiResponse(response);
    } catch (error) {
      console.error('Şifrə yeniləmə tələbi xətası:', error);
      throw error;
    }
  },
  
  resetPassword: async (token: string, newPassword: string) => {
    try {
      const response = await fetch(`/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      
      return await handleApiResponse(response);
    } catch (error) {
      console.error('Şifrə yeniləmə xətası:', error);
      throw error;
    }
  },
};

export const userAPI = {
  getProfile: async (): Promise<UserProfile> => {
    try {
      const response = await fetch(`/api/user/profile`, {
        headers: getHeaders(),
      });
      
      return await handleApiResponse(response);
    } catch (error) {
      console.error('Profil məlumatları alınarkən xəta:', error);
      throw error;
    }
  },

  updateProfile: async (data: Partial<UserProfile>) => {
    try {
      const response = await fetch(`/api/user/profile`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      
      return await handleApiResponse(response);
    } catch (error) {
      console.error('Profil yeniləmə xətası:', error);
      throw error;
    }
  },
  
  uploadAvatar: async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/user/avatar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      
      return await handleApiResponse(response);
    } catch (error) {
      console.error('Avatar yükləmə xətası:', error);
      throw error;
    }
  },
  
  deleteAvatar: async () => {
    try {
      const response = await fetch(`/api/user/avatar`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      
      return await handleApiResponse(response);
    } catch (error) {
      console.error('Avatar silmə xətası:', error);
      throw error;
    }
  },
};

export const movieAPI = {
  getMovies: async () => {
    try {
      const response = await fetch(`/api/movies`, {
        headers: getHeaders(),
      });
      
      return await handleApiResponse(response);
    } catch (error) {
      console.error('Film siyahısı alınarkən xəta:', error);
      throw error;
    }
  },

  searchMovies: async (query: string) => {
    try {
      const response = await fetch(`/api/movies/search/${encodeURIComponent(query)}`, {
        headers: getHeaders(),
      });
      
      return await handleApiResponse(response);
    } catch (error) {
      console.error('Film axtarışı xətası:', error);
      throw error;
    }
  },

  addMovie: async (data: MovieData) => {
    try {
      const response = await fetch(`/api/movies`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      
      return await handleApiResponse(response);
    } catch (error) {
      console.error('Film əlavə etmə xətası:', error);
      throw error;
    }
  },

  updateMovie: async (id: number, data: Partial<MovieData>) => {
    try {
      const response = await fetch(`/api/movies/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      
      return await handleApiResponse(response);
    } catch (error) {
      console.error('Film yeniləmə xətası:', error);
      throw error;
    }
  },

  deleteMovie: async (id: number) => {
    try {
      const response = await fetch(`/api/movies/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      
      return await handleApiResponse(response);
    } catch (error) {
      console.error('Film silmə xətası:', error);
      throw error;
    }
  },
}; 
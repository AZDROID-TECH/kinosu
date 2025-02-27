import { API_URL } from '../config/api';

interface LoginData {
  username: string;
  password: string;
}

interface RegisterData extends LoginData {
  confirmPassword: string;
}

interface MovieData {
  title: string;
  imdb_id: string;
  poster: string;
  imdb_rating: number;
  status: 'watchlist' | 'watching' | 'watched';
}

interface UserProfile {
  username: string;
  email: string;
  avatar?: string;
}

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const authAPI = {
  login: async (data: LoginData) => {
    const response = await fetch(`/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    return response.json();
  },

  register: async (data: RegisterData) => {
    const response = await fetch(`/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: data.username,
        password: data.password,
      }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    return response.json();
  },
};

export const userAPI = {
  getProfile: async () => {
    const response = await fetch(`/api/user/profile`, {
      headers: getHeaders(),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    return response.json();
  },

  updateProfile: async (data: Partial<UserProfile>) => {
    const response = await fetch(`/api/user/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    return response.json();
  },

  updateAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);

    const token = localStorage.getItem('token');
    const url = `/api/user/avatar`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        console.error(`404 Not Found: ${url} endpoint-i tapılmadı`);
        throw new Error(`Avatar yüklənmə endpoint-i tapılmadı (404): ${url}`);
      }
      
      try {
        const error = await response.json();
        throw new Error(error.error || `Xəta: ${response.status}`);
      } catch (jsonError) {
        throw new Error(`Sunucu xətası: ${response.status} ${response.statusText}`);
      }
    }
    
    try {
      return await response.json();
    } catch (error) {
      throw new Error('Cavab JSON formatında deyil');
    }
  },

  deleteAvatar: async () => {
    const url = `/api/user/avatar`;
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        console.error(`404 Not Found: ${url} endpoint-i tapılmadı`);
        throw new Error(`Avatar silmə endpoint-i tapılmadı (404): ${url}`);
      }
      
      try {
        const error = await response.json();
        throw new Error(error.error || `Xəta: ${response.status}`);
      } catch (jsonError) {
        throw new Error(`Sunucu xətası: ${response.status} ${response.statusText}`);
      }
    }
    
    try {
      return await response.json();
    } catch (error) {
      throw new Error('Cavab JSON formatında deyil');
    }
  },
};

export const movieAPI = {
  getMovies: async () => {
    const response = await fetch(`/api/movies`, {
      headers: getHeaders(),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    return response.json();
  },

  searchMovies: async (query: string) => {
    const response = await fetch(`/api/movies/search/${encodeURIComponent(query)}`, {
      headers: getHeaders(),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    return response.json();
  },

  addMovie: async (data: MovieData) => {
    const response = await fetch(`/api/movies`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    return response.json();
  },

  updateMovie: async (id: number, data: Partial<MovieData>) => {
    const response = await fetch(`/api/movies/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    return response.json();
  },

  deleteMovie: async (id: number) => {
    const response = await fetch(`/api/movies/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    return response.json();
  },
}; 
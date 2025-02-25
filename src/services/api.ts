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

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const authAPI = {
  login: async (data: LoginData) => {
    const response = await fetch(`${API_URL}/auth/login`, {
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
    const response = await fetch(`${API_URL}/auth/register`, {
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

export const movieAPI = {
  getMovies: async () => {
    const response = await fetch(`${API_URL}/movies`, {
      headers: getHeaders(),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    return response.json();
  },

  searchMovies: async (query: string) => {
    const response = await fetch(`${API_URL}/movies/search/${encodeURIComponent(query)}`, {
      headers: getHeaders(),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    return response.json();
  },

  addMovie: async (data: MovieData) => {
    const response = await fetch(`${API_URL}/movies`, {
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
    const response = await fetch(`${API_URL}/movies/${id}`, {
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
    const response = await fetch(`${API_URL}/movies/${id}`, {
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
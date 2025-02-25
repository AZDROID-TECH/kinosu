import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

interface AuthContextType {
  isLoggedIn: boolean;
  username: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUsername = localStorage.getItem('username');
    if (token && savedUsername) {
      setIsLoggedIn(true);
      setUsername(savedUsername);
    }
  }, []);

  const login = async (username: string, password: string) => {
    const response = await authAPI.login({ username, password });
    localStorage.setItem('token', response.token);
    localStorage.setItem('username', username);
    setIsLoggedIn(true);
    setUsername(username);
    navigate('/');
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setIsLoggedIn(false);
    setUsername(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}; 
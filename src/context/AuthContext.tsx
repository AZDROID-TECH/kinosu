import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, userAPI } from '../services/api';

interface AuthContextType {
  isLoggedIn: boolean;
  username: string | null;
  email: string | null;
  avatar: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  updateAvatar: (file: File) => Promise<void>;
  deleteAvatar: () => Promise<void>;
  refreshProfile: () => Promise<void>;
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
  const [email, setEmail] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const navigate = useNavigate();

  const refreshProfile = async () => {
    try {
      const profile = await userAPI.getProfile();
      setEmail(profile.email);
      
      // Avatar URL'yi null veya undefined değilse ayarla
      if (profile.avatar) {
        setAvatar(profile.avatar);
      } else {
        setAvatar(null);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUsername = localStorage.getItem('username');
    if (token && savedUsername) {
      setIsLoggedIn(true);
      setUsername(savedUsername);
      refreshProfile().catch(err => {
        console.warn('Failed to load profile on startup:', err);
      });
    }
  }, []);

  const login = async (username: string, password: string) => {
    const response = await authAPI.login({ username, password });
    localStorage.setItem('token', response.token);
    localStorage.setItem('username', username);
    setIsLoggedIn(true);
    setUsername(username);
    
    try {
      await refreshProfile();
    } catch (error) {
      console.warn('Failed to load profile after login:', error);
    }
    
    navigate('/');
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setIsLoggedIn(false);
    setUsername(null);
    setEmail(null);
    setAvatar(null);
    navigate('/login');
  };

  const updateAvatar = async (file: File) => {
    try {
      const response = await userAPI.updateAvatar(file);
      setAvatar(response.avatar);
    } catch (error) {
      console.error('AuthContext updateAvatar error:', error);
      throw error;
    }
  };

  const deleteAvatar = async () => {
    try {
      await userAPI.deleteAvatar();
      setAvatar(null);
    } catch (error) {
      console.error('AuthContext deleteAvatar error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        isLoggedIn, 
        username, 
        email, 
        avatar,
        login, 
        logout,
        updateAvatar,
        deleteAvatar,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 
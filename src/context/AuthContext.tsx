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
  refreshProfile: () => Promise<void>;
  updateAvatar: (avatarUrl: string | null) => void;
  checkAuthStatus: () => Promise<boolean>;
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

  // Token geçerliliğini kontrol et
  const checkAuthStatus = async (): Promise<boolean> => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoggedIn(false);
      return false;
    }

    try {
      // Profile erişimi token geçerliliğini test eder
      await userAPI.getProfile();
      return true;
    } catch (error) {
      // Hata durumunda oturumu sonlandır
      logout();
      return false;
    }
  };

  const refreshProfile = async () => {
    try {
      const profile = await userAPI.getProfile();
      setEmail(profile.email);
      setAvatar(profile.avatar);
    } catch (error) {
      console.error('Profil məlumatlarını yükləmə xətası:', error);
    }
  };

  const updateAvatar = (avatarUrl: string | null) => {
    setAvatar(avatarUrl);
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const savedUsername = localStorage.getItem('username');
      
      if (token && savedUsername) {
        // Token geçerliliğini kontrol et
        const isValid = await checkAuthStatus();
        
        if (isValid) {
          setIsLoggedIn(true);
          setUsername(savedUsername);
          await refreshProfile();
        } else {
          // Token geçersizse tüm state'leri temizle
          setIsLoggedIn(false);
          setUsername(null);
          setEmail(null);
          setAvatar(null);
        }
      }
    };
    
    initAuth();
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
      // Sessiz bir şekilde devam et
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

  return (
    <AuthContext.Provider 
      value={{ 
        isLoggedIn, 
        username, 
        email,
        avatar,
        login, 
        logout,
        refreshProfile,
        updateAvatar,
        checkAuthStatus
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 
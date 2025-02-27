import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  useTheme,
  alpha,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme as useCustomTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import 'boxicons/css/boxicons.min.css';

// Ortak stiller
const commonStyles = {
  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
  transition: 'all 0.3s ease',
};

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode, toggleDarkMode } = useCustomTheme();
  const { isLoggedIn, username, avatar, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const theme = useTheme();

  // Giriş ve kayıt sayfalarında butonları gizlemek için kontrol
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register' || location.pathname.includes('/reset-password');

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
  };

  return (
    <AppBar 
      position="static" 
      elevation={0}
      sx={{
        background: darkMode 
          ? alpha(theme.palette.background.paper, 0.95)
          : 'linear-gradient(45deg, #3f51b5 0%, #673ab7 100%)',
        boxShadow: isAuthPage 
          ? 'none' 
          : '0 2px 10px rgba(0, 0, 0, 0.1)',
        backdropFilter: isAuthPage ? 'blur(10px)' : 'blur(5px)',
        borderBottom: isAuthPage 
          ? 'none' 
          : `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.2)'}`,
        transition: 'all 0.3s ease-in-out',
        borderRadius: isAuthPage ? 0 : '0 0 8px 8px',
      }}
    >
      <Toolbar>
        <Typography
          variant="h5"
          component="div"
          sx={{
            flexGrow: 1,
            cursor: 'pointer',
            fontFamily: 'Righteous, cursive',
            letterSpacing: '2px',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            color: (theme) => isAuthPage 
              ? (darkMode ? '#fff' : '#fff')
              : '#fff',
            position: 'relative',
            ...commonStyles,
          }}
          onClick={() => navigate('/')}
        >
          <img 
            src="/vite.svg" 
            alt="Kinosu" 
            style={{ 
              width: 36, 
              height: 36,
              transition: 'all 0.3s ease'
            }} 
          />
          <span style={{
            color: isAuthPage
              ? '#fff'
              : darkMode
                ? '#bb86fc'
                : '#fff',
            display: 'inline-block',
            textShadow: isAuthPage 
              ? '0 2px 4px rgba(0,0,0,0.3)' 
              : (darkMode ? '0 2px 4px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.3)'),
            fontWeight: 'bold',
            transition: 'color 0.3s ease',
          }}>
            Kinosu
          </span>
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <button
            onClick={toggleDarkMode}
            className="theme-toggle"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              color: isAuthPage ? '#fff' : (darkMode ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.95)'),
              transition: 'transform 0.3s ease, color 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.color = darkMode ? '#bb86fc' : '#757de8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.color = isAuthPage ? '#fff' : (darkMode ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.95)');
            }}
          >
            <i className={`bx ${darkMode ? 'bx-sun' : 'bx-moon'}`} style={{ 
              fontSize: '24px',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            }}></i>
          </button>

          {isLoggedIn ? (
            <>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  cursor: 'pointer',
                  p: 0.5,
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.15)',
                    transform: 'translateY(-2px)',
                  },
                }}
                onClick={handleMenuOpen}
              >
                <Avatar
                  src={avatar || undefined}
                  sx={{
                    bgcolor: darkMode ? '#9c27b0' : '#3f51b5',
                    width: 35,
                    height: 35,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                    border: '2px solid rgba(255, 255, 255, 0.8)',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {!avatar && username?.[0].toUpperCase()}
                </Avatar>
                <Typography
                  variant="subtitle1"
                  sx={{
                    display: { xs: 'none', sm: 'block' },
                    fontWeight: 600,
                    color: isAuthPage ? '#fff' : (darkMode ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.95)'),
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  }}
                >
                  {username}
                </Typography>
              </Box>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                  elevation: 3,
                  sx: {
                    minWidth: '200px',
                    mt: 1.5,
                    borderRadius: 2,
                    backdropFilter: 'blur(10px)',
                    backgroundColor: darkMode 
                      ? alpha(theme.palette.background.paper, 0.9)
                      : alpha('#ffffff', 0.9),
                    border: darkMode 
                      ? '1px solid rgba(255, 255, 255, 0.1)' 
                      : '1px solid rgba(0, 0, 0, 0.05)',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    boxShadow: darkMode
                      ? '0 8px 32px rgba(0, 0, 0, 0.3)'
                      : '0 8px 32px rgba(0, 0, 0, 0.1)',
                  },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem 
                  onClick={() => {
                    handleMenuClose();
                    navigate('/profile');
                  }} 
                  sx={{ 
                    py: 1.2,
                    transition: 'all 0.2s ease',
                    color: darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
                    '&:hover': {
                      backgroundColor: darkMode 
                        ? alpha('#9c27b0', 0.1)
                        : alpha('#3f51b5', 0.05),
                      color: darkMode ? '#bb86fc' : '#3f51b5',
                    }
                  }}
                >
                  <i className='bx bx-user' style={{ 
                    marginRight: '8px', 
                    fontSize: '20px', 
                    color: darkMode ? '#9c27b0' : '#3f51b5',
                    transition: 'color 0.2s ease',
                  }}></i>
                  Profilim
                </MenuItem>
                <Divider sx={{ 
                  my: 0.5,
                  borderColor: darkMode 
                    ? 'rgba(255, 255, 255, 0.1)' 
                    : 'rgba(0, 0, 0, 0.05)',
                }} />
                <MenuItem onClick={handleLogout} sx={{ 
                  color: 'error.main',
                  py: 1.2,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: darkMode 
                      ? 'rgba(244, 67, 54, 0.08)' 
                      : 'rgba(244, 67, 54, 0.05)',
                    color: '#f44336',
                  }
                }}>
                  <i className='bx bx-log-out' style={{ 
                    marginRight: '8px', 
                    fontSize: '20px',
                    transition: 'color 0.2s ease',
                  }}></i>
                  Çıxış
                </MenuItem>
              </Menu>
            </>
          ) : (
            !isAuthPage && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  color="inherit"
                  variant="outlined"
                  onClick={() => navigate('/login')}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 500,
                    borderColor: 'rgba(255, 255, 255, 0.7)',
                    color: darkMode ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: 'rgba(255, 255, 255, 1)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                      color: '#fff',
                    }
                  }}
                >
                  Daxil ol
                </Button>
                <Button
                  color="inherit"
                  variant="contained"
                  onClick={() => navigate('/register')}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 500,
                    bgcolor: darkMode ? 'rgba(187, 134, 252, 0.2)' : 'rgba(255, 255, 255, 0.2)',
                    color: darkMode ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      bgcolor: darkMode ? 'rgba(187, 134, 252, 0.3)' : 'rgba(255, 255, 255, 0.3)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                      color: '#fff',
                    },
                  }}
                >
                  Qeydiyyat
                </Button>
              </Box>
            )
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
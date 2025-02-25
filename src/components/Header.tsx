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
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import 'boxicons/css/boxicons.min.css';

const Header = () => {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useTheme();
  const { isLoggedIn, username, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

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
    <AppBar position="static" elevation={1}>
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
            color: (theme) => theme.palette.mode === 'dark' ? 'primary.main' : '#e6e6e6',
            position: 'relative',
          }}
          onClick={() => navigate('/')}
        >
          <img 
            src="/vite.svg" 
            alt="Kinosu" 
            style={{ 
              width: 36, 
              height: 36,
              filter: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'drop-shadow(0 0 4px rgba(25, 118, 210, 0.6))'
                  : 'drop-shadow(0 0 4px rgba(25, 118, 210, 0.3))'
            }} 
          />
          <span>
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
              color: 'inherit'
            }}
          >
            <i className={`bx ${darkMode ? 'bx-sun' : 'bx-moon'}`} style={{ fontSize: '24px' }}></i>
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
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
                onClick={handleMenuOpen}
              >
                <Avatar
                  sx={{
                    bgcolor: 'primary.main',
                    width: 35,
                    height: 35,
                    boxShadow: 1,
                    border: '2px solid',
                    borderColor: 'background.paper',
                  }}
                >
                  {username?.[0].toUpperCase()}
                </Avatar>
                <Typography
                  variant="subtitle1"
                  sx={{
                    display: { xs: 'none', sm: 'block' },
                    fontWeight: 600,
                    color: 'text.primary',
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
                  },
                }}
              >
                <MenuItem onClick={handleMenuClose}>
                  <i className='bx bx-user' style={{ marginRight: '8px', fontSize: '20px' }}></i>
                  Profilim
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                  <i className='bx bx-log-out' style={{ marginRight: '8px', fontSize: '20px' }}></i>
                  Çıxış
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                color="inherit"
                variant="outlined"
                onClick={() => navigate('/login')}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 500,
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
                  bgcolor: 'primary.main',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                }}
              >
                Qeydiyyat
              </Button>
            </Box>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import 'boxicons/css/boxicons.min.css';

const Login = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(formData.username, formData.password);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleForgotPassword = async () => {
    setResetMessage('');
    setResetError('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setResetMessage(data.message);
      setEmail('');
      setTimeout(() => {
        setForgotPasswordOpen(false);
        setResetMessage('');
      }, 3000);
    } catch (err: any) {
      setResetError(err.message);
    }
  };

  return (
    <>
      <Container component="main" maxWidth="xs" sx={{ py: { xs: 2, sm: 4 } }}>
        <Paper
          elevation={3}
          sx={{
            p: { xs: 2, sm: 3 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            borderRadius: 2,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: 'linear-gradient(90deg, #2196f3 0%, #64b5f6 100%)',
            }}
          />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <Box
              sx={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              }}
            >
              <i className='bx bx-movie-play' style={{ fontSize: '24px', color: 'white' }}></i>
            </Box>
            <Typography
              component="h1"
              variant="h6"
              sx={{ 
                fontWeight: 'bold',
                letterSpacing: '0.5px'
              }}
            >
              Daxil ol
            </Typography>
          </Box>

          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                width: '100%', 
                mb: 2,
                py: 0.5,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
              icon={<i className='bx bx-error-circle' style={{ fontSize: '18px' }}></i>}
            >
              {error}
            </Alert>
          )}

          <Box 
            component="form" 
            onSubmit={handleSubmit} 
            sx={{ width: '100%' }}
          >
            <TextField
              required
              fullWidth
              size="small"
              label="İstifadəçi adı və ya Email"
              name="username"
              autoComplete="username"
              autoFocus
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <i className='bx bx-user' style={{ fontSize: '18px', color: 'action.active' }}></i>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 1.5 }}
            />
            <TextField
              required
              fullWidth
              size="small"
              name="password"
              label="Şifrə"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <i className='bx bx-lock-alt' style={{ fontSize: '18px', color: 'action.active' }}></i>
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="password-toggle"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        color: 'inherit'
                      }}
                    >
                      <i className={`bx ${showPassword ? 'bx-show' : 'bx-hide'}`} style={{ fontSize: '18px' }}></i>
                    </button>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 1 }}
            />

            <Box sx={{ width: '100%', textAlign: 'right', mb: 2 }}>
              <Button
                onClick={() => setForgotPasswordOpen(true)}
                sx={{
                  textTransform: 'none',
                  fontSize: '0.85rem',
                  color: 'text.secondary',
                  '&:hover': {
                    backgroundColor: 'transparent',
                    color: 'primary.main',
                  },
                }}
              >
                Şifrəni unutmusunuz?
              </Button>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="small"
              sx={{
                py: 1,
                borderRadius: 1.5,
                fontWeight: 'bold',
                textTransform: 'none',
                fontSize: '0.9rem',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                },
              }}
            >
              <i className='bx bx-log-in' style={{ fontSize: '18px', marginRight: '6px' }}></i>
              Daxil ol
            </Button>

            <Box 
              sx={{ 
                my: 2,
                textAlign: 'center',
                position: 'relative',
                '&::before, &::after': {
                  content: '""',
                  position: 'absolute',
                  top: '50%',
                  width: '42%',
                  height: '1px',
                  backgroundColor: 'divider',
                },
                '&::before': { left: 0 },
                '&::after': { right: 0 }
              }}
            >
              <Typography 
                variant="caption" 
                component="span"
                sx={{ 
                  bgcolor: 'background.paper',
                  px: 2,
                  color: 'text.secondary'
                }}
              >
                və ya
              </Typography>
            </Box>

            <Link
              to="/register"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <Button
                fullWidth
                variant="outlined"
                size="small"
                sx={{
                  py: 1,
                  borderRadius: 1.5,
                  textTransform: 'none',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                <i className='bx bx-user-plus' style={{ fontSize: '18px', marginRight: '6px' }}></i>
                Qeydiyyatdan keç
              </Button>
            </Link>
          </Box>
        </Paper>
      </Container>

      <Dialog
        open={forgotPasswordOpen}
        onClose={() => {
          setForgotPasswordOpen(false);
          setResetMessage('');
          setResetError('');
          setEmail('');
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <i className='bx bx-lock-open-alt' style={{ fontSize: '24px', color: '#1976d2' }}></i>
            <Typography variant="h6" component="span" sx={{ fontWeight: 'bold' }}>
              Şifrəni Yenilə
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {resetMessage && (
            <Alert 
              severity="success" 
              sx={{ mb: 2 }}
              icon={<i className='bx bx-check-circle' style={{ fontSize: '18px' }}></i>}
            >
              {resetMessage}
            </Alert>
          )}
          {resetError && (
            <Alert 
              severity="error" 
              sx={{ mb: 2 }}
              icon={<i className='bx bx-error-circle' style={{ fontSize: '18px' }}></i>}
            >
              {resetError}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            variant="outlined"
            size="small"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <i className='bx bx-envelope' style={{ fontSize: '18px', color: 'action.active' }}></i>
                </InputAdornment>
              ),
            }}
          />
          <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
            Email ünvanınızı daxil edin. Şifrə yeniləmə linki göndəriləcək.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => {
              setForgotPasswordOpen(false);
              setResetMessage('');
              setResetError('');
              setEmail('');
            }}
            sx={{
              textTransform: 'none',
              color: 'text.secondary',
            }}
          >
            Ləğv et
          </Button>
          <Button
            onClick={handleForgotPassword}
            variant="contained"
            sx={{
              textTransform: 'none',
              borderRadius: 1.5,
              px: 3,
            }}
          >
            Göndər
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Login; 
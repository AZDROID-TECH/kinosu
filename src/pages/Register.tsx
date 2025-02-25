import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  InputAdornment,
} from '@mui/material';
import 'boxicons/css/boxicons.min.css';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      navigate('/login');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
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
            <i className='bx bx-user-plus' style={{ fontSize: '24px', color: 'white' }}></i>
          </Box>
          <Typography
            component="h1"
            variant="h6"
            sx={{ 
              fontWeight: 'bold',
              letterSpacing: '0.5px'
            }}
          >
            Qeydiyyat
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
            label="İstifadəçi adı"
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
            autoComplete="new-password"
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
            sx={{ mb: 2 }}
          />
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
            <i className='bx bx-user-check' style={{ fontSize: '18px', marginRight: '6px' }}></i>
            Qeydiyyatdan keç
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
            to="/login"
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
              <i className='bx bx-log-in' style={{ fontSize: '18px', marginRight: '6px' }}></i>
              Daxil ol
            </Button>
          </Link>
        </Box>
      </Paper>
    </Container>
  );
};

export default Register; 
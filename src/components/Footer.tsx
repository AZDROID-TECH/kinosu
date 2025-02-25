import { Box, Container, Typography, Divider } from '@mui/material';
import 'boxicons/css/boxicons.min.css';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 4,
        px: 2,
        mt: 'auto',
        bgcolor: (theme) =>
          theme.palette.mode === 'light'
            ? theme.palette.grey[100]
            : theme.palette.grey[900],
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 'bold',
              color: 'primary.main',
            }}
          >
            Kinosu
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 1,
          }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: { xs: 'center', sm: 'left' } }}
          >
            © {new Date().getFullYear()} Kinosu | AZDROID Tech. Bütün hüquqlar qorunur.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <a
              href="https://linkedin.com/company/azdroid"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'inherit',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
              }}
              className="social-icon"
            >
              <i className='bx bxl-linkedin' ></i>
            </a>
            <a
              href="https://tiktok.com/@azdroid.tech"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'inherit',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
              }}
              className="social-icon"
            >
              <i className='bx bxl-tiktok' ></i>
            </a>
            <a
              href="https://instagram.com/azdroid.tech"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'inherit',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
              }}
              className="social-icon"
            >
              <i className='bx bxl-instagram' ></i>
            </a>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer; 
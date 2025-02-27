import {
  Container,
  Box,
  Typography,
  Avatar,
  Paper,
  TextField,
  IconButton,
  Button,
  Divider,
  useTheme,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useTheme as useCustomTheme } from '../context/ThemeContext';
import { useState, useRef } from 'react';
import ReactCrop, { Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import 'boxicons/css/boxicons.min.css';

const Profile = () => {
  const { username, email, avatar, updateAvatar, deleteAvatar } = useAuth();
  const { darkMode } = useCustomTheme();
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Kırpma işlemi için state'ler
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 100,
    height: 100,
    x: 0,
    y: 0
  });
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cropError, setCropError] = useState<string | null>(null);

  // Profil fotoğrafı yükleme işlemi
  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setCropDialogOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Kırpma işlemini tamamla
  const handleCropComplete = async () => {
    if (!imageRef.current || !crop.width || !crop.height) {
      setCropError('Xahiş edirik şəkli kırpın');
      return;
    }

    setIsLoading(true);
    setCropError(null);

    try {
      const canvas = document.createElement('canvas');
      const scaleX = imageRef.current.naturalWidth / imageRef.current.width;
      const scaleY = imageRef.current.naturalHeight / imageRef.current.height;

      canvas.width = Math.floor(crop.width * scaleX);
      canvas.height = Math.floor(crop.height * scaleY);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas konteksti yaradıla bilmədi');
      }

      ctx.imageSmoothingQuality = 'high';

      ctx.drawImage(
        imageRef.current,
        Math.floor(crop.x * scaleX),
        Math.floor(crop.y * scaleY),
        Math.floor(crop.width * scaleX),
        Math.floor(crop.height * scaleY),
        0,
        0,
        Math.floor(crop.width * scaleX),
        Math.floor(crop.height * scaleY)
      );

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Şəkil formatına çevrilə bilmədi'));
            }
          },
          'image/jpeg',
          0.95
        );
      });

      const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
      
      try {
        await updateAvatar(file);
        setCropDialogOpen(false);
        setSelectedImage(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (apiError) {
        console.error('Avatar yeniləmə xətası (detaylı):', apiError);
        let errorMessage = 'API xətası baş verdi';
        
        if (apiError instanceof Error) {
          errorMessage = apiError.message;
          
          // 404 hatasında daha açıklayıcı mesaj göster
          if (errorMessage.includes('404')) {
            errorMessage = 'Profil şəkli yükləmə xidməti əlçatan deyil. Backend serverin işləyib-işləmədiyini yoxlayın.';
          }
        }
        
        setCropError(errorMessage);
      }
    } catch (error) {
      console.error('Şəkil hazırlama xətası:', error);
      setCropError(error instanceof Error ? error.message : 'Şəkil hazırlama xətası baş verdi');
    } finally {
      setIsLoading(false);
    }
  };

  // Profil fotoğrafını kaldır
  const handleRemoveAvatar = async () => {
    try {
      await deleteAvatar();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error removing avatar:', error);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 4,
          bgcolor: darkMode 
            ? alpha(theme.palette.background.paper, 0.8)
            : alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(10px)',
          border: '1px solid',
          borderColor: darkMode 
            ? 'rgba(255, 255, 255, 0.1)'
            : 'rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Profil Başlığı */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2, 
          mb: 4,
          flexDirection: { xs: 'column', sm: 'row' } 
        }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={avatar || undefined}
              sx={{
                width: { xs: 100, sm: 120 },
                height: { xs: 100, sm: 120 },
                bgcolor: darkMode ? '#9c27b0' : '#3f51b5',
                fontSize: '3rem',
                border: '4px solid',
                borderColor: darkMode 
                  ? 'rgba(255, 255, 255, 0.2)'
                  : 'rgba(255, 255, 255, 0.8)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
            >
              {username?.[0].toUpperCase()}
            </Avatar>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarUpload}
            />
            <Box sx={{ 
              display: 'flex', 
              gap: 1, 
              mt: 2,
              justifyContent: 'center'
            }}>
              <Button
                size="small"
                onClick={() => fileInputRef.current?.click()}
                startIcon={<i className='bx bx-upload'></i>}
                sx={{
                  textTransform: 'none',
                  borderRadius: 2,
                  bgcolor: darkMode ? 'rgba(156, 39, 176, 0.1)' : 'rgba(63, 81, 181, 0.1)',
                  color: darkMode ? '#bb86fc' : '#3f51b5',
                  '&:hover': {
                    bgcolor: darkMode ? 'rgba(156, 39, 176, 0.2)' : 'rgba(63, 81, 181, 0.2)',
                  },
                }}
              >
                Şəkil yüklə
              </Button>
              {avatar && (
                <IconButton
                  size="small"
                  onClick={handleRemoveAvatar}
                  sx={{
                    color: 'error.main',
                    bgcolor: 'error.light',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.error.main, 0.2),
                    },
                  }}
                >
                  <i className='bx bx-trash'></i>
                </IconButton>
              )}
            </Box>
          </Box>

          <Box sx={{ 
            flex: 1,
            textAlign: { xs: 'center', sm: 'left' }
          }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 'bold',
                mb: 1,
                background: darkMode
                  ? 'linear-gradient(45deg, #bb86fc 30%, #9c27b0 90%)'
                  : 'linear-gradient(45deg, #3f51b5 30%, #757de8 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
            >
              {username}
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                justifyContent: { xs: 'center', sm: 'flex-start' },
              }}
            >
              <i className='bx bx-envelope' style={{ fontSize: '1.2rem' }}></i>
              {email || 'E-poçt təyin edilməyib'}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Profil Bilgileri */}
        <Box sx={{ mt: 3 }}>
          <Typography
            variant="h6"
            sx={{
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              color: darkMode ? '#bb86fc' : '#3f51b5',
            }}
          >
            <i className='bx bx-user-circle' style={{ fontSize: '1.5rem' }}></i>
            Profil Məlumatları
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="İstifadəçi adı"
              value={username}
              disabled
              InputProps={{
                startAdornment: (
                  <i className='bx bx-user' style={{ 
                    fontSize: '1.2rem', 
                    marginRight: '8px',
                    color: darkMode ? '#bb86fc' : '#3f51b5'
                  }}></i>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: darkMode 
                    ? alpha(theme.palette.background.paper, 0.3)
                    : alpha(theme.palette.background.paper, 0.5),
                },
              }}
            />

            <TextField
              fullWidth
              label="E-poçt"
              value={email}
              disabled
              InputProps={{
                startAdornment: (
                  <i className='bx bx-envelope' style={{ 
                    fontSize: '1.2rem', 
                    marginRight: '8px',
                    color: darkMode ? '#bb86fc' : '#3f51b5'
                  }}></i>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: darkMode 
                    ? alpha(theme.palette.background.paper, 0.3)
                    : alpha(theme.palette.background.paper, 0.5),
                },
              }}
            />
          </Box>
        </Box>
      </Paper>

      {/* Resim Kırpma Dialog'u */}
      <Dialog 
        open={cropDialogOpen} 
        onClose={() => {
          setCropDialogOpen(false);
          setSelectedImage(null);
          setCropError(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            bgcolor: darkMode 
              ? alpha(theme.palette.background.paper, 0.9)
              : alpha(theme.palette.background.paper, 0.9),
            backdropFilter: 'blur(10px)',
            overflow: 'hidden',
            '& .MuiDialogContent-root': {
              p: 0,
            },
          }
        }}
      >
        <DialogTitle 
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            color: darkMode ? '#bb86fc' : '#3f51b5',
            p: 2,
            borderBottom: 1,
            borderColor: darkMode 
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(0, 0, 0, 0.1)',
          }}
        >
          <i className='bx bx-crop' style={{ fontSize: '1.5rem' }}></i>
          Profil şəklini düzəlt
        </DialogTitle>
        <DialogContent>
          <Box sx={{ 
            position: 'relative',
            width: '100%',
            height: '400px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: darkMode ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.05)',
          }}>
            {selectedImage && (
              <ReactCrop
                crop={crop}
                onChange={c => setCrop(c)}
                aspect={1}
                circularCrop
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                }}
              >
                <img
                  ref={imageRef}
                  src={selectedImage}
                  style={{ 
                    maxWidth: '100%',
                    maxHeight: '400px',
                    objectFit: 'contain',
                  }}
                  alt="Crop"
                />
              </ReactCrop>
            )}
          </Box>
          {cropError && (
            <Box sx={{ p: 2 }}>
              <Alert severity="error" sx={{ mb: 2 }}>
                {cropError}
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions 
          sx={{ 
            p: 2,
            borderTop: 1,
            borderColor: darkMode 
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(0, 0, 0, 0.1)',
            gap: 1,
          }}
        >
          <Button
            onClick={() => {
              setCropDialogOpen(false);
              setSelectedImage(null);
              setCropError(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            }}
            variant="outlined"
            startIcon={<i className='bx bx-x'></i>}
            sx={{
              color: 'text.secondary',
              borderColor: 'divider',
              '&:hover': {
                bgcolor: 'action.hover',
                borderColor: 'text.secondary',
              },
            }}
          >
            Ləğv et
          </Button>
          <Button
            onClick={handleCropComplete}
            variant="contained"
            disabled={isLoading}
            startIcon={isLoading ? null : <i className='bx bx-check'></i>}
            sx={{
              bgcolor: darkMode ? '#bb86fc' : '#3f51b5',
              color: 'white',
              '&:hover': {
                bgcolor: darkMode ? '#9c27b0' : '#303f9f',
              },
            }}
          >
            {isLoading ? 'Yüklənir...' : 'Təsdiqlə'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Profile; 
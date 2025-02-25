import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Box,
  TextField,
  Button,
  Typography,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Rating,
  InputAdornment,
  Fade,
  Grow,
  Menu,
  MenuItem,
  Divider,
  Pagination,
} from '@mui/material';
import { movieAPI } from '../services/api';
import 'boxicons/css/boxicons.min.css';

interface Movie {
  id: number;
  title: string;
  poster: string;
  imdb_rating: number;
  user_rating: number;
  status: 'watchlist' | 'watching' | 'watched';
  imdb_id: string;
  created_at: string;
}

interface SearchResult {
  imdbID: string;
  Title: string;
  Poster: string;
  imdbRating: string;
  Year: string;
  Genre: string;
}

interface MovieData {
  title: string;
  imdb_id: string;
  poster: string;
  imdb_rating: number;
  status: 'watchlist' | 'watching' | 'watched';
  user_rating?: number;
  created_at: string;
}

const Home = () => {
  const navigate = useNavigate();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [imdbSearchQuery, setImdbSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [status, setStatus] = useState('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedSort, setSelectedSort] = useState<string>(() => {
    return localStorage.getItem('selectedSort') || 'newest';
  });
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 9;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    fetchMovies();
  }, [navigate]);

  const fetchMovies = async () => {
    try {
      const data = await movieAPI.getMovies();
      const sortedMovies = sortMovies([...data], selectedSort);
      setMovies(sortedMovies);
    } catch (error) {
      console.error('Error fetching movies:', error);
    }
  };

  const sortMovies = (movies: Movie[], sortType: string) => {
    switch(sortType) {
      case 'newest':
        return movies.sort((a, b) => b.id - a.id);
      case 'oldest':
        return movies.sort((a, b) => a.id - b.id);
      case 'rating_high':
        return movies.sort((a, b) => (b.imdb_rating || 0) - (a.imdb_rating || 0));
      case 'rating_low':
        return movies.sort((a, b) => (a.imdb_rating || 0) - (b.imdb_rating || 0));
      case 'user_rating_high':
        return movies.sort((a, b) => (b.user_rating || 0) - (a.user_rating || 0));
      case 'user_rating_low':
        return movies.sort((a, b) => (a.user_rating || 0) - (b.user_rating || 0));
      default:
        return movies;
    }
  };

  // IMDb film arama
  const handleImdbSearch = async () => {
    if (!imdbSearchQuery.trim()) return;

    setLoading(true);
    try {
      const data = await movieAPI.searchMovies(imdbSearchQuery);
      setSearchResults(data.Search || []);
    } catch (error) {
      console.error('Error searching movies:', error);
    } finally {
      setLoading(false);
    }
  };

  // Yerel film arama
  useEffect(() => {
    const filteredMovies = movies.filter((movie) =>
      movie.title.toLowerCase().includes(localSearchQuery.toLowerCase())
    );
    setFilteredMovies(filteredMovies);
  }, [localSearchQuery, movies]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Tarix məlum deyil';
      
      // Bakü saat dilimini ayarla (UTC+4)
      const bakuDate = new Date(date.getTime() + (4 * 60 * 60 * 1000));
      
      const day = bakuDate.getDate();
      const year = bakuDate.getFullYear();
      const hours = bakuDate.getHours().toString().padStart(2, '0');
      const minutes = bakuDate.getMinutes().toString().padStart(2, '0');

      // Azerbaycan ayları
      const months = [
        'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun',
        'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'
      ];
      const month = months[bakuDate.getMonth()];

      return `${day} ${month} ${year} - ${hours}:${minutes}`;
    } catch (error) {
      return 'Tarix məlum deyil';
    }
  };

  const handleAddMovie = async (movie: SearchResult) => {
    try {
      const movieData: MovieData = {
        title: movie.Title,
        imdb_id: movie.imdbID,
        poster: movie.Poster,
        imdb_rating: parseFloat(movie.imdbRating) || 0,
        status: 'watchlist',
        created_at: new Date().toISOString(),
        user_rating: 0
      };
      
      await movieAPI.addMovie(movieData);
      fetchMovies();
    } catch (error) {
      console.error('Error adding movie:', error);
    }
  };

  const handleUpdateMovie = async (
    movieId: number,
    updates: Partial<MovieData>
  ) => {
    try {
      await movieAPI.updateMovie(movieId, updates);
      const updatedMovies = await movieAPI.getMovies();
      const sortedMovies = sortMovies([...updatedMovies], selectedSort);
      setMovies(sortedMovies);
    } catch (error) {
      console.error('Error updating movie:', error);
    }
  };

  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);

  useEffect(() => {
    const filtered = movies.filter((movie) => {
      const matchesSearch = movie.title
        .toLowerCase()
        .includes(localSearchQuery.toLowerCase());
      const matchesStatus = status === 'all' ? true : movie.status === status;
      return matchesSearch && matchesStatus;
    });
    setFilteredMovies(filtered);
  }, [localSearchQuery, status, movies]);

  const handleDeleteMovie = async (movieId: number) => {
    try {
      await movieAPI.deleteMovie(movieId);
      fetchMovies();
    } catch (error) {
      console.error('Error deleting movie:', error);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setImdbSearchQuery('');
    setSearchResults([]);
  };

  const isMovieInList = (imdbId: string) => {
    return movies.some((movie) => movie.imdb_id === imdbId);
  };

  const handleSortClick = (event: React.MouseEvent<HTMLElement>) => {
    setSortAnchorEl(event.currentTarget);
  };

  const handleSortClose = () => {
    setSortAnchorEl(null);
  };

  const handleSortSelect = (value: string) => {
    setSelectedSort(value);
    localStorage.setItem('selectedSort', value);
    const sortedMovies = sortMovies([...movies], value);
    setMovies(sortedMovies);
    handleSortClose();
  };

  const getSortLabel = (value: string) => {
    switch(value) {
      case 'newest': return 'Ən yeni əlavə edilən';
      case 'oldest': return 'Ən əvvəl əlavə edilən';
      case 'rating_high': return 'IMDb: Yüksəkdən aşağı';
      case 'rating_low': return 'IMDb: Aşağıdan yüksəyə';
      case 'user_rating_high': return 'Mənim reytinqim: Yüksəkdən aşağı';
      case 'user_rating_low': return 'Mənim reytinqim: Aşağıdan yüksəyə';
      default: return '';
    }
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Sayfalama için filmleri böl
  const paginatedMovies = filteredMovies.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <TextField
          placeholder="Əlavə edilmiş filmlərdə axtar..."
          variant="outlined"
          size="small"
          sx={{ flexGrow: 1, mr: 2 }}
          value={localSearchQuery}
          onChange={(e) => setLocalSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <i className='bx bx-search' style={{ fontSize: '20px' }}></i>
              </InputAdornment>
            ),
          }}
        />
        <button
          onClick={() => setOpenDialog(true)}
          className="add-button"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#1976d2',
            padding: '8px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <i className='bx bx-plus' style={{ fontSize: '24px' }}></i>
        </button>
      </Box>

      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        gap: 2,
        mb: 3,
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}>
      <Tabs
        value={status}
        onChange={(_, newValue) => setStatus(newValue)}
          sx={{
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
            '& .MuiTab-root': {
              textTransform: 'none',
              fontSize: '0.95rem',
              fontWeight: 500,
              minHeight: 48,
              transition: 'all 0.2s',
              '&:hover': {
                color: 'primary.main',
              },
            },
          }}
        variant="scrollable"
        scrollButtons="auto"
      >
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>Hamısı</span>
                <Box
                  sx={{
                    bgcolor: 'action.hover',
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'text.secondary',
                  }}
                >
                  {movies.length}
                </Box>
              </Box>
            }
            value="all"
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>İzləniləcək</span>
                <Box
                  sx={{
                    bgcolor: 'action.hover',
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'text.secondary',
                  }}
                >
                  {movies.filter(movie => movie.status === 'watchlist').length}
                </Box>
              </Box>
            }
            value="watchlist"
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>İzlənilir</span>
                <Box
                  sx={{
                    bgcolor: 'action.hover',
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'text.secondary',
                  }}
                >
                  {movies.filter(movie => movie.status === 'watching').length}
                </Box>
              </Box>
            }
            value="watching"
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>İzlənildi</span>
                <Box
                  sx={{
                    bgcolor: 'action.hover',
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'text.secondary',
                  }}
                >
                  {movies.filter(movie => movie.status === 'watched').length}
                </Box>
              </Box>
            }
            value="watched"
          />
        </Tabs>
        
        <Box>
          <Button
            onClick={handleSortClick}
            size="small"
            sx={{
              textTransform: 'none',
              color: 'text.primary',
              bgcolor: 'action.hover',
              borderRadius: 2,
              px: 2,
              py: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              '&:hover': {
                bgcolor: 'action.selected',
              },
            }}
          >
            <i className='bx bx-sort-alt-2' style={{ fontSize: '18px' }}></i>
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 500,
                display: { xs: 'none', sm: 'block' }
              }}
            >
              {getSortLabel(selectedSort)}
            </Typography>
          </Button>
          <Menu
            anchorEl={sortAnchorEl}
            open={Boolean(sortAnchorEl)}
            onClose={handleSortClose}
            PaperProps={{
              sx: {
                mt: 1,
                borderRadius: 2,
                boxShadow: (theme) => 
                  theme.palette.mode === 'dark' 
                    ? '0 4px 12px rgba(0,0,0,0.5)' 
                    : '0 4px 12px rgba(0,0,0,0.1)',
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Box sx={{ px: 1, py: 0.5 }}>
              <Typography
                variant="caption"
                sx={{
                  px: 2,
                  py: 0.5,
                  color: 'text.secondary',
                  fontWeight: 600,
                  display: 'block',
                }}
              >
                Əlavə edilmə tarixi
              </Typography>
              <MenuItem
                onClick={() => handleSortSelect('newest')}
                selected={selectedSort === 'newest'}
                sx={{
                  borderRadius: 1,
                  fontSize: '0.875rem',
                  minWidth: 200,
                }}
              >
                <i className='bx bx-sort-down' style={{ fontSize: '18px', marginRight: '8px' }}></i>
                Ən yeni əlavə edilən
              </MenuItem>
              <MenuItem
                onClick={() => handleSortSelect('oldest')}
                selected={selectedSort === 'oldest'}
                sx={{
                  borderRadius: 1,
                  fontSize: '0.875rem',
                }}
              >
                <i className='bx bx-sort-up' style={{ fontSize: '18px', marginRight: '8px' }}></i>
                Ən əvvəl əlavə edilən
              </MenuItem>
            </Box>

            <Divider sx={{ my: 0.5 }} />

            <Box sx={{ px: 1, py: 0.5 }}>
              <Typography
                variant="caption"
                sx={{
                  px: 2,
                  py: 0.5,
                  color: 'text.secondary',
                  fontWeight: 600,
                  display: 'block',
                }}
              >
                IMDb Reytinqi
              </Typography>
              <MenuItem
                onClick={() => handleSortSelect('rating_high')}
                selected={selectedSort === 'rating_high'}
                sx={{
                  borderRadius: 1,
                  fontSize: '0.875rem',
                }}
              >
                <i className='bx bx-sort-down' style={{ fontSize: '18px', marginRight: '8px' }}></i>
                Yüksəkdən aşağı
              </MenuItem>
              <MenuItem
                onClick={() => handleSortSelect('rating_low')}
                selected={selectedSort === 'rating_low'}
                sx={{
                  borderRadius: 1,
                  fontSize: '0.875rem',
                }}
              >
                <i className='bx bx-sort-up' style={{ fontSize: '18px', marginRight: '8px' }}></i>
                Aşağıdan yüksəyə
              </MenuItem>
            </Box>

            <Divider sx={{ my: 0.5 }} />

            <Box sx={{ px: 1, py: 0.5 }}>
              <Typography
                variant="caption"
                sx={{
                  px: 2,
                  py: 0.5,
                  color: 'text.secondary',
                  fontWeight: 600,
                  display: 'block',
                }}
              >
                Mənim Reytinqim
              </Typography>
              <MenuItem
                onClick={() => handleSortSelect('user_rating_high')}
                selected={selectedSort === 'user_rating_high'}
                sx={{
                  borderRadius: 1,
                  fontSize: '0.875rem',
                }}
              >
                <i className='bx bx-sort-down' style={{ fontSize: '18px', marginRight: '8px' }}></i>
                Yüksəkdən aşağı
              </MenuItem>
              <MenuItem
                onClick={() => handleSortSelect('user_rating_low')}
                selected={selectedSort === 'user_rating_low'}
                sx={{
                  borderRadius: 1,
                  fontSize: '0.875rem',
                }}
              >
                <i className='bx bx-sort-up' style={{ fontSize: '18px', marginRight: '8px' }}></i>
                Aşağıdan yüksəyə
              </MenuItem>
            </Box>
          </Menu>
        </Box>
      </Box>

      <Grid container spacing={2}>
        {paginatedMovies.map((movie) => (
          <Grid item xs={12} sm={6} md={6} lg={4} key={movie.id}>
            <Card 
              sx={{ 
                display: 'flex',
                height: '180px',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.02)',
                },
                position: 'relative',
              }}
            >
              <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteMovie(movie.id);
                  }}
                className="delete-button"
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  background: 'white',
                  border: 'none',
                  borderRadius: '50%',
                    width: '30px',
                    height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s'
                }}
              >
                <i className='bx bx-trash' style={{ fontSize: '18px' }}></i>
              </button>
              <CardMedia
                component="img"
                sx={{
                  width: 120,
                  objectFit: 'cover',
                }}
                image={movie.poster}
                alt={movie.title}
              />
              <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <CardContent sx={{ flex: '1 0 auto', p: 2 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 'bold',
                      mb: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      lineHeight: 1.2,
                    }}
                  >
                    {movie.title}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      IMDb:
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 'bold', color: 'primary.main' }}
                    >
                      {movie.imdb_rating}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Rating
                      size="small"
                      value={movie.user_rating}
                      onChange={(_, newValue) =>
                        handleUpdateMovie(movie.id, { user_rating: newValue || 0 })
                      }
                    />
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 0.5,
                        color: 'text.secondary',
                        fontSize: '0.7rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      <i className='bx bx-time-five' style={{ fontSize: '14px' }}></i>
                      {formatDate(movie.created_at)}
                    </Typography>
                  </Box>
                </CardContent>
                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 0.5,
                      width: '100%',
                    }}
                  >
                  <Button
                      size="small"
                      variant={movie.status === 'watchlist' ? 'contained' : 'text'}
                      onClick={() =>
                        handleUpdateMovie(movie.id, { status: 'watchlist' })
                      }
                    sx={{
                        minWidth: 0,
                        flex: 1,
                        fontSize: '0.7rem',
                        borderRadius: 1.5,
                        py: 0.5,
                      textTransform: 'none',
                      boxShadow: 'none',
                        transition: 'all 0.2s',
                      '&:hover': {
                        boxShadow: 'none',
                          bgcolor: movie.status === 'watchlist' ? 'primary.dark' : 'action.hover',
                        },
                        ...(movie.status === 'watchlist' && {
                          '&:hover': {
                            bgcolor: 'primary.dark',
                          },
                        }),
                    }}
                  >
                      İzləniləcək
                  </Button>
                  <Button
                      size="small"
                      variant={movie.status === 'watching' ? 'contained' : 'text'}
                      onClick={() =>
                        handleUpdateMovie(movie.id, { status: 'watching' })
                      }
                    sx={{
                        minWidth: 0,
                        flex: 1,
                        fontSize: '0.7rem',
                        borderRadius: 1.5,
                        py: 0.5,
                      textTransform: 'none',
                      boxShadow: 'none',
                        transition: 'all 0.2s',
                      '&:hover': {
                        boxShadow: 'none',
                          bgcolor: movie.status === 'watching' ? 'primary.dark' : 'action.hover',
                        },
                        ...(movie.status === 'watching' && {
                          '&:hover': {
                            bgcolor: 'primary.dark',
                          },
                        }),
                      }}
                    >
                      İzlənilir
                    </Button>
                    <Button
                      size="small"
                      variant={movie.status === 'watched' ? 'contained' : 'text'}
                      onClick={() =>
                        handleUpdateMovie(movie.id, { status: 'watched' })
                      }
                      sx={{
                        minWidth: 0,
                        flex: 1,
                        fontSize: '0.7rem',
                        borderRadius: 1.5,
                        py: 0.5,
                        textTransform: 'none',
                        boxShadow: 'none',
                        transition: 'all 0.2s',
                        '&:hover': {
                          boxShadow: 'none',
                          bgcolor: movie.status === 'watched' ? 'primary.dark' : 'action.hover',
                        },
                        ...(movie.status === 'watched' && {
                          '&:hover': {
                            bgcolor: 'primary.dark',
                          },
                        }),
                    }}
                  >
                      İzlənildi
                  </Button>
                </Box>
              </CardActions>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredMovies.length > ITEMS_PER_PAGE && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mt: 4,
            mb: 2,
          }}
        >
          <Pagination
            count={Math.ceil(filteredMovies.length / ITEMS_PER_PAGE)}
            page={page}
            onChange={handlePageChange}
            color="primary"
            size="large"
            sx={{
              '& .MuiPaginationItem-root': {
                borderRadius: 2,
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
                '&.Mui-selected': {
                  fontWeight: 'bold',
                },
              },
            }}
          />
        </Box>
      )}

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        TransitionComponent={Fade}
        transitionDuration={300}
        PaperProps={{
          sx: {
            borderRadius: 2,
            bgcolor: 'background.paper',
            backgroundImage: 'none',
            overflow: 'hidden',
            maxHeight: '90vh'
          },
        }}
      >
        <DialogTitle
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <i className='bx bx-movie-play' style={{ fontSize: '24px' }}></i>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Film Axtar
            </Typography>
          </Box>
          <IconButton
            onClick={handleCloseDialog}
            size="small"
            sx={{
              color: 'text.secondary',
              transition: 'all 0.2s',
              '&:hover': {
                color: 'text.primary',
                transform: 'rotate(90deg)',
              },
            }}
          >
            <i className='bx bx-x' style={{ fontSize: '24px' }}></i>
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ 
          p: 2,
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
          },
        }}>
          <Box sx={{ display: 'flex', gap: 1, mb: 2, mt: 1.5 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="IMDb-də film axtar..."
              value={imdbSearchQuery}
              onChange={(e) => setImdbSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleImdbSearch();
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <i className='bx bx-search' style={{ fontSize: '20px', color: 'text.secondary' }}></i>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  transition: 'all 0.2s',
                  '&:hover': {
                    '& > fieldset': {
                      borderColor: 'primary.main',
                    },
                  },
                },
              }}
            />
            <Button
              variant="contained"
              onClick={handleImdbSearch}
              disabled={loading}
              sx={{
                minWidth: 100,
                borderRadius: 2,
                textTransform: 'none',
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: 'none',
                  bgcolor: 'primary.dark',
                },
              }}
            >
              {loading ? (
                <i className='bx bx-loader-alt bx-spin' ></i>
              ) : (
                'Axtar'
              )}
            </Button>
          </Box>

          {!searchResults.length && (
            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1.5,
                py: 4,
                color: 'text.secondary'
              }}
            >
              <i className='bx bx-movie-play' style={{ fontSize: '48px' }}></i>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                Yeni bir film axtarın
              </Typography>
              <Typography variant="caption" sx={{ textAlign: 'center', maxWidth: 300 }}>
                Film adını yazın və ya IMDb ID-sini daxil edin
              </Typography>
            </Box>
          )}

          <Grid container spacing={1.5}>
            {searchResults.map((movie, index) => (
              <Grow
                in={true}
                key={movie.imdbID}
                timeout={200 + index * 50}
              >
                <Grid item xs={6} sm={4} md={3}>
                <Card 
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.2s',
                    borderRadius: 2,
                    overflow: 'hidden',
                    bgcolor: 'background.paper',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: (theme) => `0 4px 12px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.1)'}`,
                      '& .movie-poster': {
                        transform: 'scale(1.05)',
                      },
                    },
                  }}
                >
                  <Box sx={{ position: 'relative', paddingTop: '130%', overflow: 'hidden' }}>
                    <CardMedia
                      component="img"
                      className="movie-poster"
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.3s ease',
                      }}
                      image={movie.Poster}
                      alt={movie.Title}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                        p: 1,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                        }}
                      >
                        <i className='bx bxs-star' style={{ color: '#ffd700' }}></i>
                        {movie.imdbRating}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'white',
                          textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                        }}
                      >
                        {movie.Year}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ p: 1.5, flexGrow: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 500,
                        mb: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        lineHeight: 1.2,
                      }}
                    >
                      {movie.Title}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {movie.Genre.split(',').map(genre => {
                        const genreMap: { [key: string]: string } = {
                          'Action': 'Fəaliyyət',
                          'Adventure': 'Macəra',
                          'Animation': 'Animasiya',
                          'Biography': 'Bioqrafiya',
                          'Comedy': 'Komediya',
                          'Crime': 'Cinayət',
                          'Documentary': 'Sənədli',
                          'Drama': 'Drama',
                          'Family': 'Ailə',
                          'Fantasy': 'Fantaziya',
                          'Film-Noir': 'Film-Noir',
                          'History': 'Tarix',
                          'Horror': 'Dəhşət',
                          'Music': 'Musiqi',
                          'Musical': 'Müzikal',
                          'Mystery': 'Sirr',
                          'Romance': 'Romantika',
                          'Sci-Fi': 'Elmi Fantastika',
                          'Sport': 'İdman',
                          'Thriller': 'Triller',
                          'War': 'Müharibə',
                          'Western': 'Vestern'
                        };
                        return genreMap[genre.trim()] || genre.trim();
                      }).join(' • ')}
                    </Typography>
                  </Box>
                  <CardActions sx={{ p: 1, pt: 0 }}>
                    <Button
                      fullWidth
                      size="small"
                      variant={isMovieInList(movie.imdbID) ? "outlined" : "contained"}
                      disabled={isMovieInList(movie.imdbID)}
                      onClick={() => handleAddMovie(movie)}
                      startIcon={isMovieInList(movie.imdbID) ? 
                        <i className='bx bx-check' ></i> : 
                        <i className='bx bx-plus' ></i>
                      }
                      sx={{
                        borderRadius: 1.5,
                        textTransform: 'none',
                        boxShadow: 'none',
                        '&:hover': {
                          boxShadow: 'none',
                          bgcolor: isMovieInList(movie.imdbID) ? 'transparent' : 'primary.dark',
                        },
                        ...(isMovieInList(movie.imdbID) && {
                          bgcolor: 'action.disabledBackground',
                          color: 'text.disabled',
                          borderColor: 'transparent',
                        }),
                      }}
                    >
                      {isMovieInList(movie.imdbID) ? 'Əlavə edilib' : 'Əlavə et'}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
              </Grow>
            ))}
          </Grid>
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default Home; 
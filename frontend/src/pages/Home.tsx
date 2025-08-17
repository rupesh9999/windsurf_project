import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Container,
  Paper,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { fetchProducts } from '../store/slices/productSlice';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { products, isLoading } = useSelector((state: RootState) => state.products);

  useEffect(() => {
    dispatch(fetchProducts({ limit: 8 }) as any);
  }, [dispatch]);

  const featuredProducts = products.slice(0, 4);

  return (
    <Box>
      {/* Hero Section */}
      <Paper
        sx={{
          position: 'relative',
          backgroundColor: 'grey.800',
          color: '#fff',
          mb: 4,
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundImage: 'linear-gradient(45deg, #1976d2 30%, #21CBF3 90%)',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            right: 0,
            left: 0,
            backgroundColor: 'rgba(0,0,0,.3)',
          }}
        />
        <Grid container>
          <Grid item md={6}>
            <Box
              sx={{
                position: 'relative',
                p: { xs: 3, md: 6 },
                pr: { md: 0 },
              }}
            >
              <Typography component="h1" variant="h3" color="inherit" gutterBottom>
                Welcome to E-Commerce Platform
              </Typography>
              <Typography variant="h5" color="inherit" paragraph>
                Discover amazing products with our modern microservices-powered shopping experience.
                Built with cutting-edge technology for performance and scalability.
              </Typography>
              <Button
                variant="contained"
                color="secondary"
                size="large"
                onClick={() => navigate('/products')}
                sx={{ mt: 2 }}
              >
                Shop Now
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Features Section */}
      <Container sx={{ py: 4 }}>
        <Typography variant="h4" component="h2" align="center" gutterBottom>
          Why Choose Our Platform?
        </Typography>
        <Grid container spacing={4} sx={{ mt: 2 }}>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', textAlign: 'center' }}>
              <CardContent>
                <Typography variant="h5" component="h3" gutterBottom>
                  🚀 Fast & Reliable
                </Typography>
                <Typography>
                  Built with microservices architecture for high performance and 99.9% uptime.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', textAlign: 'center' }}>
              <CardContent>
                <Typography variant="h5" component="h3" gutterBottom>
                  🔒 Secure
                </Typography>
                <Typography>
                  Enterprise-grade security with JWT authentication and encrypted transactions.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', textAlign: 'center' }}>
              <CardContent>
                <Typography variant="h5" component="h3" gutterBottom>
                  📱 Responsive
                </Typography>
                <Typography>
                  Optimized for all devices with modern React and Material-UI components.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <Container sx={{ py: 4 }}>
          <Typography variant="h4" component="h2" align="center" gutterBottom>
            Featured Products
          </Typography>
          <Grid container spacing={4} sx={{ mt: 2 }}>
            {featuredProducts.map((product) => (
              <Grid item key={product.id} xs={12} sm={6} md={3}>
                <Card
                  sx={{ height: '100%', cursor: 'pointer' }}
                  onClick={() => navigate(`/products/${product.id}`)}
                >
                  <CardMedia
                    component="img"
                    height="200"
                    image={product.imageUrl || '/placeholder-image.jpg'}
                    alt={product.name}
                  />
                  <CardContent>
                    <Typography gutterBottom variant="h6" component="div">
                      {product.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {product.description.substring(0, 100)}...
                    </Typography>
                    <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                      ${product.price}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/products')}
            >
              View All Products
            </Button>
          </Box>
        </Container>
      )}
    </Box>
  );
};

export default Home;

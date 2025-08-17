import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  Rating,
  Chip,
  CircularProgress,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { fetchProductById } from '../store/slices/productSlice';
import { addToCart } from '../store/slices/cartSlice';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentProduct, isLoading } = useSelector((state: RootState) => state.products);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (id) {
      dispatch(fetchProductById(id) as any);
    }
  }, [dispatch, id]);

  const handleAddToCart = () => {
    if (currentProduct) {
      for (let i = 0; i < quantity; i++) {
        dispatch(addToCart(currentProduct));
      }
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!currentProduct) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          Product not found
        </Typography>
        <Button variant="outlined" onClick={() => navigate('/products')} sx={{ mt: 2 }}>
          Back to Products
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Button variant="outlined" onClick={() => navigate('/products')} sx={{ mb: 3 }}>
        ← Back to Products
      </Button>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <img
            src={currentProduct.imageUrl || '/placeholder-image.jpg'}
            alt={currentProduct.name}
            style={{
              width: '100%',
              height: 'auto',
              maxHeight: '500px',
              objectFit: 'contain',
              borderRadius: '8px',
            }}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Typography variant="h4" component="h1" gutterBottom>
            {currentProduct.name}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Rating value={currentProduct.rating} readOnly precision={0.5} />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              ({currentProduct.reviews} reviews)
            </Typography>
          </Box>

          <Typography variant="h5" color="primary" sx={{ mb: 2 }}>
            ${currentProduct.price}
          </Typography>

          <Chip
            label={currentProduct.stock > 0 ? `${currentProduct.stock} in stock` : 'Out of stock'}
            color={currentProduct.stock > 0 ? 'success' : 'error'}
            sx={{ mb: 2 }}
          />

          <Typography variant="body1" paragraph sx={{ mb: 3 }}>
            {currentProduct.description}
          </Typography>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Product Details
              </Typography>
              <Typography variant="body2">
                <strong>Category:</strong> {currentProduct.category}
              </Typography>
              <Typography variant="body2">
                <strong>SKU:</strong> {currentProduct.id}
              </Typography>
            </CardContent>
          </Card>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <TextField
              type="number"
              label="Quantity"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              inputProps={{ min: 1, max: currentProduct.stock }}
              sx={{ width: '120px' }}
            />
            <Button
              variant="contained"
              size="large"
              onClick={handleAddToCart}
              disabled={currentProduct.stock === 0}
            >
              Add to Cart
            </Button>
          </Box>

          <Button
            variant="outlined"
            size="large"
            fullWidth
            onClick={() => {
              handleAddToCart();
              navigate('/cart');
            }}
            disabled={currentProduct.stock === 0}
          >
            Buy Now
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProductDetail;

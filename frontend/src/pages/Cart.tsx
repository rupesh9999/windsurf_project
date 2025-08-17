import React from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  TextField,
  Divider,
} from '@mui/material';
import { Add, Remove, Delete } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { updateQuantity, removeFromCart, clearCart } from '../store/slices/cartSlice';

const Cart: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items, total, itemCount } = useSelector((state: RootState) => state.cart);

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    dispatch(updateQuantity({ id: productId, quantity: newQuantity }));
  };

  const handleRemoveItem = (productId: string) => {
    dispatch(removeFromCart(productId));
  };

  const handleClearCart = () => {
    dispatch(clearCart());
  };

  if (items.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h5" gutterBottom>
          Your cart is empty
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Add some products to get started!
        </Typography>
        <Button variant="contained" onClick={() => navigate('/products')}>
          Continue Shopping
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Shopping Cart ({itemCount} items)
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {items.map((item) => (
            <Card key={item.product.id} sx={{ mb: 2 }}>
              <CardContent>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={3}>
                    <img
                      src={item.product.imageUrl || '/placeholder-image.jpg'}
                      alt={item.product.name}
                      style={{
                        width: '100%',
                        height: '120px',
                        objectFit: 'contain',
                        borderRadius: '4px',
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={5}>
                    <Typography variant="h6" gutterBottom>
                      {item.product.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.product.description.substring(0, 100)}...
                    </Typography>
                    <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                      ${item.product.price}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <Remove />
                      </IconButton>
                      <TextField
                        size="small"
                        value={item.quantity}
                        onChange={(e) => {
                          const qty = parseInt(e.target.value) || 1;
                          handleQuantityChange(item.product.id, qty);
                        }}
                        inputProps={{ min: 1, style: { textAlign: 'center', width: '60px' } }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stock}
                      >
                        <Add />
                      </IconButton>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="h6">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </Typography>
                      <IconButton
                        color="error"
                        onClick={() => handleRemoveItem(item.product.id)}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))}

          <Box sx={{ mt: 2 }}>
            <Button variant="outlined" color="error" onClick={handleClearCart}>
              Clear Cart
            </Button>
          </Box>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Order Summary
              </Typography>
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Subtotal:</Typography>
                <Typography>${total.toFixed(2)}</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Shipping:</Typography>
                <Typography>Free</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Tax:</Typography>
                <Typography>${(total * 0.08).toFixed(2)}</Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">Total:</Typography>
                <Typography variant="h6">${(total * 1.08).toFixed(2)}</Typography>
              </Box>
              
              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={() => navigate('/checkout')}
                sx={{ mb: 2 }}
              >
                Proceed to Checkout
              </Button>
              
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate('/products')}
              >
                Continue Shopping
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Cart;

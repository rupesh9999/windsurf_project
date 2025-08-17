import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { fetchUserOrders } from '../store/slices/orderSlice';

const Orders: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { orders, isLoading } = useSelector((state: RootState) => state.orders);

  useEffect(() => {
    dispatch(fetchUserOrders() as any);
  }, [dispatch]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'processing':
        return 'info';
      case 'shipped':
        return 'primary';
      case 'delivered':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (orders.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h5" gutterBottom>
          No orders yet
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Start shopping to see your orders here!
        </Typography>
        <Button variant="contained" onClick={() => navigate('/products')}>
          Browse Products
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        My Orders
      </Typography>

      <Grid container spacing={3}>
        {orders.map((order) => (
          <Grid item xs={12} key={order.id}>
            <Card>
              <CardContent>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={3}>
                    <Typography variant="h6" gutterBottom>
                      Order #{order.id.substring(0, 8)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={2}>
                    <Chip
                      label={order.status.toUpperCase()}
                      color={getStatusColor(order.status) as any}
                      variant="outlined"
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={2}>
                    <Typography variant="body2" color="text.secondary">
                      Items: {order.items.length}
                    </Typography>
                    <Typography variant="h6">
                      ${order.total.toFixed(2)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Shipping to:
                    </Typography>
                    <Typography variant="body2">
                      {order.shippingAddress.city}, {order.shippingAddress.state}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={2}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => navigate(`/orders/${order.id}`)}
                    >
                      View Details
                    </Button>
                  </Grid>
                </Grid>

                {/* Order Items Preview */}
                <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Grid container spacing={1}>
                    {order.items.slice(0, 3).map((item, index) => (
                      <Grid item key={index} xs={4} sm={2}>
                        <img
                          src={item.product.imageUrl || '/placeholder-image.jpg'}
                          alt={item.product.name}
                          style={{
                            width: '100%',
                            height: '60px',
                            objectFit: 'contain',
                            borderRadius: '4px',
                          }}
                        />
                      </Grid>
                    ))}
                    {order.items.length > 3 && (
                      <Grid item xs={4} sm={2}>
                        <Box
                          sx={{
                            height: '60px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'grey.100',
                            borderRadius: '4px',
                          }}
                        >
                          <Typography variant="body2">
                            +{order.items.length - 3} more
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Orders;

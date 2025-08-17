import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { createOrder } from '../store/slices/orderSlice';
import { clearCart } from '../store/slices/cartSlice';

const steps = ['Shipping Address', 'Payment Method', 'Review Order'];

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items, total } = useSelector((state: RootState) => state.cart);
  const { user } = useSelector((state: RootState) => state.auth);
  const { isLoading } = useSelector((state: RootState) => state.orders);
  
  const [activeStep, setActiveStep] = useState(0);
  const [shippingData, setShippingData] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
  });
  
  const [paymentData, setPaymentData] = useState({
    method: 'credit_card',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    nameOnCard: '',
  });

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleShippingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShippingData({
      ...shippingData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentData({
      ...paymentData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePlaceOrder = async () => {
    const orderData = {
      items,
      total: total * 1.08, // Including tax
      shippingAddress: shippingData,
      paymentMethod: paymentData.method,
    };

    try {
      await dispatch(createOrder(orderData) as any).unwrap();
      dispatch(clearCart());
      navigate('/orders');
    } catch (error) {
      console.error('Order creation failed:', error);
    }
  };

  if (items.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h5" gutterBottom>
          Your cart is empty
        </Typography>
        <Button variant="contained" onClick={() => navigate('/products')}>
          Continue Shopping
        </Button>
      </Box>
    );
  }

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Shipping Address
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Street Address"
                    name="street"
                    value={shippingData.street}
                    onChange={handleShippingChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="City"
                    name="city"
                    value={shippingData.city}
                    onChange={handleShippingChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="State"
                    name="state"
                    value={shippingData.state}
                    onChange={handleShippingChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="ZIP Code"
                    name="zipCode"
                    value={shippingData.zipCode}
                    onChange={handleShippingChange}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Country</InputLabel>
                    <Select
                      name="country"
                      value={shippingData.country}
                      label="Country"
                      onChange={(e) => setShippingData({ ...shippingData, country: e.target.value })}
                    >
                      <MenuItem value="United States">United States</MenuItem>
                      <MenuItem value="Canada">Canada</MenuItem>
                      <MenuItem value="United Kingdom">United Kingdom</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        );
      
      case 1:
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Payment Method
              </Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  name="method"
                  value={paymentData.method}
                  label="Payment Method"
                  onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value })}
                >
                  <MenuItem value="credit_card">Credit Card</MenuItem>
                  <MenuItem value="paypal">PayPal</MenuItem>
                  <MenuItem value="apple_pay">Apple Pay</MenuItem>
                </Select>
              </FormControl>
              
              {paymentData.method === 'credit_card' && (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Name on Card"
                      name="nameOnCard"
                      value={paymentData.nameOnCard}
                      onChange={handlePaymentChange}
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Card Number"
                      name="cardNumber"
                      value={paymentData.cardNumber}
                      onChange={handlePaymentChange}
                      placeholder="1234 5678 9012 3456"
                      required
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Expiry Date"
                      name="expiryDate"
                      value={paymentData.expiryDate}
                      onChange={handlePaymentChange}
                      placeholder="MM/YY"
                      required
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="CVV"
                      name="cvv"
                      value={paymentData.cvv}
                      onChange={handlePaymentChange}
                      placeholder="123"
                      required
                    />
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>
        );
      
      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Order Items
                  </Typography>
                  {items.map((item) => (
                    <Box key={item.product.id} sx={{ display: 'flex', mb: 2 }}>
                      <img
                        src={item.product.imageUrl || '/placeholder-image.jpg'}
                        alt={item.product.name}
                        style={{ width: '80px', height: '80px', objectFit: 'contain', marginRight: '16px' }}
                      />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1">{item.product.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Quantity: {item.quantity}
                        </Typography>
                        <Typography variant="body2">
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </CardContent>
              </Card>
              
              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Shipping Address
                  </Typography>
                  <Typography variant="body2">
                    {shippingData.street}<br />
                    {shippingData.city}, {shippingData.state} {shippingData.zipCode}<br />
                    {shippingData.country}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Order Summary
                  </Typography>
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
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">Total:</Typography>
                    <Typography variant="h6">${(total * 1.08).toFixed(2)}</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );
      
      default:
        return null;
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Checkout
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {renderStepContent(activeStep)}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
        >
          Back
        </Button>
        
        {activeStep === steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={handlePlaceOrder}
            disabled={isLoading}
          >
            {isLoading ? 'Placing Order...' : 'Place Order'}
          </Button>
        ) : (
          <Button variant="contained" onClick={handleNext}>
            Next
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default Checkout;

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
} from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { registerUser, clearError } from '../store/slices/authSlice';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoading, error, isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setValidationError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setValidationError('Password must be at least 6 characters long');
      return;
    }

    const { confirmPassword, ...userData } = formData;
    dispatch(registerUser(userData) as any);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
      }}
    >
      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" align="center" gutterBottom>
            Register
          </Typography>
          
          {(error || validationError) && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error || validationError}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              sx={{ mb: 3 }}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading}
              sx={{ mb: 2 }}
            >
              {isLoading ? 'Creating Account...' : 'Register'}
            </Button>
          </form>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2">
              Already have an account?{' '}
              <Link component={RouterLink} to="/login">
                Login here
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Register;

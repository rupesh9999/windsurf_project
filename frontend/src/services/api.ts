import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),
  register: (userData: { email: string; password: string; firstName: string; lastName: string }) =>
    api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/me'),
  refreshToken: () => api.post('/auth/refresh'),
};

// Product API
export const productAPI = {
  getProducts: (params?: any) => api.get('/products', { params }),
  getProductById: (id: string) => api.get(`/products/${id}`),
  searchProducts: (query: string) => api.get(`/products/search?q=${query}`),
  getCategories: () => api.get('/products/categories'),
};

// Cart API (if needed for server-side cart)
export const cartAPI = {
  getCart: () => api.get('/cart'),
  addToCart: (productId: string, quantity: number) =>
    api.post('/cart/add', { productId, quantity }),
  updateCartItem: (itemId: string, quantity: number) =>
    api.put(`/cart/items/${itemId}`, { quantity }),
  removeFromCart: (itemId: string) => api.delete(`/cart/items/${itemId}`),
  clearCart: () => api.delete('/cart'),
};

// Order API
export const orderAPI = {
  createOrder: (orderData: any) => api.post('/orders', orderData),
  getUserOrders: () => api.get('/orders'),
  getOrderById: (id: string) => api.get(`/orders/${id}`),
  updateOrderStatus: (id: string, status: string) =>
    api.put(`/orders/${id}/status`, { status }),
};

// Payment API
export const paymentAPI = {
  createPaymentIntent: (amount: number) =>
    api.post('/payments/create-intent', { amount }),
  confirmPayment: (paymentIntentId: string) =>
    api.post('/payments/confirm', { paymentIntentId }),
  getPaymentMethods: () => api.get('/payments/methods'),
};

// User API
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (userData: any) => api.put('/users/profile', userData),
  changePassword: (passwordData: { currentPassword: string; newPassword: string }) =>
    api.put('/users/change-password', passwordData),
  getAddresses: () => api.get('/users/addresses'),
  addAddress: (address: any) => api.post('/users/addresses', address),
  updateAddress: (id: string, address: any) => api.put(`/users/addresses/${id}`, address),
  deleteAddress: (id: string) => api.delete(`/users/addresses/${id}`),
};

export default api;

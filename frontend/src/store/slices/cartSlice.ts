import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Product } from './productSlice';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
}

const initialState: CartState = {
  items: JSON.parse(localStorage.getItem('cart') || '[]'),
  total: 0,
  itemCount: 0,
};

// Calculate totals
const calculateTotals = (items: CartItem[]) => {
  const total = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  return { total, itemCount };
};

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    ...initialState,
    ...calculateTotals(initialState.items),
  },
  reducers: {
    addToCart: (state, action: PayloadAction<Product>) => {
      const existingItem = state.items.find(item => item.product.id === action.payload.id);
      
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.items.push({ product: action.payload, quantity: 1 });
      }
      
      const totals = calculateTotals(state.items);
      state.total = totals.total;
      state.itemCount = totals.itemCount;
      
      localStorage.setItem('cart', JSON.stringify(state.items));
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.product.id !== action.payload);
      
      const totals = calculateTotals(state.items);
      state.total = totals.total;
      state.itemCount = totals.itemCount;
      
      localStorage.setItem('cart', JSON.stringify(state.items));
    },
    updateQuantity: (state, action: PayloadAction<{ id: string; quantity: number }>) => {
      const item = state.items.find(item => item.product.id === action.payload.id);
      
      if (item) {
        if (action.payload.quantity <= 0) {
          state.items = state.items.filter(item => item.product.id !== action.payload.id);
        } else {
          item.quantity = action.payload.quantity;
        }
      }
      
      const totals = calculateTotals(state.items);
      state.total = totals.total;
      state.itemCount = totals.itemCount;
      
      localStorage.setItem('cart', JSON.stringify(state.items));
    },
    clearCart: (state) => {
      state.items = [];
      state.total = 0;
      state.itemCount = 0;
      localStorage.removeItem('cart');
    },
  },
});

export const { addToCart, removeFromCart, updateQuantity, clearCart } = cartSlice.actions;
export default cartSlice.reducer;

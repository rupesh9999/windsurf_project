import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { productAPI } from '../../services/api';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  stock: number;
  rating: number;
  reviews: number;
}

interface ProductState {
  products: Product[];
  currentProduct: Product | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    category: string;
    minPrice: number;
    maxPrice: number;
    search: string;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

const initialState: ProductState = {
  products: [],
  currentProduct: null,
  isLoading: false,
  error: null,
  filters: {
    category: '',
    minPrice: 0,
    maxPrice: 10000,
    search: '',
  },
  pagination: {
    page: 1,
    limit: 12,
    total: 0,
  },
};

export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (params: any, { rejectWithValue }) => {
    try {
      const response = await productAPI.getProducts(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch products');
    }
  }
);

export const fetchProductById = createAsyncThunk(
  'products/fetchProductById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await productAPI.getProductById(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch product');
    }
  }
);

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch products
      .addCase(fetchProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.products = action.payload.products;
        state.pagination.total = action.payload.total;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch product by ID
      .addCase(fetchProductById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentProduct = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setFilters, setPagination, clearError } = productSlice.actions;
export default productSlice.reducer;

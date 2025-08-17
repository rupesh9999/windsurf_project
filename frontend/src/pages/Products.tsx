import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { fetchProducts, setFilters, setPagination } from '../store/slices/productSlice';
import { addToCart } from '../store/slices/cartSlice';

const Products: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { products, isLoading, filters, pagination } = useSelector((state: RootState) => state.products);
  
  const [searchTerm, setSearchTerm] = useState(filters.search);

  useEffect(() => {
    dispatch(fetchProducts({
      page: pagination.page,
      limit: pagination.limit,
      category: filters.category,
      search: filters.search,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
    }) as any);
  }, [dispatch, pagination.page, filters]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(setFilters({ search: searchTerm }));
    dispatch(setPagination({ page: 1 }));
  };

  const handleCategoryChange = (category: string) => {
    dispatch(setFilters({ category }));
    dispatch(setPagination({ page: 1 }));
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    dispatch(setPagination({ page: value }));
  };

  const handleAddToCart = (product: any) => {
    dispatch(addToCart(product));
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Products
      </Typography>

      {/* Filters */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <form onSubmit={handleSearch}>
              <TextField
                fullWidth
                label="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                variant="outlined"
              />
            </form>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={filters.category}
                label="Category"
                onChange={(e) => handleCategoryChange(e.target.value)}
              >
                <MenuItem value="">All Categories</MenuItem>
                <MenuItem value="electronics">Electronics</MenuItem>
                <MenuItem value="clothing">Clothing</MenuItem>
                <MenuItem value="books">Books</MenuItem>
                <MenuItem value="home">Home & Garden</MenuItem>
                <MenuItem value="sports">Sports</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              variant="outlined"
              onClick={() => {
                dispatch(setFilters({ category: '', search: '', minPrice: 0, maxPrice: 10000 }));
                setSearchTerm('');
                dispatch(setPagination({ page: 1 }));
              }}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Products Grid */}
      <Grid container spacing={3}>
        {products.map((product) => (
          <Grid item key={product.id} xs={12} sm={6} md={4} lg={3}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardMedia
                component="img"
                height="200"
                image={product.imageUrl || '/placeholder-image.jpg'}
                alt={product.name}
                sx={{ cursor: 'pointer' }}
                onClick={() => navigate(`/products/${product.id}`)}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography
                  gutterBottom
                  variant="h6"
                  component="div"
                  sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/products/${product.id}`)}
                >
                  {product.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {product.description.substring(0, 100)}...
                </Typography>
                <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
                  ${product.price}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stock === 0}
                  >
                    {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => navigate(`/products/${product.id}`)}
                  >
                    View Details
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Pagination */}
      {pagination.total > pagination.limit && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={Math.ceil(pagination.total / pagination.limit)}
            page={pagination.page}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      )}

      {products.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            No products found. Try adjusting your filters.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default Products;

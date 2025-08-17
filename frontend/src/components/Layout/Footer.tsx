import React from 'react';
import { Box, Container, Typography, Link, Grid } from '@mui/material';

const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: 'primary.main',
        color: 'white',
        py: 3,
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" gutterBottom>
              E-Commerce Platform
            </Typography>
            <Typography variant="body2">
              Modern microservices-based e-commerce solution with cloud-native architecture.
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" gutterBottom>
              Quick Links
            </Typography>
            <Link href="/products" color="inherit" display="block">
              Products
            </Link>
            <Link href="/about" color="inherit" display="block">
              About Us
            </Link>
            <Link href="/contact" color="inherit" display="block">
              Contact
            </Link>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" gutterBottom>
              Customer Service
            </Typography>
            <Link href="/help" color="inherit" display="block">
              Help Center
            </Link>
            <Link href="/returns" color="inherit" display="block">
              Returns
            </Link>
            <Link href="/shipping" color="inherit" display="block">
              Shipping Info
            </Link>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" gutterBottom>
              Connect
            </Typography>
            <Typography variant="body2">
              Follow us on social media for updates and offers.
            </Typography>
          </Grid>
        </Grid>
        <Box mt={3} pt={3} borderTop={1} borderColor="rgba(255,255,255,0.2)">
          <Typography variant="body2" align="center">
            © 2024 E-Commerce Platform. Built with microservices architecture.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;

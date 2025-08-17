import dotenv from 'dotenv';

dotenv.config();

export default {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3004', 10),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    name: process.env.DB_NAME || 'payment_service',
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
  },
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'your-jwt-secret-key',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-jwt-refresh-secret-key',
  },
  
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_your_stripe_secret_key',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_your_stripe_publishable_key',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_your_webhook_secret',
  },
  
  services: {
    userService: process.env.USER_SERVICE_URL || 'http://localhost:3001',
    orderService: process.env.ORDER_SERVICE_URL || 'http://localhost:3003',
  },
};

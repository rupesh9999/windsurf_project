import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { connectDatabase } from './config/database';
import redis from './config/redis';
import config from './config/config';
import logger from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

// Routes
import paymentRoutes from './routes/payments';
import webhookRoutes from './routes/webhooks';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// Body parsing middleware
app.use('/api/webhooks', express.raw({ type: 'application/json' })); // Raw body for webhooks
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'payment-service',
  });
});

// Swagger documentation
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Payment Service API',
      version: '1.0.0',
      description: 'Payment processing service for e-commerce platform',
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/payments', paymentRoutes);
app.use('/api/webhooks', webhookRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();
    logger.info('Database connected successfully');

    // Test Redis connection
    await redis.ping();
    logger.info('Redis connected successfully');

    const server = app.listen(config.port, () => {
      logger.info(`Payment Service running on port ${config.port}`);
      logger.info(`API Documentation: http://localhost:${config.port}/api-docs`);
      logger.info(`Environment: ${config.nodeEnv}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

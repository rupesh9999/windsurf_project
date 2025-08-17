import { createClient } from 'redis';
import { config } from './config';
import { logger } from '../utils/logger';

export const redisClient = createClient({
  socket: {
    host: config.redis.host,
    port: config.redis.port,
  },
  password: config.redis.password,
});

redisClient.on('error', (err) => {
  logger.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  logger.info('Redis client connected');
});

redisClient.on('ready', () => {
  logger.info('Redis client ready');
});

export const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
    logger.info('Redis connection established successfully');
  } catch (error) {
    logger.error('Unable to connect to Redis:', error);
    throw error;
  }
};

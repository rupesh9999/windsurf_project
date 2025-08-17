import Redis from 'ioredis';
import config from './config';
import logger from '../utils/logger';

const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
});

redis.on('connect', () => {
  logger.info('Connected to Redis');
});

redis.on('error', (error) => {
  logger.error('Redis connection error:', error);
});

redis.on('ready', () => {
  logger.info('Redis is ready');
});

redis.on('close', () => {
  logger.warn('Redis connection closed');
});

export default redis;

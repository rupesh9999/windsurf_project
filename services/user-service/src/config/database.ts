import { Sequelize } from 'sequelize';
import { config } from './config';
import { logger } from '../utils/logger';

export const sequelize = new Sequelize({
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.database,
  dialect: 'mysql',
  logging: (msg) => logger.debug(msg),
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: true,
  },
});

export const connectDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: config.nodeEnv === 'development' });
    logger.info('Database connection established successfully');
  } catch (error) {
    logger.error('Unable to connect to database:', error);
    throw error;
  }
};

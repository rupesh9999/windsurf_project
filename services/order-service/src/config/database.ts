import { Sequelize } from 'sequelize';
import config from './config';
import logger from '../utils/logger';

const sequelize = new Sequelize(
  config.database.name,
  config.database.username,
  config.database.password,
  {
    host: config.database.host,
    port: config.database.port,
    dialect: 'mysql',
    logging: config.nodeEnv === 'development' ? (msg) => logger.debug(msg) : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

export const connectDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully');
    
    await sequelize.sync({ alter: config.nodeEnv === 'development' });
    logger.info('Database synchronized');
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    throw error;
  }
};

export default sequelize;

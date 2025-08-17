import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  // Sequelize validation error
  if (error.name === 'SequelizeValidationError') {
    const errors = error.errors.map((err: any) => ({
      field: err.path,
      message: err.message,
    }));
    return res.status(400).json({
      message: 'Validation error',
      errors,
    });
  }

  // Sequelize unique constraint error
  if (error.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      message: 'Resource already exists',
      field: error.errors[0]?.path,
    });
  }

  // Default error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';

  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};

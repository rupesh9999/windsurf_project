import { Request, Response, NextFunction } from 'express';
import { ValidationError } from 'sequelize';
import logger from '../utils/logger';

interface CustomError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorHandler = (
  error: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  // Sequelize validation errors
  if (error instanceof ValidationError) {
    const errors = error.errors.map((err) => ({
      field: err.path,
      message: err.message,
    }));
    res.status(400).json({
      error: 'Validation failed',
      details: errors,
    });
    return;
  }

  // Custom application errors
  if (error.statusCode) {
    res.status(error.statusCode).json({
      error: error.message,
    });
    return;
  }

  // Default server error
  res.status(500).json({
    error: 'Internal server error',
  });
};

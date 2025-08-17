import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/config';
import redis from '../config/redis';
import logger from '../utils/logger';

interface JwtPayload {
  userId: number;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    // Check if token is blacklisted
    const isBlacklisted = await redis.get(`blacklist:${token}`);
    if (isBlacklisted) {
      res.status(401).json({ error: 'Token is invalid' });
      return;
    }

    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
    } else {
      res.status(500).json({ error: 'Authentication failed' });
    }
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
};

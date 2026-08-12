import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { verifyAccessToken } from '../utils/jwt';
import type { AuthRequest } from '../models/auth.model';

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Token tidak ditemukan', 401));
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return next(new AppError('Token tidak ditemukan', 401));
  }

  try {
    const payload = verifyAccessToken(token);
    (req as AuthRequest).user = payload;
    next();
  } catch {
    next(new AppError('Token tidak valid atau sudah kedaluwarsa', 401));
  }
};

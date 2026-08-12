import type { Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { AppError } from '../utils/AppError';
import type { AuthRequest } from '../models/auth.model';

export const authorize = (...roles: string[]) => {
  return async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(new AppError('Unauthorized', 401));
      }

      const user = await prisma.users.findUnique({
        where: { id: req.user.userId },
        select: { role: true },
      });

      if (!user) {
        return next(new AppError('User tidak ditemukan', 401));
      }

      if (!roles.includes(user.role)) {
        return next(new AppError('Akses ditolak', 403));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

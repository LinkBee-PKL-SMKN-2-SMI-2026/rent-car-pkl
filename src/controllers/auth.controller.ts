import { hash, compare } from 'bcrypt';
import { catchAsync } from '../utils/catchAsync';
import { logger } from '../utils/logger';
import { AppError } from '../utils/AppError';
import { prisma } from '../utils/prisma';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { logActivity } from '../services/activity-log.service';
import type { AuthRequest, TokenPayload } from '../models/auth.model';
import type { RegisterRequest, LoginRequest } from '../models/auth.dto';

export const register = catchAsync(async (req, res) => {
  const { name, email, password } = req.body as RegisterRequest;

  const isExist = await prisma.users.findUnique({ where: { email } });
  if (isExist) {
    throw new AppError(`Email ${email} sudah terdaftar`, 409);
  }

  const hashedPassword = await hash(password, 10);

  const user = await prisma.users.create({
    data: { name, email, password: hashedPassword },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  const accessToken = generateAccessToken({ userId: user.id, email: user.email });
  const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });

  logger.info(
    { event: 'USER_REGISTERED', userId: user.id, email: user.email },
    `User ${email} berhasil terdaftar`,
  );

  await logActivity({ userId: user.id, action: 'CREATE', entity: 'Users', entityId: user.id });

  res.status(201).json({
    success: true,
    message: 'Registrasi berhasil',
    data: { user, accessToken, refreshToken },
  });
});

export const login = catchAsync(async (req, res) => {
  const { email, password } = req.body as LoginRequest;

  const user = await prisma.users.findUnique({ where: { email } });
  if (!user) {
    throw new AppError('Email atau password salah', 401);
  }

  if (!user.isActive) {
    throw new AppError('Akun sudah dinonaktifkan', 401);
  }

  const isMatch = await compare(password, user.password);
  if (!isMatch) {
    throw new AppError('Email atau password salah', 401);
  }

  const accessToken = generateAccessToken({ userId: user.id, email: user.email });
  const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });

  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };

  logger.info(
    { event: 'USER_LOGIN', userId: user.id, email: user.email },
    `User ${email} berhasil login`,
  );

  await logActivity({ userId: user.id, action: 'LOGIN', entity: 'Users' });

  res.status(200).json({
    success: true,
    message: 'Login berhasil',
    data: { user: safeUser, accessToken, refreshToken },
  });
});

export const getMe = catchAsync(async (req: AuthRequest, res) => {
  const { userId } = req.user as TokenPayload;

  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError('User tidak ditemukan', 404);
  }

  logger.info({ event: 'USER_GET_ME', userId }, `User ${userId} mengambil data diri`);

  res.json({ success: true, message: 'Data user berhasil diambil', data: user });
});

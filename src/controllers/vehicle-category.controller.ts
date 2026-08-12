import { Prisma } from '../generated/prisma/client';
import { catchAsync } from '../utils/catchAsync';
import { logger } from '../utils/logger';
import { AppError } from '../utils/AppError';
import { prisma } from '../utils/prisma';
import { logActivity } from '../services/activity-log.service';
import type { AuthRequest } from '../models/auth.model';
import type {
  CreateVehicleCategoryRequest,
  GetAllVehicleCategoryQuery,
  GetVehicleCategoryByIdParams,
  UpdateVehicleCategoryRequest,
  UpdateVehicleCategoryParams,
  DeleteVehicleCategoryParams,
} from '../models/vehicle-category.dto';

export const createVehicleCategory = catchAsync(async (req, res) => {
  const { name, description } = req.body as CreateVehicleCategoryRequest;
  const userId = (req as AuthRequest).user?.userId;

  const isExist = await prisma.vehicleCategories.findUnique({ where: { name } });
  if (isExist) {
    throw new AppError(`Kategori ${name} sudah ada`, 409);
  }

  const category = await prisma.vehicleCategories.create({
    data: { name, description },
  });

  logger.info(
    { event: 'VEHICLE_CATEGORY_CREATED', id: category.id },
    `Kategori ${name} berhasil dibuat`,
  );

  if (userId) {
    await logActivity({
      userId,
      action: 'CREATE',
      entity: 'VehicleCategories',
      entityId: category.id,
      detail: { name },
    });
  }

  res.status(201).json({
    success: true,
    message: 'Kategori kendaraan berhasil dibuat',
    data: category,
  });
});

export const getAllVehicleCategories = catchAsync(async (req, res) => {
  const query = req.query as unknown as GetAllVehicleCategoryQuery;
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const { search, sort = 'asc', isActive } = query;

  const where: Prisma.VehicleCategoriesWhereInput = {};

  if (isActive) {
    where.isActive = isActive === 'true';
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.vehicleCategories.findMany({
      where,
      orderBy: { name: sort },
      skip: (page - 1) * limit,
      take: limit,
      include: { _count: { select: { vehicles: true } } },
    }),
    prisma.vehicleCategories.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  logger.info(
    { event: 'VEHICLE_CATEGORIES_FETCHED', page, limit, total, search: search ?? null },
    'Berhasil mengambil data kategori kendaraan',
  );

  res.status(200).json({
    success: true,
    message: 'Kategori kendaraan berhasil diambil',
    data,
    pagination: { page, limit, total, totalPages },
  });
});

export const getVehicleCategoryById = catchAsync(async (req, res) => {
  const { id } = req.params as unknown as GetVehicleCategoryByIdParams;

  const category = await prisma.vehicleCategories.findUnique({
    where: { id },
    include: {
      _count: { select: { vehicles: true } },
      vehicles: { select: { id: true, name: true, plateNumber: true, isActive: true } },
    },
  });

  if (!category) {
    throw new AppError(`Kategori dengan ID ${id} tidak ditemukan`, 404);
  }

  logger.info({ event: 'VEHICLE_CATEGORY_FETCHED', id }, `Kategori ${id} berhasil diambil`);

  res.status(200).json({
    success: true,
    message: 'Kategori kendaraan berhasil diambil',
    data: category,
  });
});

export const updateVehicleCategory = catchAsync(async (req, res) => {
  const { id } = req.params as unknown as UpdateVehicleCategoryParams;
  const { name, description, isActive } = req.body as UpdateVehicleCategoryRequest;
  const userId = (req as AuthRequest).user?.userId;

  const existing = await prisma.vehicleCategories.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(`Kategori dengan ID ${id} tidak ditemukan`, 404);
  }

  if (name) {
    const duplicate = await prisma.vehicleCategories.findFirst({
      where: { name, id: { not: id } },
    });
    if (duplicate) {
      throw new AppError(`Nama kategori ${name} sudah digunakan`, 409);
    }
  }

  const updated = await prisma.vehicleCategories.update({
    where: { id },
    data: { name, description, isActive },
  });

  logger.info({ event: 'VEHICLE_CATEGORY_UPDATED', id }, `Kategori ${id} berhasil diupdate`);

  if (userId) {
    await logActivity({
      userId,
      action: 'UPDATE',
      entity: 'VehicleCategories',
      entityId: updated.id,
      detail: { changes: { name, description, isActive } },
    });
  }

  res.status(200).json({
    success: true,
    message: 'Kategori kendaraan berhasil diupdate',
    data: updated,
  });
});

export const deleteVehicleCategory = catchAsync(async (req, res) => {
  const { id } = req.params as unknown as DeleteVehicleCategoryParams;
  const userId = (req as AuthRequest).user?.userId;

  const existing = await prisma.vehicleCategories.findUnique({
    where: { id },
    include: { _count: { select: { vehicles: true } } },
  });
  if (!existing) {
    throw new AppError(`Kategori dengan ID ${id} tidak ditemukan`, 404);
  }

  if (existing._count.vehicles > 0) {
    throw new AppError('Kategori tidak bisa dihapus karena masih memiliki kendaraan', 400);
  }

  const deleted = await prisma.vehicleCategories.delete({ where: { id } });

  logger.info({ event: 'VEHICLE_CATEGORY_DELETED', id }, `Kategori ${id} berhasil dihapus`);

  if (userId) {
    await logActivity({
      userId,
      action: 'DELETE',
      entity: 'VehicleCategories',
      entityId: deleted.id,
    });
  }

  res.status(200).json({
    success: true,
    message: 'Kategori kendaraan berhasil dihapus',
    data: deleted,
  });
});

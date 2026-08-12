import { Prisma } from '../generated/prisma/client';
import { catchAsync } from '../utils/catchAsync';
import { logger } from '../utils/logger';
import { AppError } from '../utils/AppError';
import { prisma } from '../utils/prisma';
import { parseDateInput } from '../utils/date';
import { logActivity } from '../services/activity-log.service';
import { getAvailableVehicles, getUnavailableVehicleIds } from '../services/availability.service';
import type { AuthRequest } from '../models/auth.model';
import type {
  CreateVehicleRequest,
  GetAllVehicleQuery,
  GetVehicleByIdParams,
  UpdateVehicleRequest,
  UpdateVehicleParams,
  DeleteVehicleParams,
  GetAvailableVehiclesQuery,
} from '../models/vehicle.dto';

export const getAvailableVehiclesHandler = catchAsync(async (req, res) => {
  const query = req.query as unknown as GetAvailableVehiclesQuery;
  const startDate = parseDateInput(query.startDate as unknown as string, 'startDate');
  const endDate = parseDateInput(query.endDate as unknown as string, 'endDate');
  const { categoryId, search } = query;

  const vehicles = await getAvailableVehicles({ startDate, endDate, categoryId, search });

  logger.info(
    {
      event: 'VEHICLES_AVAILABLE_FETCHED',
      startDate,
      endDate,
      categoryId: categoryId ?? null,
      search: search ?? null,
      total: vehicles.length,
    },
    'Berhasil mengambil kendaraan yang tersedia',
  );

  res.status(200).json({
    success: true,
    message: 'Kendaraan yang tersedia berhasil diambil',
    data: vehicles,
    summary: {
      startDate,
      endDate,
      totalAvailable: vehicles.length,
    },
  });
});

export const getAllVehicles = catchAsync(async (req, res) => {
  const query = req.query as unknown as GetAllVehicleQuery;
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const { search, sort = 'asc', categoryId, transmission, startDate, endDate } = query;

  let unavailableIds: string[] = [];
  if (startDate && endDate) {
    const start = parseDateInput(startDate as unknown as string, 'startDate');
    const end = parseDateInput(endDate as unknown as string, 'endDate');
    unavailableIds = await getUnavailableVehicleIds(start, end);
  }

  const where: Prisma.VehiclesWhereInput = {};

  if (unavailableIds.length > 0) {
    where.id = { notIn: unavailableIds };
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (transmission) {
    where.transmission = transmission;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { plateNumber: { contains: search, mode: 'insensitive' } },
      { brand: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.vehicles.findMany({
      where,
      orderBy: { name: sort },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        category: { select: { id: true, name: true } },
        rates: { where: { isActive: true }, orderBy: { price: 'asc' } },
      },
    }),
    prisma.vehicles.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  logger.info(
    { event: 'VEHICLES_FETCHED', page, limit, total, search: search ?? null },
    'Berhasil mengambil data kendaraan',
  );

  res.status(200).json({
    success: true,
    message: 'Kendaraan berhasil diambil',
    data,
    pagination: { page, limit, total, totalPages },
  });
});

export const getVehicleById = catchAsync(async (req, res) => {
  const { id } = req.params as unknown as GetVehicleByIdParams;

  const vehicle = await prisma.vehicles.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true } },
      rates: { where: { isActive: true }, orderBy: { price: 'asc' } },
    },
  });

  if (!vehicle) {
    throw new AppError(`Kendaraan dengan ID ${id} tidak ditemukan`, 404);
  }

  logger.info({ event: 'VEHICLE_FETCHED', id }, `Kendaraan ${id} berhasil diambil`);

  res.status(200).json({
    success: true,
    message: 'Kendaraan berhasil diambil',
    data: vehicle,
  });
});

export const getVehicleRates = catchAsync(async (req, res) => {
  const { id } = req.params as unknown as GetVehicleByIdParams;

  const vehicle = await prisma.vehicles.findUnique({ where: { id } });
  if (!vehicle) {
    throw new AppError(`Kendaraan dengan ID ${id} tidak ditemukan`, 404);
  }

  const rates = await prisma.vehicleRates.findMany({
    where: { vehicleId: id, isActive: true },
    orderBy: [{ durationType: 'asc' }, { withDriver: 'asc' }],
  });

  logger.info(
    { event: 'VEHICLE_RATES_FETCHED', vehicleId: id },
    `Tarif kendaraan ${id} berhasil diambil`,
  );

  res.status(200).json({
    success: true,
    message: 'Tarif kendaraan berhasil diambil',
    data: rates,
  });
});

export const createVehicle = catchAsync(async (req, res) => {
  const body = req.body as CreateVehicleRequest;
  const userId = (req as AuthRequest).user?.userId;

  const isExist = await prisma.vehicles.findUnique({ where: { plateNumber: body.plateNumber } });
  if (isExist) {
    throw new AppError(`Kendaraan dengan plat ${body.plateNumber} sudah ada`, 409);
  }

  const category = await prisma.vehicleCategories.findUnique({ where: { id: body.categoryId } });
  if (!category) {
    throw new AppError('Kategori tidak ditemukan', 400);
  }

  const vehicle = await prisma.vehicles.create({ data: body });

  logger.info(
    { event: 'VEHICLE_CREATED', id: vehicle.id },
    `Kendaraan ${vehicle.name} berhasil dibuat`,
  );

  if (userId) {
    await logActivity({
      userId,
      action: 'CREATE',
      entity: 'Vehicles',
      entityId: vehicle.id,
      detail: { name: vehicle.name, plateNumber: vehicle.plateNumber },
    });
  }

  res.status(201).json({
    success: true,
    message: 'Kendaraan berhasil dibuat',
    data: vehicle,
  });
});

export const updateVehicle = catchAsync(async (req, res) => {
  const { id } = req.params as unknown as UpdateVehicleParams;
  const body = req.body as UpdateVehicleRequest;
  const userId = (req as AuthRequest).user?.userId;

  const existing = await prisma.vehicles.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(`Kendaraan dengan ID ${id} tidak ditemukan`, 404);
  }

  if (body.plateNumber) {
    const duplicate = await prisma.vehicles.findFirst({
      where: { plateNumber: body.plateNumber, id: { not: id } },
    });
    if (duplicate) {
      throw new AppError(`Plat ${body.plateNumber} sudah digunakan kendaraan lain`, 409);
    }
  }

  if (body.categoryId) {
    const category = await prisma.vehicleCategories.findUnique({ where: { id: body.categoryId } });
    if (!category) {
      throw new AppError('Kategori tidak ditemukan', 400);
    }
  }

  const updated = await prisma.vehicles.update({
    where: { id },
    data: body,
  });

  logger.info({ event: 'VEHICLE_UPDATED', id }, `Kendaraan ${id} berhasil diupdate`);

  if (userId) {
    await logActivity({
      userId,
      action: 'UPDATE',
      entity: 'Vehicles',
      entityId: updated.id,
      detail: { changes: { name: body.name, plateNumber: body.plateNumber } },
    });
  }

  res.status(200).json({
    success: true,
    message: 'Kendaraan berhasil diupdate',
    data: updated,
  });
});

export const deleteVehicle = catchAsync(async (req, res) => {
  const { id } = req.params as unknown as DeleteVehicleParams;
  const userId = (req as AuthRequest).user?.userId;

  const existing = await prisma.vehicles.findUnique({
    where: { id },
    include: { _count: { select: { bookingItems: true } } },
  });
  if (!existing) {
    throw new AppError(`Kendaraan dengan ID ${id} tidak ditemukan`, 404);
  }

  if (existing._count.bookingItems > 0) {
    throw new AppError('Kendaraan tidak bisa dihapus karena memiliki riwayat booking', 400);
  }

  const deleted = await prisma.vehicles.delete({ where: { id } });

  logger.info({ event: 'VEHICLE_DELETED', id }, `Kendaraan ${id} berhasil dihapus`);

  if (userId) {
    await logActivity({
      userId,
      action: 'DELETE',
      entity: 'Vehicles',
      entityId: deleted.id,
    });
  }

  res.status(200).json({
    success: true,
    message: 'Kendaraan berhasil dihapus',
    data: deleted,
  });
});

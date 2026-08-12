import { Prisma } from '../generated/prisma/client';
import { catchAsync } from '../utils/catchAsync';
import { logger } from '../utils/logger';
import { AppError } from '../utils/AppError';
import { prisma } from '../utils/prisma';
import { logActivity } from '../services/activity-log.service';
import type { AuthRequest } from '../models/auth.model';
import type {
  CreateVehicleRateRequest,
  GetAllVehicleRateQuery,
  GetVehicleRateByIdParams,
  UpdateVehicleRateRequest,
  UpdateVehicleRateParams,
  DeleteVehicleRateParams,
} from '../models/vehicle-rate.dto';

export const createVehicleRate = catchAsync(async (req, res) => {
  const { vehicleId, durationType, withDriver, price, isActive } =
    req.body as CreateVehicleRateRequest;
  const userId = (req as AuthRequest).user?.userId;

  const vehicle = await prisma.vehicles.findUnique({ where: { id: vehicleId } });
  if (!vehicle) {
    throw new AppError('Kendaraan tidak ditemukan', 400);
  }

  const duplicate = await prisma.vehicleRates.findUnique({
    where: { vehicleId_durationType_withDriver: { vehicleId, durationType, withDriver } },
  });
  if (duplicate) {
    throw new AppError('Tarif untuk kombinasi ini sudah ada', 409);
  }

  const rate = await prisma.vehicleRates.create({
    data: { vehicleId, durationType, withDriver, price: new Prisma.Decimal(price), isActive },
  });

  logger.info(
    { event: 'VEHICLE_RATE_CREATED', id: rate.id, vehicleId, durationType, withDriver },
    `Tarif ${durationType}${withDriver ? ' dengan driver' : ''} untuk ${vehicle.name} dibuat`,
  );

  if (userId) {
    await logActivity({
      userId,
      action: 'CREATE',
      entity: 'VehicleRates',
      entityId: rate.id,
      detail: { vehicleId, durationType, withDriver, price },
    });
  }

  res.status(201).json({
    success: true,
    message: 'Tarif kendaraan berhasil dibuat',
    data: rate,
  });
});

export const getAllVehicleRates = catchAsync(async (req, res) => {
  const query = req.query as unknown as GetAllVehicleRateQuery;
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const { vehicleId, durationType, withDriver } = query;

  const where: Prisma.VehicleRatesWhereInput = {};

  if (vehicleId) {
    where.vehicleId = vehicleId;
  }

  if (durationType) {
    where.durationType = durationType;
  }

  if (withDriver) {
    where.withDriver = withDriver === 'true';
  }

  const [data, total] = await Promise.all([
    prisma.vehicleRates.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        vehicle: { select: { id: true, name: true, plateNumber: true } },
      },
    }),
    prisma.vehicleRates.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  logger.info(
    { event: 'VEHICLE_RATES_FETCHED', page, limit, total, vehicleId: vehicleId ?? null },
    'Berhasil mengambil data tarif kendaraan',
  );

  res.status(200).json({
    success: true,
    message: 'Tarif kendaraan berhasil diambil',
    data,
    pagination: { page, limit, total, totalPages },
  });
});

export const getVehicleRateById = catchAsync(async (req, res) => {
  const { id } = req.params as unknown as GetVehicleRateByIdParams;

  const rate = await prisma.vehicleRates.findUnique({
    where: { id },
    include: {
      vehicle: { select: { id: true, name: true, plateNumber: true } },
    },
  });

  if (!rate) {
    throw new AppError(`Tarif dengan ID ${id} tidak ditemukan`, 404);
  }

  logger.info({ event: 'VEHICLE_RATE_FETCHED', id }, `Tarif ${id} berhasil diambil`);

  res.status(200).json({
    success: true,
    message: 'Tarif kendaraan berhasil diambil',
    data: rate,
  });
});

export const updateVehicleRate = catchAsync(async (req, res) => {
  const { id } = req.params as unknown as UpdateVehicleRateParams;
  const { vehicleId, durationType, withDriver, price, isActive } =
    req.body as UpdateVehicleRateRequest;
  const userId = (req as AuthRequest).user?.userId;

  const existing = await prisma.vehicleRates.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(`Tarif dengan ID ${id} tidak ditemukan`, 404);
  }

  if (vehicleId) {
    const vehicle = await prisma.vehicles.findUnique({ where: { id: vehicleId } });
    if (!vehicle) {
      throw new AppError('Kendaraan tidak ditemukan', 400);
    }
  }

  if (vehicleId && durationType && withDriver !== undefined) {
    const duplicate = await prisma.vehicleRates.findFirst({
      where: { vehicleId, durationType, withDriver, id: { not: id } },
    });
    if (duplicate) {
      throw new AppError('Tarif untuk kombinasi ini sudah digunakan', 409);
    }
  }

  const updated = await prisma.vehicleRates.update({
    where: { id },
    data: {
      vehicleId,
      durationType,
      withDriver,
      price: price !== undefined ? new Prisma.Decimal(price) : undefined,
      isActive,
    },
  });

  logger.info({ event: 'VEHICLE_RATE_UPDATED', id }, `Tarif ${id} berhasil diupdate`);

  if (userId) {
    await logActivity({
      userId,
      action: 'UPDATE',
      entity: 'VehicleRates',
      entityId: updated.id,
      detail: { changes: { vehicleId, durationType, withDriver, price, isActive } },
    });
  }

  res.status(200).json({
    success: true,
    message: 'Tarif kendaraan berhasil diupdate',
    data: updated,
  });
});

export const deleteVehicleRate = catchAsync(async (req, res) => {
  const { id } = req.params as unknown as DeleteVehicleRateParams;
  const userId = (req as AuthRequest).user?.userId;

  const existing = await prisma.vehicleRates.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(`Tarif dengan ID ${id} tidak ditemukan`, 404);
  }

  const deleted = await prisma.vehicleRates.delete({ where: { id } });

  logger.info({ event: 'VEHICLE_RATE_DELETED', id }, `Tarif ${id} berhasil dihapus`);

  if (userId) {
    await logActivity({
      userId,
      action: 'DELETE',
      entity: 'VehicleRates',
      entityId: deleted.id,
    });
  }

  res.status(200).json({
    success: true,
    message: 'Tarif kendaraan berhasil dihapus',
    data: deleted,
  });
});

import { Prisma } from '../generated/prisma/client';
import { prisma } from '../utils/prisma';

// Status booking yang dianggap "memakai" kendaraan (kendaraan tidak tersedia)
const OCCUPYING_STATUSES = ['PENDING', 'CONFIRMED', 'ONGOING'] as const;

export interface AvailabilityQuery {
  startDate: Date;
  endDate: Date;
  categoryId?: string;
  search?: string;
}

/**
 * Cari semua ID kendaraan yang punya booking aktif (belum selesai/dibatalkan)
 * yang periode sewanya overlap dengan rentang tanggal yang diminta.
 */
export const getUnavailableVehicleIds = async (
  startDate: Date,
  endDate: Date,
): Promise<string[]> => {
  const bookings = await prisma.bookings.findMany({
    where: {
      status: { in: [...OCCUPYING_STATUSES] },
      startDate: { lt: endDate },
      endDate: { gt: startDate },
    },
    select: {
      items: { select: { vehicleId: true } },
    },
  });

  const ids = new Set<string>();
  for (const booking of bookings) {
    for (const item of booking.items) {
      ids.add(item.vehicleId);
    }
  }

  return [...ids];
};

const vehiclesInclude = {
  category: { select: { id: true, name: true } },
  rates: {
    where: { isActive: true },
    orderBy: { price: 'asc' },
  },
} as const;

export type AvailableVehicle = Prisma.VehiclesGetPayload<{ include: typeof vehiclesInclude }>;

/**
 * Ambil daftar kendaraan yang tersedia untuk rentang tanggal tertentu,
 * dengan filter opsional kategori dan kata kunci pencarian.
 */
export const getAvailableVehicles = async (
  query: AvailabilityQuery,
): Promise<AvailableVehicle[]> => {
  const { startDate, endDate, categoryId, search } = query;

  const unavailableIds = await getUnavailableVehicleIds(startDate, endDate);

  const where: Prisma.VehiclesWhereInput = {
    isActive: true,
    id: { notIn: unavailableIds },
  };

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { plateNumber: { contains: search, mode: 'insensitive' } },
    ];
  }

  const vehicles = await prisma.vehicles.findMany({
    where,
    include: vehiclesInclude,
  });

  return vehicles;
};

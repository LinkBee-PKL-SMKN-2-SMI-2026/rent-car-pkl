import { DurationType } from '../generated/prisma/client';
import { prisma } from '../utils/prisma';
import { AppError } from '../utils/AppError';

export interface PriceItemInput {
  vehicleId: string;
  needsDriver: boolean;
}

export interface PriceItemResult {
  vehicleId: string;
  vehicleName: string;
  durationType: DurationType;
  days: number;
  multiplier: number;
  unitPrice: number;
  subtotal: number;
  needsDriver: boolean;
}

export interface PriceResult {
  items: PriceItemResult[];
  basePrice: number;
  totalPrice: number;
}

const MS_PER_DAY = 86_400_000;

export const rentalDays = (startDate: Date, endDate: Date): number => {
  const diffMs = endDate.getTime() - startDate.getTime();
  return Math.max(1, Math.ceil(diffMs / MS_PER_DAY));
};

export const pickDurationType = (days: number): DurationType => {
  if (days >= 30) {
    return 'MONTHLY';
  }
  if (days >= 7) {
    return 'WEEKLY';
  }
  return 'DAILY';
};

export const durationMultiplier = (durationType: DurationType, days: number): number => {
  if (durationType === 'WEEKLY') {
    return Math.max(1, Math.ceil(days / 7));
  }
  if (durationType === 'MONTHLY') {
    return Math.max(1, Math.ceil(days / 30));
  }
  return days;
};

/**
 * Hitung estimasi harga sewa. Tarif dipilih berdasarkan durasi sewa:
 * - >= 30 hari  -> tarif MONTHLY
 * - >= 7 hari   -> tarif WEEKLY
 * - selainnya   -> tarif DAILY
 * Total harga selalu dihitung server-side, nilai dari client TIDAK dipercaya.
 */
export const calculatePrice = async (
  startDate: Date,
  endDate: Date,
  items: PriceItemInput[],
): Promise<PriceResult> => {
  const days = rentalDays(startDate, endDate);
  const durationType = pickDurationType(days);
  const multiplier = durationMultiplier(durationType, days);

  const vehicleIds = items.map((item) => item.vehicleId);
  const vehicles = await prisma.vehicles.findMany({
    where: { id: { in: vehicleIds }, isActive: true },
    select: { id: true, name: true },
  });

  const vehicleMap = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle]));

  const results: PriceItemResult[] = [];

  for (const item of items) {
    const vehicle = vehicleMap.get(item.vehicleId);
    if (!vehicle) {
      throw new AppError(
        `Kendaraan dengan ID ${item.vehicleId} tidak ditemukan atau nonaktif`,
        404,
      );
    }

    const rate = await prisma.vehicleRates.findUnique({
      where: {
        vehicleId_durationType_withDriver: {
          vehicleId: item.vehicleId,
          durationType,
          withDriver: item.needsDriver,
        },
      },
    });

    if (!rate || !rate.isActive) {
      const label = item.needsDriver ? 'dengan driver' : 'tanpa driver';
      throw new AppError(
        `Tarif ${durationType} ${label} untuk kendaraan ${vehicle.name} belum diatur`,
        404,
      );
    }

    const unitPrice = rate.price.toNumber();
    const subtotal = unitPrice * multiplier;

    results.push({
      vehicleId: item.vehicleId,
      vehicleName: vehicle.name,
      durationType,
      days,
      multiplier,
      unitPrice,
      subtotal,
      needsDriver: item.needsDriver,
    });
  }

  const basePrice = results.reduce((sum, item) => sum + item.subtotal, 0);

  return { items: results, basePrice, totalPrice: basePrice };
};

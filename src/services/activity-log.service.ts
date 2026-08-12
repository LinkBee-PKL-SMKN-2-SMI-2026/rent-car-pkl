import { Prisma } from '../generated/prisma/client';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

interface LogActivityParams {
  userId: string;
  action: string; // CREATE, UPDATE, DELETE, LOGIN, LOGOUT
  entity: string; // Users, Customers, VehicleCategories, Vehicles, VehicleRates, Bookings
  entityId?: string; // UUID dari data yang diubah
  detail?: Record<string, unknown>; // Data tambahan (opsional)
}

export const logActivity = async (params: LogActivityParams): Promise<void> => {
  try {
    await prisma.activity_Logs.create({
      data: {
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        detail: (params.detail as Prisma.InputJsonValue | undefined) ?? undefined,
        userId: params.userId,
      },
    });
  } catch (error) {
    // Log error ke Pino, tapi JANGAN throw error
    // Activity log tidak boleh menggagalkan operasi utama
    logger.error({ event: 'ACTIVITY_LOG_ERROR', error }, 'Gagal mencatat activity log');
  }
};

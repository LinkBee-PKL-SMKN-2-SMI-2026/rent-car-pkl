import { Prisma } from '../generated/prisma/client';
import { catchAsync } from '../utils/catchAsync';
import { logger } from '../utils/logger';
import { prisma } from '../utils/prisma';
import type { ActivityLogResponse, GetActivityLogsQuery } from '../models/activity-log.dto';

export const getActivityLogs = catchAsync(async (req, res) => {
  const query = req.query as unknown as GetActivityLogsQuery;
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const { userId, action, entity, startDate, endDate } = query;

  const where: Prisma.Activity_LogsWhereInput = {};

  if (userId) {
    where.userId = userId;
  }

  if (action) {
    where.action = action;
  }

  if (entity) {
    where.entity = entity;
  }

  if (startDate || endDate) {
    where.createdAt = {
      ...(startDate && { gte: new Date(startDate) }),
      ...(endDate && { lte: new Date(endDate) }),
    };
  }

  const [logs, total] = await Promise.all([
    prisma.activity_Logs.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.activity_Logs.count({ where }),
  ]);

  const data: ActivityLogResponse[] = logs.map((log) => ({
    id: log.id,
    action: log.action,
    entity: log.entity,
    entityId: log.entityId,
    detail: log.detail as Record<string, unknown> | null,
    userName: log.user.name,
    createdAt: log.createdAt,
  }));

  const totalPages = Math.ceil(total / limit);

  logger.info(
    {
      event: 'ACTIVITY_LOGS_FETCHED',
      page,
      limit,
      total,
      userId: userId ?? null,
      action: action ?? null,
      entity: entity ?? null,
    },
    'Activity logs berhasil diambil',
  );

  res.status(200).json({
    success: true,
    message: 'Activity logs berhasil diambil',
    data,
    pagination: { page, limit, total, totalPages },
  });
});

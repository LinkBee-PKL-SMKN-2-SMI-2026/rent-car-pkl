import { Prisma } from '../generated/prisma/client';
import { catchAsync } from '../utils/catchAsync';
import { logger } from '../utils/logger';
import { AppError } from '../utils/AppError';
import { prisma } from '../utils/prisma';
import { logActivity } from '../services/activity-log.service';
import type { AuthRequest } from '../models/auth.model';
import type {
  CreateCustomerRequest,
  GetAllCustomerQuery,
  GetCustomerByIdParams,
  UpdateCustomerRequest,
  UpdateCustomerParams,
  DeleteCustomerParams,
} from '../models/customer.dto';

export const createCustomer = catchAsync(async (req, res) => {
  const body = req.body as CreateCustomerRequest;
  const userId = (req as AuthRequest).user?.userId;

  const isExist = await prisma.customers.findUnique({ where: { phone: body.phone } });
  if (isExist) {
    throw new AppError(`Customer dengan nomor HP ${body.phone} sudah ada`, 409);
  }

  const customer = await prisma.customers.create({ data: body });

  logger.info(
    { event: 'CUSTOMER_CREATED', id: customer.id },
    `Customer ${customer.name} berhasil dibuat`,
  );

  if (userId) {
    await logActivity({
      userId,
      action: 'CREATE',
      entity: 'Customers',
      entityId: customer.id,
      detail: { name: customer.name, phone: customer.phone },
    });
  }

  res.status(201).json({
    success: true,
    message: 'Customer berhasil dibuat',
    data: customer,
  });
});

export const getAllCustomers = catchAsync(async (req, res) => {
  const query = req.query as unknown as GetAllCustomerQuery;
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const { search, sort = 'asc', isActive } = query;

  const where: Prisma.CustomersWhereInput = {};

  if (isActive) {
    where.isActive = isActive === 'true';
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
      { companyName: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.customers.findMany({
      where,
      orderBy: { name: sort },
      skip: (page - 1) * limit,
      take: limit,
      include: { _count: { select: { bookings: true } } },
    }),
    prisma.customers.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  logger.info(
    { event: 'CUSTOMERS_FETCHED', page, limit, total, search: search ?? null },
    'Berhasil mengambil data customer',
  );

  res.status(200).json({
    success: true,
    message: 'Customer berhasil diambil',
    data,
    pagination: { page, limit, total, totalPages },
  });
});

export const getCustomerById = catchAsync(async (req, res) => {
  const { id } = req.params as unknown as GetCustomerByIdParams;

  const customer = await prisma.customers.findUnique({
    where: { id },
    include: {
      bookings: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          bookingCode: true,
          status: true,
          startDate: true,
          endDate: true,
          totalPrice: true,
        },
      },
    },
  });

  if (!customer) {
    throw new AppError(`Customer dengan ID ${id} tidak ditemukan`, 404);
  }

  logger.info({ event: 'CUSTOMER_FETCHED', id }, `Customer ${id} berhasil diambil`);

  res.status(200).json({
    success: true,
    message: 'Customer berhasil diambil',
    data: customer,
  });
});

export const updateCustomer = catchAsync(async (req, res) => {
  const { id } = req.params as unknown as UpdateCustomerParams;
  const body = req.body as UpdateCustomerRequest;
  const userId = (req as AuthRequest).user?.userId;

  const existing = await prisma.customers.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(`Customer dengan ID ${id} tidak ditemukan`, 404);
  }

  if (body.phone) {
    const duplicate = await prisma.customers.findFirst({
      where: { phone: body.phone, id: { not: id } },
    });
    if (duplicate) {
      throw new AppError(`Nomor HP ${body.phone} sudah digunakan customer lain`, 409);
    }
  }

  const updated = await prisma.customers.update({ where: { id }, data: body });

  logger.info({ event: 'CUSTOMER_UPDATED', id }, `Customer ${id} berhasil diupdate`);

  if (userId) {
    await logActivity({
      userId,
      action: 'UPDATE',
      entity: 'Customers',
      entityId: updated.id,
      detail: { changes: { name: body.name, phone: body.phone } },
    });
  }

  res.status(200).json({
    success: true,
    message: 'Customer berhasil diupdate',
    data: updated,
  });
});

export const deleteCustomer = catchAsync(async (req, res) => {
  const { id } = req.params as unknown as DeleteCustomerParams;
  const userId = (req as AuthRequest).user?.userId;

  const existing = await prisma.customers.findUnique({
    where: { id },
    include: { _count: { select: { bookings: true } } },
  });
  if (!existing) {
    throw new AppError(`Customer dengan ID ${id} tidak ditemukan`, 404);
  }

  if (existing._count.bookings > 0) {
    throw new AppError('Customer tidak bisa dihapus karena memiliki riwayat booking', 400);
  }

  const deleted = await prisma.customers.delete({ where: { id } });

  logger.info({ event: 'CUSTOMER_DELETED', id }, `Customer ${id} berhasil dihapus`);

  if (userId) {
    await logActivity({
      userId,
      action: 'DELETE',
      entity: 'Customers',
      entityId: deleted.id,
    });
  }

  res.status(200).json({
    success: true,
    message: 'Customer berhasil dihapus',
    data: deleted,
  });
});

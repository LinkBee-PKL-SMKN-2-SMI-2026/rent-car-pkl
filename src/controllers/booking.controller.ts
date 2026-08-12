import { Prisma, BookingStatus } from '../generated/prisma/client';
import { catchAsync } from '../utils/catchAsync';
import { logger } from '../utils/logger';
import { AppError } from '../utils/AppError';
import { prisma } from '../utils/prisma';
import { parseDateInput } from '../utils/date';
import { logActivity } from '../services/activity-log.service';
import { calculatePrice } from '../services/pricing.service';
import { createBooking } from '../services/booking.service';
import type { AuthRequest } from '../models/auth.model';
import type {
  EstimateBookingRequest,
  CreateBookingRequest,
  GetAllBookingQuery,
  GetBookingByIdParams,
  UpdateBookingStatusRequest,
  UpdateBookingStatusParams,
  DeleteBookingParams,
} from '../models/booking.dto';

// Map transisi status yang diperbolehkan
const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['ONGOING', 'CANCELLED'],
  ONGOING: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

export const estimateBooking = catchAsync(async (req, res) => {
  const { startDate, endDate, items } = req.body as EstimateBookingRequest;

  const summary = await calculatePrice(startDate, endDate, items);

  logger.info(
    { event: 'BOOKING_ESTIMATE', items: items.length, total: summary.totalPrice },
    'Estimasi harga booking dihitung',
  );

  res.status(200).json({
    success: true,
    message: 'Estimasi harga berhasil dihitung',
    data: summary,
  });
});

export const createBookingHandler = catchAsync(async (req, res) => {
  const body = req.body as CreateBookingRequest;
  const userId = (req as AuthRequest).user?.userId;

  const result = await createBooking({
    customerId: body.customerId,
    customer: body.customer,
    items: body.items,
    startDate: body.startDate,
    endDate: body.endDate,
    pickupLocation: body.pickupLocation,
    dropoffLocation: body.dropoffLocation,
    needsFuel: body.needsFuel,
    notes: body.notes,
    createdBy: userId ?? null,
  });

  logger.info(
    {
      event: 'BOOKING_CREATED',
      bookingCode: result.booking.bookingCode,
      total: result.booking.totalPrice,
      createdBy: userId,
    },
    `Booking ${result.booking.bookingCode} berhasil dibuat`,
  );

  if (userId) {
    await logActivity({
      userId,
      action: 'CREATE',
      entity: 'Bookings',
      entityId: result.booking.id,
      detail: { bookingCode: result.booking.bookingCode, total: result.booking.totalPrice },
    });
  }

  res.status(201).json({
    success: true,
    message: 'Booking berhasil dibuat',
    data: { ...result.booking, priceSummary: result.summary },
  });
});

export const getAllBookings = catchAsync(async (req, res) => {
  const query = req.query as unknown as GetAllBookingQuery;
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const { search, sort = 'desc', status, startDate, endDate } = query;

  const where: Prisma.BookingsWhereInput = {};

  if (status) {
    where.status = status;
  }

  if (startDate || endDate) {
    where.startDate = {
      ...(startDate && { gte: parseDateInput(startDate as unknown as string, 'startDate') }),
      ...(endDate && { lte: parseDateInput(endDate as unknown as string, 'endDate') }),
    };
  }

  if (search) {
    where.OR = [
      { bookingCode: { contains: search, mode: 'insensitive' } },
      { customer: { name: { contains: search, mode: 'insensitive' } } },
      { customer: { phone: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.bookings.findMany({
      where,
      orderBy: { createdAt: sort },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        customer: {
          select: { id: true, name: true, phone: true, email: true, companyName: true },
        },
        items: {
          include: {
            vehicle: { select: { id: true, name: true, plateNumber: true } },
          },
        },
      },
    }),
    prisma.bookings.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  logger.info(
    { event: 'BOOKINGS_FETCHED', page, limit, total, status: status ?? null },
    'Berhasil mengambil data booking',
  );

  res.status(200).json({
    success: true,
    message: 'Booking berhasil diambil',
    data,
    pagination: { page, limit, total, totalPages },
  });
});

export const getBookingById = catchAsync(async (req, res) => {
  const { id } = req.params as unknown as GetBookingByIdParams;

  const booking = await prisma.bookings.findUnique({
    where: { id },
    include: {
      customer: {
        select: { id: true, name: true, phone: true, email: true, companyName: true },
      },
      createdByUser: { select: { id: true, name: true, email: true } },
      items: {
        include: {
          vehicle: {
            select: { id: true, name: true, plateNumber: true, brand: true, model: true },
          },
        },
      },
    },
  });

  if (!booking) {
    throw new AppError(`Booking dengan ID ${id} tidak ditemukan`, 404);
  }

  logger.info({ event: 'BOOKING_FETCHED', id }, `Booking ${id} berhasil diambil`);

  res.status(200).json({
    success: true,
    message: 'Booking berhasil diambil',
    data: booking,
  });
});

export const updateBookingStatus = catchAsync(async (req, res) => {
  const { id } = req.params as unknown as UpdateBookingStatusParams;
  const { status } = req.body as UpdateBookingStatusRequest;
  const userId = (req as AuthRequest).user?.userId as string;

  const booking = await prisma.bookings.findUnique({ where: { id } });
  if (!booking) {
    throw new AppError(`Booking dengan ID ${id} tidak ditemukan`, 404);
  }

  if (booking.status === status) {
    throw new AppError(`Booking sudah berstatus ${status}`, 400);
  }

  const allowed = ALLOWED_TRANSITIONS[booking.status] ?? [];
  if (!allowed.includes(status)) {
    throw new AppError(`Status ${booking.status} tidak bisa diubah menjadi ${status}`, 400);
  }

  const updated = await prisma.bookings.update({
    where: { id },
    data: { status },
    include: { items: { select: { vehicleId: true } } },
  });

  logger.info(
    { event: 'BOOKING_STATUS_UPDATED', id, from: booking.status, to: status },
    `Booking ${id} berubah dari ${booking.status} menjadi ${status}`,
  );

  await logActivity({
    userId,
    action: 'UPDATE',
    entity: 'Bookings',
    entityId: updated.id,
    detail: { bookingCode: updated.bookingCode, from: booking.status, to: status },
  });

  res.status(200).json({
    success: true,
    message: `Status booking berhasil diubah menjadi ${status}`,
    data: updated,
  });
});

export const deleteBooking = catchAsync(async (req, res) => {
  const { id } = req.params as unknown as DeleteBookingParams;
  const userId = (req as AuthRequest).user?.userId as string;

  const booking = await prisma.bookings.findUnique({ where: { id } });
  if (!booking) {
    throw new AppError(`Booking dengan ID ${id} tidak ditemukan`, 404);
  }

  if (booking.status === 'ONGOING' || booking.status === 'COMPLETED') {
    throw new AppError('Booking yang sedang/proses selesai tidak bisa dihapus', 400);
  }

  const deleted = await prisma.bookings.delete({ where: { id } });

  logger.info({ event: 'BOOKING_DELETED', id }, `Booking ${id} berhasil dihapus`);

  await logActivity({
    userId,
    action: 'DELETE',
    entity: 'Bookings',
    entityId: deleted.id,
    detail: { bookingCode: deleted.bookingCode },
  });

  res.status(200).json({
    success: true,
    message: 'Booking berhasil dihapus',
    data: deleted,
  });
});

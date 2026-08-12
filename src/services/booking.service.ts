import { Prisma, type Customers } from '../generated/prisma/client';
import { prisma } from '../utils/prisma';
import { AppError } from '../utils/AppError';
import { calculatePrice, rentalDays } from './pricing.service';
import type { PriceItemInput, PriceResult } from './pricing.service';

export interface CreateBookingInput {
  customerId?: string;
  customer?: {
    name: string;
    phone: string;
    email?: string;
    address?: string;
    companyName?: string;
  };
  items: PriceItemInput[];
  startDate: Date;
  endDate: Date;
  pickupLocation?: string;
  dropoffLocation?: string;
  needsFuel: boolean;
  notes?: string;
  createdBy: string | null | undefined;
}

const bookingInclude = {
  customer: {
    select: { id: true, name: true, phone: true, email: true, companyName: true },
  },
  items: {
    include: {
      vehicle: { select: { id: true, name: true, plateNumber: true } },
    },
  },
} as const;

export type CreatedBooking = Prisma.BookingsGetPayload<{ include: typeof bookingInclude }>;

export interface CreateBookingResult {
  booking: CreatedBooking;
  summary: PriceResult;
  days: number;
}

const BOOKING_CODE_PREFIX = 'RC';

export const generateBookingCode = (): string => {
  const datePart = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${BOOKING_CODE_PREFIX}-${datePart}-${randomPart}`;
};

/**
 * Cari customer berdasarkan nomor HP, atau buat baru jika belum ada.
 * Mendukung booking walk-in / via WhatsApp tanpa akun.
 */
export const findOrCreateCustomer = async (
  input: CreateBookingInput['customer'],
  customerId?: string,
): Promise<Customers> => {
  if (customerId) {
    const existing = await prisma.customers.findUnique({ where: { id: customerId } });
    if (!existing) {
      throw new AppError(`Customer dengan ID ${customerId} tidak ditemukan`, 404);
    }
    return existing;
  }

  if (!input) {
    throw new AppError('Data customer wajib diisi', 400);
  }

  const existing = await prisma.customers.findUnique({ where: { phone: input.phone } });
  if (existing) {
    return existing;
  }

  return prisma.customers.create({
    data: {
      name: input.name,
      phone: input.phone,
      email: input.email,
      address: input.address,
      companyName: input.companyName,
    },
  });
};

/**
 * Buat booking baru beserta line-item armadanya.
 * Harga dihitung ulang server-side lewat pricing service.
 */
export const createBooking = async (input: CreateBookingInput): Promise<CreateBookingResult> => {
  const { startDate, endDate, items, needsFuel, notes, createdBy } = input;

  const customer = await findOrCreateCustomer(input.customer, input.customerId);

  const price = await calculatePrice(startDate, endDate, items);

  const bookingCode = await (async (): Promise<string> => {
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateBookingCode();
      const existing = await prisma.bookings.findUnique({ where: { bookingCode: code } });
      if (!existing) {
        return code;
      }
    }
    throw new AppError('Gagal membuat kode booking, coba lagi', 500);
  })();

  const booking = await prisma.bookings.create({
    data: {
      bookingCode,
      customerId: customer.id,
      createdBy: createdBy ?? null,
      status: 'PENDING',
      startDate,
      endDate,
      pickupLocation: input.pickupLocation,
      dropoffLocation: input.dropoffLocation,
      needsDriver: items.some((item) => item.needsDriver),
      needsFuel,
      basePrice: new Prisma.Decimal(price.basePrice),
      totalPrice: new Prisma.Decimal(price.totalPrice),
      notes,
      items: {
        create: price.items.map((item) => ({
          vehicleId: item.vehicleId,
          durationType: item.durationType,
          days: item.days,
          unitPrice: new Prisma.Decimal(item.unitPrice),
          subtotal: new Prisma.Decimal(item.subtotal),
        })),
      },
    },
    include: bookingInclude,
  });

  return {
    booking: booking as CreatedBooking,
    summary: price,
    days: rentalDays(startDate, endDate),
  };
};

import z from 'zod';

const CustomerInputSchema = z.object({
  name: z.string({ error: 'Nama wajib diisi' }).min(2, 'Nama minimal 2 karakter'),
  phone: z.string({ error: 'Nomor HP wajib diisi' }).min(8, 'Nomor HP minimal 8 karakter'),
  email: z.string().email('Format email tidak valid').optional(),
  address: z.string().optional(),
  companyName: z.string().optional(),
});

const BookingItemInputSchema = z.object({
  vehicleId: z.uuid({ error: 'Vehicle ID harus UUID valid' }),
  needsDriver: z.coerce.boolean().default(false),
});

export const EstimateBookingSchema = z.object({
  body: z
    .object({
      items: z.array(BookingItemInputSchema).min(1, 'Minimal satu kendaraan'),
      startDate: z.coerce.date({ error: 'Tanggal mulai wajib diisi' }),
      endDate: z.coerce.date({ error: 'Tanggal selesai wajib diisi' }),
    })
    .refine((data) => data.endDate > data.startDate, {
      message: 'Tanggal selesai harus setelah tanggal mulai',
    }),
});

export const CreateBookingSchema = z.object({
  body: z
    .object({
      customerId: z.uuid().optional(),
      customer: CustomerInputSchema.optional(),
      items: z.array(BookingItemInputSchema).min(1, 'Minimal satu kendaraan'),
      startDate: z.coerce.date({ error: 'Tanggal mulai wajib diisi' }),
      endDate: z.coerce.date({ error: 'Tanggal selesai wajib diisi' }),
      pickupLocation: z.string().optional(),
      dropoffLocation: z.string().optional(),
      needsFuel: z.coerce.boolean().default(false),
      notes: z.string().optional(),
    })
    .refine((data) => data.customerId || data.customer, {
      message: 'customerId atau data customer wajib diisi',
    })
    .refine((data) => data.endDate > data.startDate, {
      message: 'Tanggal selesai harus setelah tanggal mulai',
    }),
});

export const GetAllBookingSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    search: z.string().optional(),
    sort: z.enum(['asc', 'desc']).default('desc'),
    status: z.enum(['PENDING', 'CONFIRMED', 'ONGOING', 'COMPLETED', 'CANCELLED']).optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  }),
});

export const GetBookingByIdSchema = z.object({
  params: z.object({
    id: z.uuid({ error: 'ID harus berupa UUID yang valid' }),
  }),
});

export const UpdateBookingStatusSchema = z.object({
  params: z.object({
    id: z.uuid({ error: 'ID harus berupa UUID yang valid' }),
  }),
  body: z.object({
    status: z.enum(['PENDING', 'CONFIRMED', 'ONGOING', 'COMPLETED', 'CANCELLED'], {
      error: 'Status tidak valid',
    }),
  }),
});

export const DeleteBookingSchema = z.object({
  params: z.object({
    id: z.uuid({ error: 'ID harus berupa UUID yang valid' }),
  }),
});

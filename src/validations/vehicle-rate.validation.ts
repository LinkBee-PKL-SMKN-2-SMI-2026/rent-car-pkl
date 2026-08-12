import z from 'zod';

export const CreateVehicleRateSchema = z.object({
  body: z.object({
    vehicleId: z.uuid({ error: 'Vehicle ID harus UUID valid' }),
    durationType: z.enum(['DAILY', 'WEEKLY', 'MONTHLY'], { error: 'Tipe durasi tidak valid' }),
    withDriver: z.coerce.boolean().default(false),
    price: z.number({ error: 'Harga wajib diisi' }).positive('Harga harus lebih dari 0'),
    isActive: z.coerce.boolean().optional(),
  }),
});

export const GetAllVehicleRateSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    vehicleId: z.uuid().optional(),
    durationType: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']).optional(),
    withDriver: z.enum(['true', 'false']).optional(),
  }),
});

export const GetVehicleRateByIdSchema = z.object({
  params: z.object({
    id: z.uuid({ error: 'ID harus berupa UUID yang valid' }),
  }),
});

export const UpdateVehicleRateSchema = z.object({
  params: z.object({
    id: z.uuid({ error: 'ID harus berupa UUID yang valid' }),
  }),
  body: z.object({
    vehicleId: z.uuid({ error: 'Vehicle ID harus UUID valid' }).optional(),
    durationType: z
      .enum(['DAILY', 'WEEKLY', 'MONTHLY'], { error: 'Tipe durasi tidak valid' })
      .optional(),
    withDriver: z.coerce.boolean().optional(),
    price: z.number({ error: 'Harga wajib diisi' }).positive('Harga harus lebih dari 0').optional(),
    isActive: z.coerce.boolean().optional(),
  }),
});

export const DeleteVehicleRateSchema = z.object({
  params: z.object({
    id: z.uuid({ error: 'ID harus berupa UUID yang valid' }),
  }),
});

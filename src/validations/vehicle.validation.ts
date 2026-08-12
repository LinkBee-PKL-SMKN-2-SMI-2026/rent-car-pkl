import z from 'zod';
import { nullableOptional } from './helpers';

export const CreateVehicleSchema = z.object({
  body: z.object({
    name: z.string({ error: 'Nama wajib diisi' }).min(2, 'Nama minimal 2 karakter'),
    brand: z.string().optional(),
    model: z.string().optional(),
    year: z.number().int().min(1980).max(2100).optional(),
    plateNumber: z
      .string({ error: 'Nomor plat wajib diisi' })
      .min(1, 'Nomor plat tidak boleh kosong'),
    categoryId: z.uuid({ error: 'Category ID harus UUID valid' }),
    transmission: z.enum(['MANUAL', 'AUTOMATIC']).default('AUTOMATIC'),
    fuelType: z.string().optional(),
    seatingCapacity: z.number().int().min(1).max(100).optional(),
    imageUrl: z.string().url().optional(),
  }),
});

export const GetAllVehicleSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    search: z.string().optional(),
    sort: z.enum(['asc', 'desc']).default('asc'),
    categoryId: z.uuid().optional(),
    transmission: z.enum(['MANUAL', 'AUTOMATIC']).optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  }),
});

export const GetVehicleByIdSchema = z.object({
  params: z.object({
    id: z.uuid({ error: 'ID harus berupa UUID yang valid' }),
  }),
});

export const GetAvailableVehiclesSchema = z.object({
  query: z.object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    categoryId: z.uuid().optional(),
    search: z.string().optional(),
  }),
});

export const UpdateVehicleSchema = z.object({
  params: z.object({
    id: z.uuid({ error: 'ID harus berupa UUID yang valid' }),
  }),
  body: z.object({
    name: z.string({ error: 'Nama wajib diisi' }).min(2, 'Nama minimal 2 karakter').optional(),
    brand: nullableOptional(z.string()),
    model: nullableOptional(z.string()),
    year: nullableOptional(z.number().int().min(1980).max(2100)),
    plateNumber: z
      .string({ error: 'Nomor plat wajib diisi' })
      .min(1, 'Nomor plat tidak boleh kosong')
      .optional(),
    categoryId: z.uuid({ error: 'Category ID harus UUID valid' }).optional(),
    transmission: z.enum(['MANUAL', 'AUTOMATIC']).optional(),
    fuelType: nullableOptional(z.string()),
    seatingCapacity: nullableOptional(z.number().int().min(1).max(100)),
    imageUrl: nullableOptional(z.string().url()),
    isActive: z.coerce.boolean().optional(),
  }),
});

export const DeleteVehicleSchema = z.object({
  params: z.object({
    id: z.uuid({ error: 'ID harus berupa UUID yang valid' }),
  }),
});

import z from 'zod';
import { nullableOptional } from './helpers';

export const CreateVehicleCategorySchema = z.object({
  body: z.object({
    name: z.string({ error: 'Nama wajib diisi' }).min(3, 'Nama minimal 3 karakter'),
    description: z.string().optional(),
  }),
});

export const GetAllVehicleCategorySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    search: z.string().optional(),
    sort: z.enum(['asc', 'desc']).default('asc'),
    isActive: z.enum(['true', 'false']).optional(),
  }),
});

export const GetVehicleCategoryByIdSchema = z.object({
  params: z.object({
    id: z.uuid({ error: 'ID harus berupa UUID yang valid' }),
  }),
});

export const UpdateVehicleCategorySchema = z.object({
  params: z.object({
    id: z.uuid({ error: 'ID harus berupa UUID yang valid' }),
  }),
  body: z.object({
    name: z.string({ error: 'Nama wajib diisi' }).min(3, 'Nama minimal 3 karakter').optional(),
    description: nullableOptional(z.string()),
    isActive: z.coerce.boolean().optional(),
  }),
});

export const DeleteVehicleCategorySchema = z.object({
  params: z.object({
    id: z.uuid({ error: 'ID harus berupa UUID yang valid' }),
  }),
});

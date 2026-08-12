import z from 'zod';
import { nullableOptional } from './helpers';

export const CreateCustomerSchema = z.object({
  body: z.object({
    name: z.string({ error: 'Nama wajib diisi' }).min(2, 'Nama minimal 2 karakter'),
    phone: z.string({ error: 'Nomor HP wajib diisi' }).min(8, 'Nomor HP minimal 8 karakter'),
    email: z.string().email('Format email tidak valid').optional(),
    address: z.string().optional(),
    companyName: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const GetAllCustomerSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    search: z.string().optional(),
    sort: z.enum(['asc', 'desc']).default('asc'),
    isActive: z.enum(['true', 'false']).optional(),
  }),
});

export const GetCustomerByIdSchema = z.object({
  params: z.object({
    id: z.uuid({ error: 'ID harus berupa UUID yang valid' }),
  }),
});

export const UpdateCustomerSchema = z.object({
  params: z.object({
    id: z.uuid({ error: 'ID harus berupa UUID yang valid' }),
  }),
  body: z.object({
    name: z.string({ error: 'Nama wajib diisi' }).min(2, 'Nama minimal 2 karakter').optional(),
    phone: z
      .string({ error: 'Nomor HP wajib diisi' })
      .min(8, 'Nomor HP minimal 8 karakter')
      .optional(),
    email: nullableOptional(z.string().email('Format email tidak valid')),
    address: nullableOptional(z.string()),
    companyName: nullableOptional(z.string()),
    notes: nullableOptional(z.string()),
    isActive: z.coerce.boolean().optional(),
  }),
});

export const DeleteCustomerSchema = z.object({
  params: z.object({
    id: z.uuid({ error: 'ID harus berupa UUID yang valid' }),
  }),
});

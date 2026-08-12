import z from 'zod';

export const RegisterSchema = z.object({
  body: z.object({
    name: z.string({ error: 'Nama wajib diisi' }).min(3, 'Nama minimal 3 karakter'),
    email: z.string({ error: 'Email wajib diisi' }).email('Format email tidak valid'),
    password: z.string({ error: 'Password wajib diisi' }).min(6, 'Password minimal 6 karakter'),
  }),
});

export const LoginSchema = z.object({
  body: z.object({
    email: z.string({ error: 'Email wajib diisi' }).email('Format email tidak valid'),
    password: z.string({ error: 'Password wajib diisi' }).min(1, 'Password wajib diisi'),
  }),
});

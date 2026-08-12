import z from 'zod';

// Helper untuk field update opsional yang bisa dikosongkan (PATCH):
// - Tidak dikirim (undefined) = biarkan value tetap
// - "" atau null = kosongkan value (disimpan sebagai null)
export const nullableOptional = <T extends z.ZodTypeAny>(
  schema: T,
): z.ZodPreprocess<z.ZodOptional<z.ZodNullable<T>>> =>
  z.preprocess((value) => (value === '' ? null : value), schema.nullable().optional());

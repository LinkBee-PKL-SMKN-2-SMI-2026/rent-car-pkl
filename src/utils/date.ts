import { AppError } from './AppError';

/**
 * Konversi nilai tanggal (string / Date) menjadi Date.
 * Karena req.query di Express 5 selalu berupa string mentah,
 * helper ini dipakai di controller untuk hasil validasi zod.
 */
export const parseDateInput = (value: string | Date, field: string): Date => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new AppError(`Format ${field} tidak valid`, 400);
  }
  return parsed;
};

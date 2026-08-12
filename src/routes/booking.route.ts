import { Router } from 'express';
import {
  EstimateBookingSchema,
  CreateBookingSchema,
  GetAllBookingSchema,
  GetBookingByIdSchema,
  UpdateBookingStatusSchema,
  DeleteBookingSchema,
} from '../validations/booking.validation';
import {
  estimateBooking,
  createBookingHandler,
  getAllBookings,
  getBookingById,
  updateBookingStatus,
  deleteBooking,
} from '../controllers/booking.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/authenticate.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import { AppError } from '../utils/AppError';

const router = Router();

// Endpoint publik: kalkulator harga + create booking (via WhatsApp)
router.post('/estimate', validate(EstimateBookingSchema), estimateBooking);
router.post('/', validate(CreateBookingSchema), createBookingHandler);

// Endpoint manajemen
router.get('/', authenticate, validate(GetAllBookingSchema), getAllBookings);
router.get('/:id', authenticate, validate(GetBookingByIdSchema), getBookingById);
router.patch(
  '/:id/status',
  authenticate,
  authorize('ADMIN', 'STAFF'),
  validate(UpdateBookingStatusSchema),
  updateBookingStatus,
);
router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN', 'STAFF'),
  validate(DeleteBookingSchema),
  deleteBooking,
);

router.all('/*path', (req, res, next) => {
  next(new AppError(`Method ${req.method} tidak diizinkan di endpoint ini`, 405));
});

export default router;

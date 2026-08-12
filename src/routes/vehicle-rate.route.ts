import { Router } from 'express';
import {
  CreateVehicleRateSchema,
  GetAllVehicleRateSchema,
  GetVehicleRateByIdSchema,
  UpdateVehicleRateSchema,
  DeleteVehicleRateSchema,
} from '../validations/vehicle-rate.validation';
import {
  createVehicleRate,
  getAllVehicleRates,
  getVehicleRateById,
  updateVehicleRate,
  deleteVehicleRate,
} from '../controllers/vehicle-rate.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/authenticate.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import { AppError } from '../utils/AppError';

const router = Router();

router.get('/', authenticate, validate(GetAllVehicleRateSchema), getAllVehicleRates);
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  validate(CreateVehicleRateSchema),
  createVehicleRate,
);
router.get('/:id', authenticate, validate(GetVehicleRateByIdSchema), getVehicleRateById);
router.patch(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate(UpdateVehicleRateSchema),
  updateVehicleRate,
);
router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate(DeleteVehicleRateSchema),
  deleteVehicleRate,
);

router.all('/*path', (req, res, next) => {
  next(new AppError(`Method ${req.method} tidak diizinkan di endpoint ini`, 405));
});

export default router;

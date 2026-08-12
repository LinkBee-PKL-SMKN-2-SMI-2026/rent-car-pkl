import { Router } from 'express';
import {
  CreateVehicleSchema,
  GetAllVehicleSchema,
  GetVehicleByIdSchema,
  UpdateVehicleSchema,
  DeleteVehicleSchema,
  GetAvailableVehiclesSchema,
} from '../validations/vehicle.validation';
import {
  createVehicle,
  getAllVehicles,
  getVehicleById,
  getVehicleRates,
  getAvailableVehiclesHandler,
  updateVehicle,
  deleteVehicle,
} from '../controllers/vehicle.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/authenticate.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import { AppError } from '../utils/AppError';

const router = Router();

// Endpoint publik: katalog armada
router.get('/available', validate(GetAvailableVehiclesSchema), getAvailableVehiclesHandler);
router.get('/', validate(GetAllVehicleSchema), getAllVehicles);
router.get('/:id/rates', validate(GetVehicleByIdSchema), getVehicleRates);
router.get('/:id', validate(GetVehicleByIdSchema), getVehicleById);

// Endpoint manajemen (khusus admin)
router.post('/', authenticate, authorize('ADMIN'), validate(CreateVehicleSchema), createVehicle);
router.patch(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate(UpdateVehicleSchema),
  updateVehicle,
);
router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate(DeleteVehicleSchema),
  deleteVehicle,
);

router.all('/*path', (req, res, next) => {
  next(new AppError(`Method ${req.method} tidak diizinkan di endpoint ini`, 405));
});

export default router;

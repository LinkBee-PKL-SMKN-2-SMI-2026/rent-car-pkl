import { Router } from 'express';
import {
  CreateVehicleCategorySchema,
  GetAllVehicleCategorySchema,
  GetVehicleCategoryByIdSchema,
  UpdateVehicleCategorySchema,
  DeleteVehicleCategorySchema,
} from '../validations/vehicle-category.validation';
import {
  createVehicleCategory,
  getAllVehicleCategories,
  getVehicleCategoryById,
  updateVehicleCategory,
  deleteVehicleCategory,
} from '../controllers/vehicle-category.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/authenticate.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import { AppError } from '../utils/AppError';

const router = Router();

router.get('/', validate(GetAllVehicleCategorySchema), getAllVehicleCategories);
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  validate(CreateVehicleCategorySchema),
  createVehicleCategory,
);
router.get('/:id', validate(GetVehicleCategoryByIdSchema), getVehicleCategoryById);
router.patch(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate(UpdateVehicleCategorySchema),
  updateVehicleCategory,
);
router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate(DeleteVehicleCategorySchema),
  deleteVehicleCategory,
);

router.all('/*path', (req, res, next) => {
  next(new AppError(`Method ${req.method} tidak diizinkan di endpoint ini`, 405));
});

export default router;

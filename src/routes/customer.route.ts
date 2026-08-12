import { Router } from 'express';
import {
  CreateCustomerSchema,
  GetAllCustomerSchema,
  GetCustomerByIdSchema,
  UpdateCustomerSchema,
  DeleteCustomerSchema,
} from '../validations/customer.validation';
import {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} from '../controllers/customer.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/authenticate.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import { AppError } from '../utils/AppError';

const router = Router();

router.get('/', authenticate, validate(GetAllCustomerSchema), getAllCustomers);
router.post('/', authenticate, authorize('ADMIN'), validate(CreateCustomerSchema), createCustomer);
router.get('/:id', authenticate, validate(GetCustomerByIdSchema), getCustomerById);
router.patch(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate(UpdateCustomerSchema),
  updateCustomer,
);
router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate(DeleteCustomerSchema),
  deleteCustomer,
);

router.all('/*path', (req, res, next) => {
  next(new AppError(`Method ${req.method} tidak diizinkan di endpoint ini`, 405));
});

export default router;

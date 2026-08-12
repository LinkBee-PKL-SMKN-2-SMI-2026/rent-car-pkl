import { Router } from 'express';
import { validate } from '../middlewares/validate.middleware';
import { GetActivityLogsSchema } from '../validations/activity-log.validation';
import { getActivityLogs } from '../controllers/activity-log.controller';
import { authenticate } from '../middlewares/authenticate.middleware';
import { AppError } from '../utils/AppError';

const router = Router();

router.get('/', authenticate, validate(GetActivityLogsSchema), getActivityLogs);

router.all('/*path', (req, res, next) => {
  next(new AppError(`Method ${req.method} tidak diizinkan di endpoint ini`, 405));
});

export default router;

import { Router } from 'express';
import auth from './auth.route';
import customer from './customer.route';
import vehicleCategory from './vehicle-category.route';
import vehicle from './vehicle.route';
import vehicleRate from './vehicle-rate.route';
import booking from './booking.route';
import activityLog from './activity-log.route';

const router = Router();

router.use('/auth', auth);
router.use('/customers', customer);
router.use('/vehicle-categories', vehicleCategory);
router.use('/vehicles', vehicle);
router.use('/vehicle-rates', vehicleRate);
router.use('/bookings', booking);
router.use('/activity-logs', activityLog);

export default router;

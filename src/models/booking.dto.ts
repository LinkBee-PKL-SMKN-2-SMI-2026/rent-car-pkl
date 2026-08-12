import { z } from 'zod';
import {
  EstimateBookingSchema,
  CreateBookingSchema,
  GetAllBookingSchema,
  GetBookingByIdSchema,
  UpdateBookingStatusSchema,
  DeleteBookingSchema,
} from '../validations/booking.validation';

export type EstimateBookingRequest = z.infer<typeof EstimateBookingSchema>['body'];

export type CreateBookingRequest = z.infer<typeof CreateBookingSchema>['body'];

export type GetAllBookingQuery = z.infer<typeof GetAllBookingSchema>['query'];

export type GetBookingByIdParams = z.infer<typeof GetBookingByIdSchema>['params'];

export type UpdateBookingStatusRequest = z.infer<typeof UpdateBookingStatusSchema>['body'];
export type UpdateBookingStatusParams = z.infer<typeof UpdateBookingStatusSchema>['params'];

export type DeleteBookingParams = z.infer<typeof DeleteBookingSchema>['params'];

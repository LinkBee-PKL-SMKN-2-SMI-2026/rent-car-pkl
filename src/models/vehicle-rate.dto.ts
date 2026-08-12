import { z } from 'zod';
import {
  CreateVehicleRateSchema,
  GetAllVehicleRateSchema,
  GetVehicleRateByIdSchema,
  UpdateVehicleRateSchema,
  DeleteVehicleRateSchema,
} from '../validations/vehicle-rate.validation';

export type CreateVehicleRateRequest = z.infer<typeof CreateVehicleRateSchema>['body'];

export type GetAllVehicleRateQuery = z.infer<typeof GetAllVehicleRateSchema>['query'];

export type GetVehicleRateByIdParams = z.infer<typeof GetVehicleRateByIdSchema>['params'];

export type UpdateVehicleRateRequest = z.infer<typeof UpdateVehicleRateSchema>['body'];
export type UpdateVehicleRateParams = z.infer<typeof UpdateVehicleRateSchema>['params'];

export type DeleteVehicleRateParams = z.infer<typeof DeleteVehicleRateSchema>['params'];

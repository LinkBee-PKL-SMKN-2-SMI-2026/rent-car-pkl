import { z } from 'zod';
import {
  CreateVehicleSchema,
  GetAllVehicleSchema,
  GetVehicleByIdSchema,
  UpdateVehicleSchema,
  DeleteVehicleSchema,
  GetAvailableVehiclesSchema,
} from '../validations/vehicle.validation';

export type CreateVehicleRequest = z.infer<typeof CreateVehicleSchema>['body'];

export type GetAllVehicleQuery = z.infer<typeof GetAllVehicleSchema>['query'];

export type GetVehicleByIdParams = z.infer<typeof GetVehicleByIdSchema>['params'];

export type UpdateVehicleRequest = z.infer<typeof UpdateVehicleSchema>['body'];
export type UpdateVehicleParams = z.infer<typeof UpdateVehicleSchema>['params'];

export type DeleteVehicleParams = z.infer<typeof DeleteVehicleSchema>['params'];

export type GetAvailableVehiclesQuery = z.infer<typeof GetAvailableVehiclesSchema>['query'];

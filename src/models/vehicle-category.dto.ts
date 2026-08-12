import { z } from 'zod';
import {
  CreateVehicleCategorySchema,
  GetAllVehicleCategorySchema,
  GetVehicleCategoryByIdSchema,
  UpdateVehicleCategorySchema,
  DeleteVehicleCategorySchema,
} from '../validations/vehicle-category.validation';

export type CreateVehicleCategoryRequest = z.infer<typeof CreateVehicleCategorySchema>['body'];

export type GetAllVehicleCategoryQuery = z.infer<typeof GetAllVehicleCategorySchema>['query'];

export type GetVehicleCategoryByIdParams = z.infer<typeof GetVehicleCategoryByIdSchema>['params'];

export type UpdateVehicleCategoryRequest = z.infer<typeof UpdateVehicleCategorySchema>['body'];
export type UpdateVehicleCategoryParams = z.infer<typeof UpdateVehicleCategorySchema>['params'];

export type DeleteVehicleCategoryParams = z.infer<typeof DeleteVehicleCategorySchema>['params'];

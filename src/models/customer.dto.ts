import { z } from 'zod';
import {
  CreateCustomerSchema,
  GetAllCustomerSchema,
  GetCustomerByIdSchema,
  UpdateCustomerSchema,
  DeleteCustomerSchema,
} from '../validations/customer.validation';

export type CreateCustomerRequest = z.infer<typeof CreateCustomerSchema>['body'];

export type GetAllCustomerQuery = z.infer<typeof GetAllCustomerSchema>['query'];

export type GetCustomerByIdParams = z.infer<typeof GetCustomerByIdSchema>['params'];

export type UpdateCustomerRequest = z.infer<typeof UpdateCustomerSchema>['body'];
export type UpdateCustomerParams = z.infer<typeof UpdateCustomerSchema>['params'];

export type DeleteCustomerParams = z.infer<typeof DeleteCustomerSchema>['params'];

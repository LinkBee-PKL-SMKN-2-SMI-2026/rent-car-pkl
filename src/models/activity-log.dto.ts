import { z } from 'zod';
import { GetActivityLogsSchema } from '../validations/activity-log.validation';

export type GetActivityLogsQuery = z.infer<typeof GetActivityLogsSchema>['query'];

export interface ActivityLogResponse {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  detail: Record<string, unknown> | null;
  userName: string;
  createdAt: Date;
}

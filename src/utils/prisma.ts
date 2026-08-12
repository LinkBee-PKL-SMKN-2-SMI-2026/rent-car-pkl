import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { buildReachablePgConfig } from './neonConnection';

const adapter = new PrismaPg(await buildReachablePgConfig(process.env.DATABASE_URL!));

export const prisma = new PrismaClient({ adapter });

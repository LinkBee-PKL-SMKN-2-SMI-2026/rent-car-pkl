import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
  family: 4,
  connectionTimeoutMillis: 15000,
});

export const prisma = new PrismaClient({ adapter });

import { PrismaClient } from '@prisma/client';

const globalClient = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma = globalClient.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalClient.prisma = prisma;
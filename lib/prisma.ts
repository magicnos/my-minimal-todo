import { PrismaClient } from '@prisma/client';

/**
 * データベースの「窓口」を作るプログラムです。
 */

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    // 最新バージョンでは、ここに接続先を渡す必要があります
    datasourceUrl: process.env.POSTGRES_PRISMA_URL,
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;

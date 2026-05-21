import { PrismaClient } from '@prisma/client';

/**
 * データベースの「窓口」を作るプログラムです。
 */

const globalForPrisma = global;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    // 変数名を統一します
    datasourceUrl: process.env.PRISMA_DATABASE_URL,
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;

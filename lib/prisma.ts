import { PrismaClient } from '@prisma/client';

/**
 * データベース（Prisma）の「窓口」を作るプログラムです。
 * アプリの中で、この窓口（prisma インスタンス）を通じてデータの保存や読み込みを行います。
 */

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// アプリが動いている間、窓口が何個もできないように工夫しています。
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;

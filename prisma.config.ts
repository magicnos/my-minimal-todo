import { defineConfig } from 'prisma'

/**
 * データベースの接続設定を行うファイルです。
 * Vercel Postgres に接続するためのURLを指定します。
 */
export default defineConfig({
  datasource: {
    url: process.env.POSTGRES_PRISMA_URL
  }
})

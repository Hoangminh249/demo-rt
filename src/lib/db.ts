// Postgres của Rooty (Prisma 7 + driver pg). Chỉ server. Schema: prisma/schema.prisma.
import 'server-only'
import type { PrismaClient } from '@/generated/prisma/client'
import { newPrisma } from './pg'

const g = globalThis as typeof globalThis & { __prisma?: PrismaClient }

/**
 * Prisma client tạo ở lần gọi đầu, không ở top-level: import file này không cần DATABASE_URL.
 * Không truy vấn lúc `next build` (trang tĩnh dựng lúc build thì hiện "chưa có giá", ISR làm mới sau).
 */
export function db(): PrismaClient {
  const url = process.env.DATABASE_URL
  if (!url || process.env.NEXT_PHASE === 'phase-production-build') throw new Error('DB_UNAVAILABLE')
  return (g.__prisma ??= newPrisma(url))
}

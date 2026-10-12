// Kết nối Postgres cho Prisma — MỘT chỗ cho app, seed và script.
// Phiên đặt TimeZone=UTC: Prisma lưu DateTime dạng UTC không kèm múi giờ; SQL tay dùng now() phải ghi cùng kiểu đó.
// Không đặt thì now() ghi theo múi giờ máy chủ Postgres (máy dev Windows: Asia/Bangkok, +7) → hai kiểu giờ lẫn nhau.
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma/client'

export const newPrisma = (connectionString: string, max = 5) =>
  new PrismaClient({ adapter: new PrismaPg({ connectionString, max, options: '-c TimeZone=UTC' }) })

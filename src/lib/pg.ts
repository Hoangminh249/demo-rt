// Kết nối Postgres cho Prisma — MỘT chỗ cho app, seed và script.
// Phiên đặt TimeZone=UTC: Prisma lưu DateTime dạng UTC không kèm múi giờ; SQL tay dùng now() phải ghi cùng kiểu đó.
// Không đặt thì now() ghi theo múi giờ máy chủ Postgres (máy dev Windows: Asia/Bangkok, +7) → hai kiểu giờ lẫn nhau.
// Schema: `?schema=hospitality` trên DATABASE_URL (quy ước của Prisma, migrate cũng đọc tham số này). Database prod dùng chung
// với dự án khác (crm_pl30) nên bảng của web nằm trong schema riêng. Câu Prisma sinh ra ghi rõ schema (adapter `schema`);
// SQL tay ($queryRaw) viết tên bảng trần nên phiên đặt thêm search_path. Không có tham số → public (máy dev).
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma/client'

/** Tên schema trong URL (mặc định public). Chỉ nhận tên đơn giản vì nó đi vào tham số khởi động phiên. */
export function schemaOf(connectionString: string) {
  const s = new URL(connectionString).searchParams.get('schema') ?? 'public'
  if (!/^[a-z_][a-z0-9_]{0,62}$/.test(s)) throw new Error(`Tên schema không hợp lệ trong DATABASE_URL: ${s}`)
  return s
}

export const newPrisma = (connectionString: string, max = 5) => {
  const schema = schemaOf(connectionString)
  return new PrismaClient({ adapter: new PrismaPg({ connectionString, max, options: `-c TimeZone=UTC -c search_path=${schema}` }, { schema }) })
}

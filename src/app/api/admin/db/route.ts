// POST /api/admin/db — mọi lệnh ghi của admin vào Postgres: giá/tồn/gói/chính sách (src/lib/admin-commands.ts → pricingApi)
// và sản phẩm (src/lib/catalog-commands.ts → catalogAdminApi). Chỉ ADMIN.
// Kiểm quyền (lớp 2 sau src/proxy.ts) → chỉ nhận JSON → zod → transaction + AuditLog (người thao tác) → làm mới cache web.
import { revalidatePath } from 'next/cache'
import { NextResponse, type NextRequest } from 'next/server'
import { catalogApi } from '@/api/catalog'
import { catalogAdminApi } from '@/api/catalog-admin'
import { AdminError, pricingApi } from '@/api/pricing'
import { adminActor } from '@/lib/admin-actor'
import { Command, type ParsedCommand } from '@/lib/admin-commands'
import { withActor } from '@/lib/audit'
import { CatalogCommand, type ParsedCatalogCommand } from '@/lib/catalog-commands'
import { dbFail } from '../_lib'

const CATALOG_OPS = /^(hotel|roomType|room|amenity|hotelAmenity|media|promotion|taxFee)\./

export async function POST(req: NextRequest) {
  const actor = await adminActor()
  if (!actor) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  if (actor.role !== 'ADMIN') return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  // Chỉ JSON: form của trang khác không gửi được Content-Type này nếu không qua preflight CORS (thêm một lớp chống CSRF ngoài sameSite=lax).
  if (!req.headers.get('content-type')?.startsWith('application/json')) return NextResponse.json({ error: 'BAD_REQUEST' }, { status: 415 })
  const body = await req.json().catch(() => null)
  const catalog = typeof body?.op === 'string' && CATALOG_OPS.test(body.op)
  const parsed = catalog ? CatalogCommand.safeParse(body) : Command.safeParse(body)
  if (!parsed.success) {
    const i = parsed.error.issues[0]
    return NextResponse.json({ error: 'BAD_REQUEST', message: i ? `${i.path.join('.') || 'Dữ liệu'}: ${i.message}` : 'Dữ liệu không hợp lệ.' }, { status: 400 })
  }
  try {
    const message = await withActor(actor.userId, () =>
      catalog ? catalogAdminApi.write(parsed.data as ParsedCatalogCommand) : pricingApi.run(parsed.data as ParsedCommand))
    // Web thấy ngay: nội dung (tag 'catalog') + mọi trang site ("Giá từ" trên trang tĩnh).
    catalogApi.revalidate()
    revalidatePath('/[locale]', 'layout')
    return NextResponse.json({ ok: true, message }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    if (e instanceof AdminError) return NextResponse.json({ error: 'REJECTED', message: e.message }, { status: e.status })
    return dbFail(e)
  }
}

// POST /api/admin/db — mọi lệnh ghi của admin vào Postgres (giá theo ngày, tồn web, gói giá, quy tắc giá, chính sách).
// Kiểm phiên (lớp 2 sau src/proxy.ts) → chỉ nhận JSON → zod → pricingApi.run (transaction + AuditLog).
import { NextResponse, type NextRequest } from 'next/server'
import { AdminError, pricingApi } from '@/api/pricing'
import { isSession, SESSION_COOKIE } from '@/lib/admin-auth'
import { Command } from '@/lib/admin-commands'
import { dbFail } from '../_lib'

export async function POST(req: NextRequest) {
  if (!isSession(req.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  // Chỉ JSON: form của trang khác không gửi được Content-Type này nếu không qua preflight CORS (thêm một lớp chống CSRF ngoài sameSite=lax).
  if (!req.headers.get('content-type')?.startsWith('application/json')) return NextResponse.json({ error: 'BAD_REQUEST' }, { status: 415 })
  const parsed = Command.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    const i = parsed.error.issues[0]
    return NextResponse.json({ error: 'BAD_REQUEST', message: i ? `${i.path.join('.') || 'Dữ liệu'}: ${i.message}` : 'Dữ liệu không hợp lệ.' }, { status: 400 })
  }
  try {
    return NextResponse.json({ ok: true, message: await pricingApi.run(parsed.data) }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    if (e instanceof AdminError) return NextResponse.json({ error: 'REJECTED', message: e.message }, { status: e.status })
    return dbFail(e)
  }
}

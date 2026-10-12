// Dùng chung cho mọi route /api/admin: kiểm lại quyền (lớp hai sau src/proxy.ts) và trả JSON no-store
// (dữ liệu nội bộ, có dữ liệu khách — không để trình duyệt hay CDN lưu).
// Quyền: ADMIN mọi thứ; STAFF chỉ những route ghi rõ roles có 'STAFF' (xem booking, check-in/out).
import 'server-only'
import { NextResponse, type NextRequest } from 'next/server'
import { adminActor, type AdminActor, type AdminRole } from '@/lib/admin-actor'

export function adminGet<C>(handler: (req: NextRequest, ctx: C, actor: AdminActor) => Promise<unknown>, roles: AdminRole[] = ['ADMIN']) {
  return async (req: NextRequest, ctx: C) => {
    const actor = await adminActor()
    if (!actor) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    if (!roles.includes(actor.role)) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
    const out = await handler(req, ctx, actor)
    return out instanceof Response ? out : NextResponse.json(out, { headers: { 'Cache-Control': 'no-store' } })
  }
}

export const badRequest = () => NextResponse.json({ error: 'BAD_REQUEST' }, { status: 400 })
export const notFoundJson = () => NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

/** Lỗi Postgres → 503 cho admin: thiếu DATABASE_URL (DB_UNAVAILABLE) hoặc không kết nối/truy vấn được (DB_ERROR, ghi log). */
export function dbFail(e: unknown) {
  if (e instanceof Error && e.message === 'DB_UNAVAILABLE') return NextResponse.json({ error: 'DB_UNAVAILABLE' }, { status: 503 })
  console.error('[db] admin', e)
  return NextResponse.json({ error: 'DB_ERROR' }, { status: 503 })
}

// Dùng chung cho mọi route /api/admin: kiểm lại phiên (lớp thứ hai sau src/proxy.ts) và trả JSON no-store
// (dữ liệu nội bộ, có dữ liệu khách — không để trình duyệt hay CDN lưu).
import 'server-only'
import { NextResponse, type NextRequest } from 'next/server'
import { isSession, SESSION_COOKIE } from '@/lib/admin-auth'

export function adminGet<C>(handler: (req: NextRequest, ctx: C) => Promise<unknown>) {
  return async (req: NextRequest, ctx: C) => {
    if (!isSession(req.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    const out = await handler(req, ctx)
    return out instanceof Response ? out : NextResponse.json(out, { headers: { 'Cache-Control': 'no-store' } })
  }
}

export const badRequest = () => NextResponse.json({ error: 'BAD_REQUEST' }, { status: 400 })
export const notFoundJson = () => NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

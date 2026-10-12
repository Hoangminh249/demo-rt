// GET  /api/admin/orders/{code} — chi tiết booking web (ADMIN, STAFF).
// POST /api/admin/orders/{code} — thao tác (src/lib/order-commands.ts): ADMIN mọi thao tác; STAFF chỉ nhận / trả phòng.
import { NextResponse } from 'next/server'
import { bookingAdminApi } from '@/api/booking-admin'
import { withActor } from '@/lib/audit'
import { OrderCommand, STAFF_OPS } from '@/lib/order-commands'
import { adminGet, dbFail, notFoundJson } from '../../_lib'

export const GET = adminGet(async (_req, ctx: RouteContext<'/api/admin/orders/[code]'>) => {
  try {
    return (await bookingAdminApi.detail((await ctx.params).code)) ?? notFoundJson()
  } catch (e) {
    return dbFail(e)
  }
}, ['ADMIN', 'STAFF'])

export const POST = adminGet(async (req, ctx: RouteContext<'/api/admin/orders/[code]'>, actor) => {
  if (!req.headers.get('content-type')?.startsWith('application/json')) return NextResponse.json({ error: 'BAD_REQUEST' }, { status: 415 })
  const parsed = OrderCommand.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'BAD_REQUEST', message: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ.' }, { status: 400 })
  if (actor.role !== 'ADMIN' && !STAFF_OPS.includes(parsed.data.op)) return NextResponse.json({ error: 'FORBIDDEN', message: 'Nhân viên chỉ được nhận / trả phòng.' }, { status: 403 })
  try {
    const r = await withActor(actor.userId, async () => bookingAdminApi.act((await ctx.params).code, parsed.data, actor.userId))
    return r.ok ? r : NextResponse.json({ error: 'REJECTED', message: r.error }, { status: 409 })
  } catch (e) {
    return dbFail(e)
  }
}, ['ADMIN', 'STAFF'])

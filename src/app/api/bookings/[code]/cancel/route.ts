// POST /api/bookings/{code}/cancel — khách tự huỷ booking của mình (chờ thanh toán hoặc đã xác nhận).
// Phí huỷ theo chính sách lúc đặt; tiền hoàn thành Refund chờ admin chuyển. Email khách + team sau khi commit.
import { bookingApi } from '@/api/booking'
import { currentUser } from '@/auth'
import { bookingRoute, json } from '../../_lib'

export const POST = bookingRoute(async (_req: Request, ctx: RouteContext<'/api/bookings/[code]/cancel'>) => {
  const user = await currentUser()
  if (!user) return json({ error: 'UNAUTHORIZED' }, 401)
  const r = await bookingApi.cancel(user.id, (await ctx.params).code)
  return r.ok ? json(r) : json(r, r.error === 'NOT_FOUND' ? 404 : 409)
})

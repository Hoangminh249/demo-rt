// POST /api/bookings/{code}/pay — tạo lần thanh toán (trả đủ, hình thức ngân hàng / OnePay) và trả link sang cổng. Booking chỉ xác nhận qua webhook.
import { bookingApi } from '@/api/booking'
import { currentUser } from '@/auth'
import { PayIn } from '@/lib/booking-requests'
import { bookingRoute, json, parse } from '../../_lib'

export const POST = bookingRoute(async (req: Request, ctx: RouteContext<'/api/bookings/[code]/pay'>) => {
  const user = await currentUser()
  if (!user) return json({ error: 'UNAUTHORIZED' }, 401)
  const b = await parse(req, PayIn)
  if (b instanceof Response) return b
  const r = await bookingApi.pay(user.id, (await ctx.params).code, b.method, b.locale)
  return r.ok ? json(r) : json(r, r.error === 'NOT_FOUND' ? 404 : 409)
})

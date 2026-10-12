// GET /api/bookings/{code} — trạng thái booking của chính khách (trang kết quả hỏi lại mỗi 2 giây). Người khác → 404.
import { bookingApi } from '@/api/booking'
import { currentUser } from '@/auth'
import { bookingRoute, json } from '../_lib'

export const GET = bookingRoute(async (_req: Request, ctx: RouteContext<'/api/bookings/[code]'>) => {
  const user = await currentUser()
  if (!user) return json({ error: 'UNAUTHORIZED' }, 401)
  const b = await bookingApi.get(user.id, (await ctx.params).code)
  return b ? json(b) : json({ error: 'NOT_FOUND' }, 404)
})

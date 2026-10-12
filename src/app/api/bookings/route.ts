// POST /api/bookings — giữ phòng (booking PENDING_PAYMENT, trừ tồn held) cho khách đã đăng nhập Google.
// Server tính lại giá; khác expectedTotal → PRICE_CHANGED kèm báo giá mới (hỏi lại khách).
import { bookingApi } from '@/api/booking'
import { currentUser } from '@/auth'
import { HoldIn } from '@/lib/booking-requests'
import { bookingRoute, json, parse } from './_lib'

export const POST = bookingRoute(async (req: Request) => {
  const user = await currentUser()
  if (!user) return json({ ok: false, error: 'UNAUTHORIZED' }, 401)
  const b = await parse(req, HoldIn)
  if (b instanceof Response) return b
  const r = await bookingApi.hold(user.id, b.selection, b.contact, b.expectedTotal)
  return json(r, r.ok ? 200 : r.error === 'NOT_FOUND' ? 404 : 409)
})

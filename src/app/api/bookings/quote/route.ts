// POST /api/bookings/quote — báo giá server (giá từng đêm, phụ thu, khuyến mãi, thuế phí, cọc, lỗi). Không cần đăng nhập.
import { bookingApi } from '@/api/booking'
import { currentUser } from '@/auth'
import { SelectionIn } from '@/lib/booking-requests'
import { bookingRoute, json, parse } from '../_lib'

export const POST = bookingRoute(async (req: Request) => {
  const s = await parse(req, SelectionIn)
  if (s instanceof Response) return s
  const q = await bookingApi.quote(s, (await currentUser())?.id ?? null)
  return q ? json(q) : json({ error: 'NOT_FOUND' }, 404)
})

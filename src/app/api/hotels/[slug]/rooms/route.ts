// GET /api/hotels/{slug}/rooms?in=YYYY-MM-DD&out=YYYY-MM-DD — phòng trống + giá từng đêm từ Gohost cho khối "Chọn phòng".
// Chỉ nhận ngày: số khách và ngôn ngữ không vào khoá cache (trình duyệt tự tính "đủ chỗ"), nên đổi số khách không tốn lượt gọi.
// Kiểm tham số trước khi gọi Gohost (60 lượt / 5 phút cho cả key).
import type { NextRequest } from 'next/server'
import { hotelApi } from '@/api/hotel'
import { isGohostError } from '@/lib/gohost'
import { today } from '@/lib/format'
import { validRange } from '@/lib/stay'

const NO_STORE = { 'Cache-Control': 'no-store' }

export async function GET(req: NextRequest, ctx: RouteContext<'/api/hotels/[slug]/rooms'>) {
  const { slug } = await ctx.params
  const checkin = req.nextUrl.searchParams.get('in')
  const checkout = req.nextUrl.searchParams.get('out')
  const hotel = hotelApi.get(slug, 'vi')
  if (!hotel || !validRange(checkin, checkout, today(), hotel.opening)) return Response.json({ error: 'BAD_REQUEST' }, { status: 400, headers: NO_STORE })
  if (!hotel.online) return Response.json({ error: 'NOT_CONNECTED' }, { status: 503, headers: NO_STORE })
  try {
    const rooms = await hotelApi.availability(slug, checkin, checkout!)
    return Response.json(rooms, { headers: { 'Cache-Control': 'public, s-maxage=180, stale-while-revalidate=600' } })
  } catch (e) {
    if (isGohostError(e)) return Response.json({ error: e.message }, { status: 503, headers: NO_STORE })
    throw e
  }
}

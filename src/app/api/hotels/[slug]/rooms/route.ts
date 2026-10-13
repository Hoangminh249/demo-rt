// GET /api/hotels/{slug}/rooms?in=YYYY-MM-DD&out=YYYY-MM-DD — phòng trống + giá từng đêm (Postgres, xem hotelApi) cho khối "Chọn phòng".
// Chỉ nhận ngày: số khách và ngôn ngữ không vào khoá cache (trình duyệt tự tính "đủ chỗ").
import type { NextRequest } from 'next/server'
import { hotelApi } from '@/api/hotel'
import { today } from '@/lib/format'
import { validRange } from '@/lib/stay'

const NO_STORE = { 'Cache-Control': 'no-store' }

export async function GET(req: NextRequest, ctx: RouteContext<'/api/hotels/[slug]/rooms'>) {
  const { slug } = await ctx.params
  const checkin = req.nextUrl.searchParams.get('in')
  const checkout = req.nextUrl.searchParams.get('out')
  const hotel = await hotelApi.get(slug, 'vi')
  if (!hotel || !validRange(checkin, checkout, today(), hotel.opening)) return Response.json({ error: 'BAD_REQUEST' }, { status: 400, headers: NO_STORE })
  try {
    const rooms = await hotelApi.availability(slug, checkin, checkout!)
    // Giá/tồn đổi khi admin sửa hoặc có booking → cache ngắn (giá vẫn tính lại ở server khi giữ phòng).
    return Response.json(rooms, { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' } })
  } catch (e) {
    console.error('[db] rooms', e)
    return Response.json({ error: 'UPSTREAM' }, { status: 503, headers: NO_STORE })
  }
}

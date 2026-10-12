// GET /api/hotels/{slug}/calendar[?room=slug] — giá thấp nhất từng đêm, 90 ngày từ ngày nhận sớm nhất, cho lịch chọn ngày.
// Chỉ có khi DATA_SOURCE=db; nguồn Gohost trả [] (lịch hiện không kèm giá).
import type { NextRequest } from 'next/server'
import { hotelApi } from '@/api/hotel'
import { today } from '@/lib/format'
import { firstCheckin } from '@/lib/stay'

const NO_STORE = { 'Cache-Control': 'no-store' }

export async function GET(req: NextRequest, ctx: RouteContext<'/api/hotels/[slug]/calendar'>) {
  const { slug } = await ctx.params
  const room = req.nextUrl.searchParams.get('room')
  const hotel = hotelApi.get(slug, 'vi')
  if (!hotel || (room && !hotel.rooms.some(r => r.slug === room))) return Response.json({ error: 'BAD_REQUEST' }, { status: 400, headers: NO_STORE })
  try {
    const days = await hotelApi.calendar(slug, firstCheckin(today(), hotel.opening), room)
    return Response.json(days, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } })
  } catch (e) {
    console.error('[db] calendar', e)
    return Response.json({ error: 'UPSTREAM' }, { status: 503, headers: NO_STORE })
  }
}

// Giá & phòng trống cho tab "Giá" của admin: cùng lời gọi web đang dùng (hotelApi.availability, cache 3 phút).
import { hotelApi } from '@/api/hotel'
import { adminApi } from '@/api/admin'
import { today } from '@/lib/format'
import { validRange } from '@/lib/stay'
import { adminGet, badRequest, notFoundJson } from '../../../_lib'

export const GET = adminGet(async (req, ctx: RouteContext<'/api/admin/hotels/[slug]/availability'>) => {
  const { slug } = await ctx.params
  const hotel = hotelApi.get(slug, 'vi')
  if (!hotel) return notFoundJson()
  const checkin = req.nextUrl.searchParams.get('in')
  const checkout = req.nextUrl.searchParams.get('out')
  if (!checkin || !checkout || !validRange(checkin, checkout, today(), hotel.opening)) return badRequest()
  return adminApi.availability(slug, checkin, checkout)
})

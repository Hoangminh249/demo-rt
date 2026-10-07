// Giá & phòng trống cho tab "Giá" của admin: cùng lời gọi web đang dùng (repo.availability, cache 3 phút).
import { repo } from '@/lib/repo'
import { availabilityCheck } from '@/lib/repo/admin'
import { today } from '@/lib/format'
import { validRange } from '@/lib/stay'
import { adminGet, badRequest, notFoundJson } from '../../../_lib'

export const GET = adminGet(async (req, ctx: RouteContext<'/api/admin/hotels/[slug]/availability'>) => {
  const { slug } = await ctx.params
  const hotel = repo.getHotel(slug, 'vi')
  if (!hotel) return notFoundJson()
  const checkin = req.nextUrl.searchParams.get('in')
  const checkout = req.nextUrl.searchParams.get('out')
  if (!checkin || !checkout || !validRange(checkin, checkout, today(), hotel.opening)) return badRequest()
  return availabilityCheck(slug, checkin, checkout)
})

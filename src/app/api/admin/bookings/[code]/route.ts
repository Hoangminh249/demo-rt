import { bookingDetail, gohostProperties } from '@/lib/repo/admin'
import { adminGet, badRequest } from '../../_lib'

export const GET = adminGet(async (req, ctx: RouteContext<'/api/admin/bookings/[code]'>) => {
  const { code } = await ctx.params
  const property = req.nextUrl.searchParams.get('property')
  if (!property || !/^[\w-]+$/.test(code)) return badRequest()
  const { properties, error } = await gohostProperties()
  if (!properties) return { data: null, error }
  if (!properties.some(p => p.id === property)) return badRequest()
  return bookingDetail(property, code)
})

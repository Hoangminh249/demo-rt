// GET /api/admin/hotels/{slug}/rates?from=&to= — lịch giá + tồn web trong Postgres (tối đa 62 ngày một lần: đủ 2 tháng).
import { pricingApi } from '@/api/pricing'
import { diffDays, isISODate } from '@/lib/format'
import { adminGet, badRequest, dbFail, notFoundJson } from '../../../_lib'

export const GET = adminGet(async (req, ctx: RouteContext<'/api/admin/hotels/[slug]/rates'>) => {
  const { slug } = await ctx.params
  const from = req.nextUrl.searchParams.get('from')
  const to = req.nextUrl.searchParams.get('to')
  if (!isISODate(from) || !isISODate(to) || from > to || diffDays(from, to) > 62) return badRequest()
  try {
    return (await pricingApi.rates(slug, from, to)) ?? notFoundJson()
  } catch (e) {
    return dbFail(e)
  }
})

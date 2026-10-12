// GET /api/admin/hotels/{slug}/plans — hạng phòng + gói giá + quy tắc giá của KS, và danh sách chính sách huỷ / cọc (dùng chung).
import { pricingApi } from '@/api/pricing'
import { adminGet, dbFail, notFoundJson } from '../../../_lib'

export const GET = adminGet(async (_req, ctx: RouteContext<'/api/admin/hotels/[slug]/plans'>) => {
  try {
    return (await pricingApi.plans((await ctx.params).slug)) ?? notFoundJson()
  } catch (e) {
    return dbFail(e)
  }
})

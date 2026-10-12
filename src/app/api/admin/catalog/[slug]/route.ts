// GET /api/admin/catalog/{slug} — toàn bộ dữ liệu sửa của một khách sạn (thông tin, nội dung, hạng phòng, phòng, ảnh, tiện ích, thuế phí).
import { catalogAdminApi } from '@/api/catalog-admin'
import { adminGet, dbFail, notFoundJson } from '../../_lib'

export const GET = adminGet(async (_req, ctx: RouteContext<'/api/admin/catalog/[slug]'>) => {
  try {
    return (await catalogAdminApi.hotelEdit((await ctx.params).slug)) ?? notFoundJson()
  } catch (e) {
    return dbFail(e)
  }
})

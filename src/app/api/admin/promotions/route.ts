// GET /api/admin/promotions — mã khuyến mãi + danh sách khách sạn / gói giá để chọn phạm vi.
import { catalogAdminApi } from '@/api/catalog-admin'
import { adminGet, dbFail } from '../_lib'

export const GET = adminGet(async () => {
  try {
    return await catalogAdminApi.promotions()
  } catch (e) {
    return dbFail(e)
  }
})

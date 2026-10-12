// GET /api/admin/amenities — thư viện tiện ích dùng chung (gán cho từng khách sạn ở tab Thông tin).
import { catalogAdminApi } from '@/api/catalog-admin'
import { adminGet, dbFail } from '../_lib'

export const GET = adminGet(async () => {
  try {
    return await catalogAdminApi.amenities()
  } catch (e) {
    return dbFail(e)
  }
})

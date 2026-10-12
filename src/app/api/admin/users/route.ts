// GET /api/admin/users — người dùng (chỉ xem; đổi role làm trong DB). 500 người mới nhất.
import { catalogAdminApi } from '@/api/catalog-admin'
import { adminGet, dbFail } from '../_lib'

export const GET = adminGet(async () => {
  try {
    return await catalogAdminApi.users()
  } catch (e) {
    return dbFail(e)
  }
})

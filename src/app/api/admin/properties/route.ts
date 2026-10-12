import { adminApi } from '@/api/admin'
import { adminGet } from '../_lib'

export const GET = adminGet(() => adminApi.properties(), ['ADMIN', 'STAFF']) // STAFF: trang Booking cần danh sách property

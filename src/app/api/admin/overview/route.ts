import { adminApi } from '@/api/admin'
import { adminGet } from '../_lib'

export const GET = adminGet(() => adminApi.overview())

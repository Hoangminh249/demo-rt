import { adminApi } from '@/api/admin'
import { adminGet, notFoundJson } from '../../_lib'

export const GET = adminGet(async (_req, ctx: RouteContext<'/api/admin/hotels/[slug]'>) => {
  const data = await adminApi.hotel((await ctx.params).slug)
  return data ?? notFoundJson()
})

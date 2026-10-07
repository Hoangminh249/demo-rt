import { contentRows, hotelCheck } from '@/lib/repo/admin'
import { adminGet, notFoundJson } from '../../_lib'

export const GET = adminGet(async (_req, ctx: RouteContext<'/api/admin/hotels/[slug]'>) => {
  const data = await hotelCheck((await ctx.params).slug)
  return data ? { ...data, rows: contentRows(data.content) } : notFoundJson()
})

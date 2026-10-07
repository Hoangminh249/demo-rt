// Danh sách booking của một property Gohost theo khoảng ngày nhận phòng (≤ 30 ngày, giới hạn Gohost).
// Kiểm tham số trước khi gọi Gohost: property phải nằm trong danh sách key đọc được.
import { bookingList, gohostProperties } from '@/lib/repo/admin'
import { diffDays, isISODate } from '@/lib/format'
import { BOOKING_STATUSES } from '@/lib/types'
import { adminGet, badRequest } from '../_lib'

export const GET = adminGet(async req => {
  const q = req.nextUrl.searchParams
  const property = q.get('property')
  const start = q.get('in')
  const end = q.get('out')
  const status = q.get('status') || undefined
  const page = Number(q.get('page') || 1)
  if (!property || !isISODate(start) || !isISODate(end) || !Number.isInteger(page) || page < 1) return badRequest()
  const days = diffDays(start, end) + 1
  if (days < 1 || days > 30 || (status && !(BOOKING_STATUSES as readonly string[]).includes(status))) return badRequest()
  const { properties, error } = await gohostProperties()
  if (!properties) return { data: null, error }
  if (!properties.some(p => p.id === property)) return badRequest()
  return bookingList(property, { start, end, status, page })
})

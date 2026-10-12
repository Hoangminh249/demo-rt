// GET /api/admin/orders?status=&hotel=&from=&to=&refund=1&q=&page= — booking đặt trên web (ADMIN, STAFF).
import { bookingAdminApi } from '@/api/booking-admin'
import { isISODate } from '@/lib/format'
import { adminGet, dbFail } from '../_lib'

const STATUSES = ['PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'EXPIRED', 'NO_SHOW', 'CHECKED_IN', 'CHECKED_OUT']

export const GET = adminGet(async req => {
  const p = req.nextUrl.searchParams
  const date = (k: string) => (isISODate(p.get(k)) ? p.get(k)! : undefined)
  try {
    return await bookingAdminApi.list({
      status: STATUSES.includes(p.get('status') ?? '') ? p.get('status')! : undefined,
      hotel: p.get('hotel') || undefined, from: date('from'), to: date('to'), refund: p.get('refund') === '1',
      q: p.get('q')?.slice(0, 100) || undefined, page: Number(p.get('page')) || 1,
    })
  } catch (e) {
    return dbFail(e)
  }
}, ['ADMIN', 'STAFF'])

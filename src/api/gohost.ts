// Endpoint Gohost (chỉ GET) — mỗi hàm một endpoint, query riêng của endpoint khai báo ngay tại đây.
// Gọi qua HTTP client src/lib/gohost.ts (key, ngân sách lượt, lỗi). Chỉ server; UI đọc qua src/api/hotel.ts, src/api/admin.ts.
import 'server-only'
import { unstable_cache } from 'next/cache'
import { cookies } from 'next/headers'
import { isSession, SESSION_COOKIE } from '@/lib/admin-auth'
import { get, GohostError, list } from '@/lib/gohost'
import type { GhAvailRoomType, GhPagination, GhProperty } from '@/types/gohost'
import type { BookingDetail, BookingPage, BookingRow } from '@/types/admin'

/** GET /properties/{tenant}/room_types */
export interface RoomTypesQuery { tenant: string; checkin: string; checkout: string }
/** GET /properties/{tenant}/bookings — ngày nhận phòng trong [start, end] (tối đa 30 ngày) */
export interface BookingsQuery { start: string; end: string; status?: string; page?: number }

// ponytail: unstable_cache — Next 16 đã có 'use cache' thay thế nhưng phải bật cacheComponents (đổi cả cách dựng trang).
// Chỉ lưu kết quả trả về thành công; lần làm mới bị lỗi thì vẫn trả bản cũ.

/** GET /properties — mọi property của tổ chức + hạng phòng + gói giá (giá mặc định T2 → CN). Cache 1 giờ. */
const properties = unstable_cache(
  async () => list<GhProperty>((await get('/properties')).data),
  ['gohost-properties'],
  { revalidate: 3600 },
)

/** GET /properties/{tenant}/room_types — mọi hạng phòng cho khoảng ngày, kể cả hạng đã hết, kèm giá từng đêm. Cache 3 phút. */
const roomTypes = unstable_cache(
  async ({ tenant, checkin, checkout }: RoomTypesQuery) => {
    const body = await get(`/properties/${encodeURIComponent(tenant)}/room_types`, { checkin_date: checkin, checkout_date: checkout })
    return list<{ room_types?: GhAvailRoomType }>(body.data).flatMap(row => (row?.room_types?.id ? [row.room_types] : []))
  },
  ['gohost-room-types'],
  { revalidate: 180 },
)

// ---------- Booking — chỉ admin, không cache (dữ liệu khách) ----------
// Cấu trúc theo response thật (07/10/2026). Chỉ lấy các field được phép; SĐT, email che phần giữa.
// Không bao giờ lấy customer.identity, id_type, identity_image_urls, birthday (CCCD, ảnh giấy tờ — NĐ 13/2023).

type Raw = Record<string, unknown>
const obj = (v: unknown): Raw => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Raw) : {})
const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v : typeof v === 'number' ? String(v) : null)
const num = (v: unknown) => (typeof v === 'number' ? v : typeof v === 'string' && v.trim() && !Number.isNaN(Number(v)) ? Number(v) : null)
const maskPhone = (v: unknown) => { const p = str(v)?.replace(/\s/g, ''); return p ? (p.length > 6 ? `${p.slice(0, 3)}****${p.slice(-3)}` : '****') : null }
const maskEmail = (v: unknown) => { const e = str(v); if (!e?.includes('@')) return null; const [u, d] = e.split('@'); return `${u.slice(0, 2)}***@${d}` }

/** Proxy và route handler đã kiểm phiên; đây là lớp thứ hai ngay trước khi đọc dữ liệu khách. */
async function assertAdmin() {
  if (!isSession((await cookies()).get(SESSION_COOKIE)?.value)) throw new Error('UNAUTHORIZED')
}

function toRow(raw: unknown): BookingRow {
  const b = obj(raw)
  const customer = obj(b.customer)
  const rooms = list<Raw>(b.booking_rooms).map(r => str(r.room_type)).filter(Boolean)
  return {
    code: str(b.id) ?? '', // mã booking Gohost, 8 ký tự
    status: str(b.status) ?? 'unknown',
    payment_status: str(b.payment_status),
    checkin: str(b.checkin_date),
    checkout: str(b.checkout_date),
    amount: num(b.amount),
    currency: str(b.currency) ?? 'VND',
    customer: str(customer.name),
    phone: maskPhone(customer.phone),
    source: str(b.source_name) ?? str(obj(b.booking_source).name),
    rooms: rooms.length ? rooms.join(', ') : null,
  }
}

/** GET /properties/{tenant}/bookings — 50 dòng một trang. */
async function bookings(tenant: string, q: BookingsQuery): Promise<BookingPage> {
  await assertAdmin()
  const body = await get(`/properties/${encodeURIComponent(tenant)}/bookings`, {
    start_date: q.start, end_date: q.end, status: q.status, per_page: 50, page: q.page,
  })
  const rows = list(body.data).map(toRow).filter(r => r.code)
  const p: Partial<GhPagination> = body.pagination ?? {}
  return { rows, page: num(p.current_page) ?? q.page ?? 1, lastPage: num(p.last_page) ?? 1, total: num(p.total) ?? rows.length }
}

/** GET /properties/{tenant}/bookings/{code} */
async function booking(tenant: string, code: string): Promise<BookingDetail> {
  await assertAdmin()
  if (!/^[\w-]+$/.test(code)) throw new GohostError('NOT_FOUND')
  const body = await get(`/properties/${encodeURIComponent(tenant)}/bookings/${encodeURIComponent(code)}`, { booking_id: code })
  const b = obj(body.data)
  return {
    ...toRow(b),
    booked_at: str(b.booked_at),
    arrival_hour: str(b.arrival_hour),
    departure_hour: str(b.departure_hour),
    payment_collect: str(b.payment_collect),
    ota_code: str(b.source_reservation_code),
    notes: str(b.notes),
    email: maskEmail(obj(b.customer).email),
    room_list: list<Raw>(b.booking_rooms).map(r => {
      const occ = obj(r.occupancy)
      return {
        room_type: str(r.room_type) ?? '—',
        unit: str(r.room_unit),
        nights: num(r.nights),
        adults: num(occ.adults) ?? 0,
        children: num(occ.children) ?? 0,
        infants: num(occ.infants) ?? 0,
        breakfast: r.has_breakfast === true,
        // Tên field của khách trong phòng: UNKNOWN (booking đã xem chưa có khách nào) → đọc name / full_name.
        guests: list<Raw>(r.guests).map(g => ({ name: str(g.name) ?? str(g.full_name) ?? '—', primary: g.is_primary_guest === true || g.is_primary === true })),
      }
    }),
    payments: list(b.payments).length,
  }
}

export const gohostApi = { properties, roomTypes, bookings, booking }

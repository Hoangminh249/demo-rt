// Gohost PMS Public API — CHỈ ĐỌC. Chỉ gọi từ server, key không bao giờ xuống trình duyệt
// (trình duyệt gọi /api của Rooty qua src/lib/http.ts; route handler mới gọi file này).
// Spec + giới hạn: docs/api-docs/gohost-api.md. Đã gọi thật 07/10/2026: /properties, /bookings, /bookings/{id}.
// Khoá chỉ-đọc hai lớp: key Gohost cấp scope properties:read + bookings:read (không bookings:write),
// và file này chỉ có hàm get() — không có đường nào gửi POST.
import 'server-only'
import axios from 'axios'
import { unstable_cache } from 'next/cache'
import { cookies } from 'next/headers'
import { isSession, SESSION_COOKIE } from './admin-auth'
import type { BookingDetail, BookingRow } from './types'

const BASE = 'https://platform.gohost.vn/pms/api/public/v1'
const BUDGET = 50 // lượt / 5 phút. Gohost cho 60 cho cả key; chừa 10 cho người khác dùng chung key
const WINDOW = 5 * 60_000

// ---------- Kiểu Gohost (spec OpenAPI) ----------

export interface GhRatePlan {
  id: string; title: string; is_default: boolean; rate_plan_type: string; currency: string; sell_mode: string
  default_rate: number; default_rates: number[] /* 7 giá T2 → CN */; min_rate: number | null; max_rate: number | null
  min_stay: number | null; max_stay: number | null
}
export interface GhRoomType {
  id: string; title: string; notes: string | null; quantity: number; room_kind: string; is_virtual: boolean
  occ_adults: number; occ_children: number; occ_infants: number; rate_plans: GhRatePlan[]
}
export interface GhProperty { id: string; prefix: string; title: string; property_type: string; currency: string; timezone: string; room_types: GhRoomType[] }

export interface GhAvailRatePlan { id: string; title: string; currency: string; has_breakfast: boolean; days_breakdown: { day: string; price: number }[]; estimated_total_price: number }
export interface GhAvailRoomType { id: string; title: string; quantity: number; occ_adults: number; occ_children: number; occ_infants: number; rate_plans: GhAvailRatePlan[] }

// ---------- Lỗi: chỉ mang mã, không mang nội dung response ----------

export type GohostErrorCode = 'NOT_CONFIGURED' | 'RATE_LIMITED' | 'UPSTREAM' | 'NOT_FOUND'
export class GohostError extends Error {
  name = 'GohostError'
  declare message: GohostErrorCode
}
/** Không dùng instanceof: route handler và trang có thể nạp hai bản module khác nhau. */
export const isGohostError = (e: unknown): e is GohostError => e instanceof Error && e.name === 'GohostError'

// ---------- Ngân sách lượt gọi + trạng thái cho admin ----------
// ponytail: đếm trong một tiến trình (globalThis). Đúng khi chạy 1 instance; khi có worker đồng bộ dùng chung key
// hoặc nhiều instance thì chuyển sang bộ đếm dùng chung (Postgres) — xem review §4.4.
interface State {
  calls: number[]
  cooldownUntil: number
  inflight: Map<string, Promise<unknown>>
  last: { at: number; path: string; status: number | 'network' } | null
  lastError: { at: number; code: GohostErrorCode } | null
}
const g = globalThis as typeof globalThis & { __gohost?: State }
const s: State = (g.__gohost ??= { calls: [], cooldownUntil: 0, inflight: new Map(), last: null, lastError: null })

function budgetLeft() {
  const now = Date.now()
  s.calls = s.calls.filter(t => now - t < WINDOW)
  return BUDGET - s.calls.length
}

export const gohostStatus = () => ({
  configured: Boolean(process.env.GOHOST_API_KEY && process.env.GOHOST_API_SECRET),
  budget: BUDGET,
  budgetLeft: budgetLeft(),
  cooldownUntil: s.cooldownUntil,
  last: s.last,
  lastError: s.lastError,
})

function fail(code: GohostErrorCode) {
  s.lastError = { at: Date.now(), code }
  return new GohostError(code)
}

// ---------- Instance axios riêng cho Gohost ----------
// Base URL, timeout và Bearer key:secret khai báo MỘT lần ở đây. Interceptor đọc env lúc gửi (đổi .env không phải
// khởi động lại). validateStatus: mọi mã HTTP về tay get() để đổi thành GohostError, axios không tự ném.
export const gohostHttp = axios.create({
  baseURL: BASE,
  timeout: 8000,
  headers: { Accept: 'application/json' },
  validateStatus: () => true,
})
gohostHttp.interceptors.request.use(config => {
  config.headers.Authorization = `Bearer ${process.env.GOHOST_API_KEY}:${process.env.GOHOST_API_SECRET}`
  return config
})

/** GET duy nhất ra Gohost. Trả nguyên body `{ success, data, … }` khi success = true; mọi lỗi thành GohostError. */
async function get<T>(path: string, query: Record<string, string | number | undefined> = {}): Promise<T> {
  if (!process.env.GOHOST_API_KEY || !process.env.GOHOST_API_SECRET) throw fail('NOT_CONFIGURED')
  const params = Object.fromEntries(Object.entries(query).filter(([, v]) => v !== undefined && v !== ''))
  const key = `${path}?${new URLSearchParams(params as Record<string, string>)}`

  const running = s.inflight.get(key) // cùng lời gọi đang chạy → dùng chung, không tốn thêm lượt
  if (running) return running as Promise<T>
  if (Date.now() < s.cooldownUntil || budgetLeft() <= 0) throw fail('RATE_LIMITED')
  s.calls.push(Date.now())

  const call = (async () => {
    const res = await gohostHttp.get(path, { params }).catch(() => null)
    if (!res) {
      s.last = { at: Date.now(), path, status: 'network' }
      throw fail('UPSTREAM')
    }
    const body = res.data
    s.last = { at: Date.now(), path, status: res.status }
    console.info('[gohost]', res.status, path, `còn ${budgetLeft()}/${BUDGET} lượt`)
    if (res.status < 300 && body?.success === true) return body as T
    // Gohost trả 422 + errors.booking_id khi không có booking (đã gọi thử 07/10/2026). Không phải lỗi kết nối.
    if (res.status === 422 && body?.errors?.booking_id) throw new GohostError('NOT_FOUND')
    // Mã lỗi giới hạn lượt: spec ghi RATE_001 nhưng chưa thấy thật → dò ở bất cứ đâu trong body.
    if (res.status === 429 || JSON.stringify(body ?? '').includes('RATE_001')) {
      s.cooldownUntil = Date.now() + 60_000
      throw fail('RATE_LIMITED')
    }
    throw fail('UPSTREAM')
  })().finally(() => s.inflight.delete(key))
  s.inflight.set(key, call)
  return call
}

const list = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : [])

// ---------- Dữ liệu dùng chung web + admin ----------
// ponytail: unstable_cache — Next 16 đã có 'use cache' thay thế nhưng phải bật cacheComponents (đổi cả cách dựng trang).
// Chỉ lưu kết quả trả về thành công; lần làm mới bị lỗi thì vẫn trả bản cũ.

/** Mọi property của tổ chức + hạng phòng + gói giá (giá mặc định T2 → CN). Cache 1 giờ. */
export const getProperties = unstable_cache(
  async () => list<GhProperty>((await get<{ data: unknown }>('/properties')).data),
  ['gohost-properties'],
  { revalidate: 3600 },
)

/** Mọi hạng phòng của một KS cho khoảng ngày, kể cả hạng đã hết, kèm giá từng đêm. Cache 3 phút. */
export const getRoomTypes = unstable_cache(
  async (tenant: string, checkin: string, checkout: string) => {
    const body = await get<{ data: unknown }>(`/properties/${encodeURIComponent(tenant)}/room_types`, { checkin_date: checkin, checkout_date: checkout })
    // Spec ghi data[] = { room_types: {…} } (object, không phải mảng) — chưa kiểm với response thật nên nhận cả hai dạng.
    return list<{ room_types?: unknown }>(body.data)
      .flatMap(row => (row && typeof row === 'object' && 'room_types' in row ? row.room_types : row))
      .filter((rt): rt is GhAvailRoomType => Boolean(rt && typeof rt === 'object' && 'id' in rt))
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

export interface BookingPage { rows: BookingRow[]; page: number; lastPage: number; total: number }

/** Booking có ngày nhận phòng trong [start, end] (tối đa 30 ngày), 50 dòng một trang. */
export async function getBookings(tenant: string, q: { start: string; end: string; status?: string; page?: number }): Promise<BookingPage> {
  await assertAdmin()
  const body = await get<{ data: unknown; pagination?: unknown }>(`/properties/${encodeURIComponent(tenant)}/bookings`, {
    start_date: q.start, end_date: q.end, status: q.status, per_page: 50, page: q.page,
  })
  const rows = list(body.data).map(toRow).filter(r => r.code)
  const p = obj(body.pagination)
  return { rows, page: num(p.current_page) ?? q.page ?? 1, lastPage: num(p.last_page) ?? 1, total: num(p.total) ?? rows.length }
}

export async function getBooking(tenant: string, code: string): Promise<BookingDetail> {
  await assertAdmin()
  if (!/^[\w-]+$/.test(code)) throw new GohostError('NOT_FOUND')
  const body = await get<{ data: unknown }>(`/properties/${encodeURIComponent(tenant)}/bookings/${encodeURIComponent(code)}`, { booking_id: code })
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

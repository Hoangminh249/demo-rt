// HTTP client Gohost PMS Public API — CHỈ ĐỌC. Chỉ gọi từ server, key không bao giờ xuống trình duyệt.
// File này lo key, ngân sách lượt gọi, lỗi. Các endpoint (đường dẫn, query, đổi response) ở src/api/gohost.ts.
// Spec + giới hạn: docs/api-docs/gohost-api.md. Khoá chỉ-đọc hai lớp: key Gohost cấp scope properties:read +
// bookings:read (không bookings:write), và file này chỉ có hàm get() — không có đường nào gửi POST.
import 'server-only'
import axios from 'axios'
import type { GhResponse, GohostErrorCode, GohostStatus } from '@/types/gohost'

const BASE = 'https://platform.gohost.vn/pms/api/public/v1'
const BUDGET = 50 // lượt / 5 phút. Gohost cho 60 cho cả key; chừa 10 cho người khác dùng chung key
const WINDOW = 5 * 60_000

// ---------- Lỗi: chỉ mang mã, không mang nội dung response ----------

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

export const gohostStatus = (): GohostStatus => ({
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
export async function get<T>(path: string, query: Record<string, string | number | undefined> = {}): Promise<GhResponse<T>> {
  if (!process.env.GOHOST_API_KEY || !process.env.GOHOST_API_SECRET) throw fail('NOT_CONFIGURED')
  const params = Object.fromEntries(Object.entries(query).filter(([, v]) => v !== undefined && v !== ''))
  const key = `${path}?${new URLSearchParams(params as Record<string, string>)}`

  const running = s.inflight.get(key) // cùng lời gọi đang chạy → dùng chung, không tốn thêm lượt
  if (running) return running as Promise<GhResponse<T>>
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
    if (res.status < 300 && body?.success === true) return body as GhResponse<T>
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

/** data[] của Gohost; không phải mảng thì coi như rỗng. */
export const list = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : [])

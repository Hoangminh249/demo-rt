// Ngày ở + số khách ↔ URL (?in=&out=&a=&c=), để trang chủ truyền sang trang khách sạn và chia sẻ link được.
// validRange dùng chung cho URL (trình duyệt) và route handler phòng trống (server): sai thì không gọi Gohost.
import type { Stay } from './types'
import { addDays, diffDays, isISODate, today } from './format'

export const MAX_NIGHTS = 30 // Gohost: khoảng ngày tối đa 30 đêm
const MAX_AHEAD = 365

/** Ngày nhận sớm nhất: hôm nay, hoặc ngày khai trương nếu khách sạn chưa mở. */
export const firstCheckin = (now: string, opening?: string | null) => (opening && opening > now ? opening : now)

/** Mặc định: nhận phòng ngày mai (hoặc ngày khai trương), ở 2 đêm, 2 người lớn. */
export function defaultStay(now: string, opening?: string | null): Stay {
  const checkin = firstCheckin(addDays(now, 1), opening)
  return { checkin, checkout: addDays(checkin, 2), adults: 2, children: 0 }
}

/** Khoảng ngày hỏi được Gohost. Cho lùi 1 ngày so với `now` vì đồng hồ trình duyệt và server có thể lệch qua nửa đêm. */
export function validRange(checkin: string | null, checkout: string | null, now: string, opening?: string | null): checkin is string {
  if (!isISODate(checkin) || !isISODate(checkout)) return false
  const nights = diffDays(checkin, checkout)
  return checkin >= addDays(firstCheckin(now, opening), opening && opening > now ? 0 : -1)
    && checkin <= addDays(now, MAX_AHEAD)
    && nights >= 1 && nights <= MAX_NIGHTS
}

const clamp = (v: string | null, d: number, min: number, max: number) => {
  const n = Number(v)
  return v != null && Number.isInteger(n) ? Math.min(max, Math.max(min, n)) : d
}

export function parseStay(sp: { get(k: string): string | null }, opening?: string | null): Stay {
  const now = today()
  const d = defaultStay(now, opening)
  const checkin = sp.get('in')
  const checkout = sp.get('out')
  const ok = validRange(checkin, checkout, now, opening) && checkin >= firstCheckin(now, opening)
  return {
    checkin: ok ? checkin : d.checkin,
    checkout: ok ? checkout! : d.checkout,
    adults: clamp(sp.get('a'), d.adults, 1, 6),
    children: clamp(sp.get('c'), d.children, 0, 4),
  }
}

export const stayQuery = (s: Stay) => new URLSearchParams({ in: s.checkin, out: s.checkout, a: String(s.adults), c: String(s.children) }).toString()
export const hotelHref = (slug: string, s?: Stay) => `/hotel/${slug}${s ? `?${stayQuery(s)}` : ''}`

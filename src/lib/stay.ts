// Ngày ở + số khách ↔ URL (?in=&out=&a=&c=), để trang chủ truyền sang trang khách sạn và chia sẻ link được.
import type { Stay } from './types'
import { addDays, diffDays, isISODate, TODAY } from './format'

export const DEFAULT_STAY: Stay = { checkin: '2026-10-16', checkout: '2026-10-19', adults: 2, children: 1 }

const clamp = (v: string | null, d: number, min: number, max: number) => {
  const n = Number(v)
  return v != null && Number.isInteger(n) ? Math.min(max, Math.max(min, n)) : d
}

export function parseStay(sp: { get(k: string): string | null }): Stay {
  let checkin = sp.get('in')
  let checkout = sp.get('out')
  if (!isISODate(checkin) || checkin < TODAY) checkin = DEFAULT_STAY.checkin
  if (!isISODate(checkout) || checkout <= checkin || diffDays(checkin, checkout) > 30) checkout = addDays(checkin, 3)
  return { checkin, checkout, adults: clamp(sp.get('a'), DEFAULT_STAY.adults, 1, 6), children: clamp(sp.get('c'), DEFAULT_STAY.children, 0, 4) }
}

export const stayQuery = (s: Stay) => new URLSearchParams({ in: s.checkin, out: s.checkout, a: String(s.adults), c: String(s.children) }).toString()
export const hotelHref = (slug: string, s?: Stay) => `/hotel/${slug}${s ? `?${stayQuery(s)}` : ''}`

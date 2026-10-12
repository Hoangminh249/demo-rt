// Tồn phòng + giá theo ngày của Rooty (Postgres) → phòng trống và gói giá cho một khoảng ngày.
// Thuần, không import Prisma: src/api/inventory.ts đọc DB rồi đưa vào đây. Kiểm bằng scripts/check.ts.
// Đêm = [checkin, checkout). Thiếu dòng tồn hoặc dòng giá của một đêm nào → không bán.
import type { PlanOffer } from '@/types/hotel'
import { addDays, diffDays } from './format'

export interface InventoryDay {
  date: string
  allotment: number
  booked: number
  held: number
  closed: boolean
  minStay: number
  maxStay: number | null
  closedToArrival: boolean
  closedToDeparture: boolean
}

export interface PlanRates { id: string; title: string; has_breakfast: boolean; rates: Record<string, number> }

export const nightsOf = (checkin: string, checkout: string) =>
  Array.from({ length: Math.max(0, diffDays(checkin, checkout)) }, (_, i) => addDays(checkin, i))

export type StayIssue =
  | 'NO_INVENTORY' // thiếu dòng tồn một đêm → không bán
  | 'CLOSED'
  | 'MIN_STAY' | 'MAX_STAY' // theo ngày đến
  | 'CLOSED_TO_ARRIVAL' | 'CLOSED_TO_DEPARTURE'

/** Số phòng web còn bán cho CẢ khoảng (nhỏ nhất qua các đêm) + lý do không bán được (nếu có). */
export function stayCheck(inv: InventoryDay[], checkin: string, checkout: string): { left: number; issues: { code: StayIssue; date?: string }[] } {
  const by = new Map(inv.map(d => [d.date, d]))
  const nights = nightsOf(checkin, checkout)
  const issues: { code: StayIssue; date?: string }[] = []
  const arrival = by.get(checkin)
  if (arrival?.closedToArrival) issues.push({ code: 'CLOSED_TO_ARRIVAL', date: checkin })
  if (arrival && nights.length < arrival.minStay) issues.push({ code: 'MIN_STAY', date: checkin })
  if (arrival?.maxStay != null && nights.length > arrival.maxStay) issues.push({ code: 'MAX_STAY', date: checkin })
  if (by.get(checkout)?.closedToDeparture) issues.push({ code: 'CLOSED_TO_DEPARTURE', date: checkout })
  let left = nights.length ? Infinity : 0
  for (const n of nights) {
    const d = by.get(n)
    if (!d) { issues.push({ code: 'NO_INVENTORY', date: n }); left = 0; continue }
    if (d.closed) { issues.push({ code: 'CLOSED', date: n }); left = 0; continue }
    left = Math.min(left, d.allotment - d.booked - d.held)
  }
  return { left: Math.max(0, left), issues }
}

/**
 * Số phòng web còn bán được cho CẢ khoảng ngày. Trả 0 khi: thiếu dòng tồn một đêm, đêm đóng,
 * số đêm ngoài minStay/maxStay của ngày đến, ngày đến bị CTA, ngày đi bị CTD.
 */
// ponytail: danh sách phòng hiện vi phạm minStay/CTA/CTD như "hết phòng"; lý do cụ thể hiện ở bước quote (stayCheck).
export function roomsLeft(inv: InventoryDay[], checkin: string, checkout: string): number {
  const { left, issues } = stayCheck(inv, checkin, checkout)
  return issues.length ? 0 : left
}

/** Gói nào có giá cho MỌI đêm thì bán, kèm giá từng đêm (cùng dạng days_breakdown của Gohost để UI dùng chung). */
export function planOffers(plans: PlanRates[], checkin: string, checkout: string): PlanOffer[] {
  const nights = nightsOf(checkin, checkout)
  return plans.flatMap(p => {
    if (!nights.length || nights.some(n => p.rates[n] === undefined)) return []
    const days_breakdown = nights.map(day => ({ day, price: p.rates[day] }))
    return [{ rate_plan_id: p.id, title: p.title, has_breakfast: p.has_breakfast, days_breakdown, total: days_breakdown.reduce((s, d) => s + d.price, 0) }]
  })
}

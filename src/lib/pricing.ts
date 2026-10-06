// Tính giá theo đêm, ưu đãi, add-on. Hàm thuần — dữ liệu truyền vào từ repo.
// Ngoài đời: giá theo đêm lấy từ Gohost (days_breakdown); ưu đãi/add-on/giá đại lý do Rooty giữ.
// Giá luôn phải tính lại ở server, không tin giá gửi từ trình duyệt (Gohost nhận giá do client gửi).
import type { Addon, Agent, BookingAddon, DayPrice, Promotion, RatePlan, RoomType } from './types'
import { diffDays, isWeekendNight, nightsBetween } from './format'

export const SEASON: Record<number, number> = { 1: 1.25, 2: 1.2, 3: 1.1, 4: 1.05, 5: 1, 6: 1.05, 7: 1.12, 8: 1.15, 9: 0.97, 10: 1, 11: 1.08, 12: 1.25 }
export const WEEKEND_FACTOR = 1.15
export const DEPOSIT_RATE = 0.3
export const MEMBER_DISCOUNT = 0.05

const round1k = (n: number) => Math.round(n / 1000) * 1000
export const rateKey = (rate_plan_id: string, day: string) => `${rate_plan_id}|${day}`

export function nightPrice(rt: RoomType, plan: RatePlan, day: string, overrides?: Record<string, number>) {
  const o = overrides?.[rateKey(plan.rate_plan_id, day)]
  if (o != null) return o
  const month = Number(day.slice(5, 7))
  return round1k(rt.base_price * plan.factor * SEASON[month] * (isWeekendNight(day) ? WEEKEND_FACTOR : 1))
}

export const daysBreakdown = (rt: RoomType, plan: RatePlan, checkin: string, checkout: string, overrides?: Record<string, number>): DayPrice[] =>
  nightsBetween(checkin, checkout).map(day => ({ day, price: nightPrice(rt, plan, day, overrides) }))

/** Giá net đại lý / đêm (hợp đồng cố định, không theo mùa). Gohost không có khái niệm này. */
export const agentNet = (agent: Agent, rt: RoomType) => agent.net_overrides[rt.room_type_id] ?? round1k(rt.public_rate * (1 - agent.discount))

export function addonLine(addon: Addon, qty: number, adults: number, children: number): BookingAddon {
  let total: number
  let n = qty
  if (addon.unit === 'person') {
    total = qty * (adults * addon.price + children * (addon.child_price ?? addon.price))
    n = qty * (adults + children)
  } else total = qty * addon.price
  return { addon_id: addon.id, name: addon.name, qty: n, unit_price: addon.price, total }
}

export interface PromoContext {
  hotel_id: string
  checkin: string
  checkout: string
  children: number
  addonCategories: string[]
  chosenPromoId?: string
  today: string
}

export function promoEligible(p: Promotion, c: PromoContext) {
  if (!p.active || c.checkin < p.valid_from || c.checkin > p.valid_to) return false
  if (p.hotel_ids !== 'all' && !p.hotel_ids.includes(c.hotel_id)) return false
  if (p.min_advance_days != null && diffDays(c.today, c.checkin) < p.min_advance_days) return false
  if (p.min_nights != null && diffDays(c.checkin, c.checkout) < p.min_nights) return false
  if (p.min_children != null && c.children < p.min_children) return false
  if (p.needs_code && c.chosenPromoId !== p.id) return false
  if (p.needs_addons && !p.needs_addons.every(cat => c.addonCategories.includes(cat))) return false
  return true
}

/** Không cộng dồn: chọn ưu đãi giảm nhiều nhất. */
export const bestPromo = (promos: Promotion[], c: PromoContext) =>
  promos.filter(p => promoEligible(p, c)).sort((a, b) => b.discount_pct - a.discount_pct)[0]

export interface Quote {
  days_breakdown: DayPrice[]
  rooms: number
  room_total: number
  promo?: Promotion
  promo_discount: number
  member_discount: number
  discount: number
  addons: BookingAddon[]
  addons_total: number
  total: number
  deposit: number
}

export function quote(args: {
  rt: RoomType; plan: RatePlan; checkin: string; checkout: string; rooms: number; adults: number; children: number
  addons: { addon: Addon; qty: number }[]; promos: Promotion[]; chosenPromoId?: string; member: boolean; today: string
  overrides?: Record<string, number>
}): Quote {
  const { rt, plan, checkin, checkout, rooms, adults, children } = args
  const days_breakdown = daysBreakdown(rt, plan, checkin, checkout, args.overrides)
  const room_total = days_breakdown.reduce((s, d) => s + d.price, 0) * rooms
  const addons = args.addons.filter(a => a.qty > 0).map(a => addonLine(a.addon, a.qty, adults, children))
  const addons_total = addons.reduce((s, a) => s + a.total, 0)
  const promo = bestPromo(args.promos, {
    hotel_id: rt.hotel_id, checkin, checkout, children, today: args.today, chosenPromoId: args.chosenPromoId,
    addonCategories: args.addons.filter(a => a.qty > 0).map(a => a.addon.category),
  })
  const promo_discount = promo ? round1k((room_total * promo.discount_pct) / 100) : 0
  const member_discount = args.member ? round1k((room_total - promo_discount) * MEMBER_DISCOUNT) : 0
  const discount = promo_discount + member_discount
  const total = room_total - discount + addons_total
  return { days_breakdown, rooms, room_total, promo, promo_discount, member_discount, discount, addons, addons_total, total, deposit: round1k(total * DEPOSIT_RATE) }
}

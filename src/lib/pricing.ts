// Giá theo đêm. Ngoài đời: lấy từ Gohost (days_breakdown) qua backend Rooty, và luôn tính lại ở server
// (Gohost nhận giá do client gửi). Ở đây là công thức giả lập: giá gốc × gói × mùa × cuối tuần.
import type { DayPrice, RatePlan, RoomType } from './types'
import { isWeekendNight, nightsBetween } from './format'

const SEASON: Record<number, number> = { 1: 1.25, 2: 1.2, 3: 1.1, 4: 1.05, 5: 1, 6: 1.05, 7: 1.12, 8: 1.15, 9: 0.97, 10: 1, 11: 1.08, 12: 1.25 }
const WEEKEND_FACTOR = 1.15
const round1k = (n: number) => Math.round(n / 1000) * 1000

export const nightPrice = (rt: RoomType, plan: RatePlan, day: string) =>
  round1k(rt.base_price * plan.factor * SEASON[Number(day.slice(5, 7))] * (isWeekendNight(day) ? WEEKEND_FACTOR : 1))

export const daysBreakdown = (rt: RoomType, plan: RatePlan, checkin: string, checkout: string): DayPrice[] =>
  nightsBetween(checkin, checkout).map(day => ({ day, price: nightPrice(rt, plan, day) }))

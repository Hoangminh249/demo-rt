// Chọn ngày theo khoảng + thứ trong tuần, và sinh giá từng đêm từ PricingRule. Thuần — kiểm ở scripts/check.ts.
// Ngày dạng 'YYYY-MM-DD' (lịch Asia/Ho_Chi_Minh, không mang giờ). Thứ: 0 = CN … 6 = T7.
import { addDays, diffDays } from './format'

export const MAX_RANGE_DAYS = 366

export const weekdayOf = (iso: string) => new Date(`${iso}T00:00:00Z`).getUTCDay()

/** Các ngày trong [from, to] (gồm cả to) khớp `weekdays` (rỗng = mọi ngày). */
export function datesIn(from: string, to: string, weekdays: number[] = []): string[] {
  const n = diffDays(from, to) + 1
  return Array.from({ length: Math.max(0, n) }, (_, i) => addDays(from, i))
    .filter(d => !weekdays.length || weekdays.includes(weekdayOf(d)))
}

export interface Rule { startDate: string; endDate: string; weekdays: number[]; type: 'FIXED' | 'PERCENT'; value: number; priority: number }

const matches = (r: Rule, day: string) => day >= r.startDate && day <= r.endDate && (!r.weekdays.length || r.weekdays.includes(weekdayOf(day)))

/**
 * Giá một đêm: rule khớp có priority cao nhất thắng (bằng nhau: rule đứng trước trong mảng).
 * FIXED → value. PERCENT → basePrice × (100 + value)% làm tròn nghìn đồng. Không rule khớp → basePrice.
 * null = không tính được (không rule khớp và không basePrice, hoặc PERCENT mà thiếu basePrice) → không ghi giá đêm đó.
 */
export function priceFromRules(rules: Rule[], basePrice: number | null, day: string): number | null {
  const rule = rules.filter(r => matches(r, day)).reduce<Rule | null>((best, r) => (!best || r.priority > best.priority ? r : best), null)
  if (!rule) return basePrice
  if (rule.type === 'FIXED') return rule.value
  return basePrice == null ? null : Math.max(0, Math.round((basePrice * (100 + rule.value)) / 100 / 1000) * 1000)
}

// Báo giá một lựa chọn đặt phòng — HÀM THUẦN, không import Prisma. Server gọi khi quote, khi giữ phòng và khi xác nhận
// (không bao giờ tin giá trình duyệt gửi). Kiểm ở scripts/check-quote.ts (yarn check:quote).
// Tiền: số nguyên VND. Đêm = [checkin, checkout). Một booking = một hạng phòng × `rooms` phòng.
import { FREE_CHILD_AGE, MAX_ROOMS_PER_BOOKING } from './booking-rules'
import { addDays, diffDays } from './format'
import { nightsOf, stayCheck, type InventoryDay, type StayIssue } from './inventory'

export type QuoteErrorCode =
  | StayIssue
  | 'INVALID_STAY' // ngày sai, 0 đêm, số phòng/khách sai
  | 'SOLD_OUT' // không đủ phòng web cho số phòng đã chọn
  | 'NO_RATE' // thiếu giá một đêm → không bán đêm đó
  | 'PLAN_INACTIVE'
  | 'OVER_CAPACITY'
  | 'PROMO_NOT_FOUND' | 'PROMO_EXHAUSTED' | 'PROMO_NOT_APPLICABLE'

export interface QuoteError { code: QuoteErrorCode; date?: string }

export interface PromotionIn {
  code: string
  type: 'PERCENT' | 'FIXED'
  value: number
  minNights: number
  bookStart: Date | null
  bookEnd: Date | null
  stayStart: string | null
  stayEnd: string | null
  active: boolean
}

export interface TaxFeeIn { name: string; type: 'PERCENT' | 'PER_NIGHT' | 'PER_BOOKING'; value: number; included: boolean }
export interface DepositIn { type: 'PERCENT' | 'FIXED' | 'FIRST_NIGHT' | 'FULL'; value: number; holdMinutes: number; balanceDueDaysBefore: number }

export interface QuoteInput {
  checkin: string
  checkout: string
  rooms: number
  adults: number
  childAges: number[] // tuổi từng trẻ (1–11)
  roomType: { maxAdults: number; maxChildren: number; maxOccupancy: number; baseOccupancy: number }
  plan: { refundable: boolean; extraAdultFee: number; extraChildFee: number; active: boolean }
  inventory: InventoryDay[] // các đêm + ngày đi (để kiểm CTD)
  rates: Record<string, number> // giá phòng / đêm của gói
  /** Server đã tìm theo mã + KS + gói: object | 'NOT_FOUND' | 'EXHAUSTED' (hết lượt) | null (không nhập mã) */
  promotion: PromotionIn | 'NOT_FOUND' | 'EXHAUSTED' | null
  taxFees: TaxFeeIn[]
  deposit: DepositIn
  now: Date
}

export interface QuoteNight { date: string; price: number; extraFee: number; total: number } // price: 1 phòng; total = price × rooms + extraFee

export interface Quote {
  nights: QuoteNight[]
  subtotal: number
  discount: number
  promoCode: string | null
  taxLines: { name: string; amount: number; included: boolean }[]
  taxFees: number // phần cộng thêm (không gồm thuế đã nằm trong giá)
  total: number
  deposit: number
  balanceDue: number
  balanceDueAt: string | null // null = trả tại quầy khi nhận phòng
  holdMinutes: number
  errors: QuoteError[]
}

const round1000 = (n: number) => Math.round(n / 1000) * 1000

/** Phụ thu một đêm cho cả booking: người lớn vượt số khách cơ bản; trẻ ≥ FREE_CHILD_AGE vượt chỗ còn trống. */
export function extraFeePerNight(i: Pick<QuoteInput, 'rooms' | 'adults' | 'childAges' | 'roomType' | 'plan'>): number {
  const base = i.roomType.baseOccupancy * i.rooms
  const extraAdults = Math.max(0, i.adults - base)
  const spare = Math.max(0, base - i.adults)
  const extraChildren = Math.max(0, i.childAges.filter(a => a >= FREE_CHILD_AGE).length - spare)
  return extraAdults * i.plan.extraAdultFee + extraChildren * i.plan.extraChildFee
}

export function quote(i: QuoteInput): Quote {
  const errors: QuoteError[] = []
  const nights = nightsOf(i.checkin, i.checkout)
  const children = i.childAges.length
  if (!nights.length || i.rooms < 1 || i.rooms > MAX_ROOMS_PER_BOOKING || i.adults < i.rooms || i.childAges.some(a => !Number.isInteger(a) || a < 1 || a > 11)) errors.push({ code: 'INVALID_STAY' })
  if (!i.plan.active) errors.push({ code: 'PLAN_INACTIVE' })
  const rt = i.roomType
  if (i.adults > rt.maxAdults * i.rooms || children > rt.maxChildren * i.rooms || i.adults + children > rt.maxOccupancy * i.rooms) errors.push({ code: 'OVER_CAPACITY' })

  if (nights.length) { // khoảng ngày sai thì chỉ báo INVALID_STAY
    const stay = stayCheck(i.inventory, i.checkin, i.checkout)
    errors.push(...stay.issues)
    if (!stay.issues.length && stay.left < i.rooms) errors.push({ code: 'SOLD_OUT' })
  }

  const extra = extraFeePerNight(i)
  const lines: QuoteNight[] = []
  for (const date of nights) {
    const price = i.rates[date]
    if (price === undefined) { errors.push({ code: 'NO_RATE', date }); continue }
    lines.push({ date, price, extraFee: extra, total: price * i.rooms + extra })
  }
  const subtotal = lines.reduce((s, n) => s + n.total, 0)

  // Khuyến mãi: mọi đêm phải nằm trong khoảng lưu trú của mã; thời điểm đặt trong khoảng đặt; đủ số đêm tối thiểu.
  let discount = 0
  let promoCode: string | null = null
  const p = i.promotion
  if (p === 'NOT_FOUND') errors.push({ code: 'PROMO_NOT_FOUND' })
  else if (p === 'EXHAUSTED') errors.push({ code: 'PROMO_EXHAUSTED' })
  else if (p) {
    const ok = p.active && nights.length >= p.minNights
      && (!p.bookStart || i.now >= p.bookStart) && (!p.bookEnd || i.now <= p.bookEnd)
      && nights.every(d => (!p.stayStart || d >= p.stayStart) && (!p.stayEnd || d <= p.stayEnd))
    if (!ok) errors.push({ code: 'PROMO_NOT_APPLICABLE' })
    else {
      discount = Math.min(subtotal, p.type === 'PERCENT' ? round1000((subtotal * p.value) / 100) : p.value)
      promoCode = p.code
    }
  }

  const base = subtotal - discount
  const taxLines = i.taxFees.map(t => ({
    name: t.name,
    included: t.included,
    amount: t.type === 'PERCENT' ? round1000((base * t.value) / 100) : t.type === 'PER_NIGHT' ? t.value * nights.length * i.rooms : t.value,
  }))
  const taxFees = taxLines.filter(t => !t.included).reduce((s, t) => s + t.amount, 0)
  const total = base + taxFees

  const d = i.deposit
  const deposit = Math.min(total, d.type === 'PERCENT' ? round1000((total * d.value) / 100) : d.type === 'FIXED' ? d.value : d.type === 'FIRST_NIGHT' ? (lines[0]?.total ?? total) : total)

  return {
    nights: lines, subtotal, discount, promoCode, taxLines, taxFees, total,
    deposit, balanceDue: total - deposit,
    balanceDueAt: d.balanceDueDaysBefore > 0 && nights.length ? addDays(i.checkin, -d.balanceDueDaysBefore) : null,
    holdMinutes: d.holdMinutes,
    errors,
  }
}

// ---------- Huỷ ----------

export interface CancelPolicySnap { tiers: { daysBefore: number; penaltyPercent: number }[]; noShowPercent: number; refundable: boolean }

/**
 * Tiền phạt khi huỷ: gói không hoàn → 100%. Còn lại: mốc có daysBefore lớn nhất mà ≤ số ngày còn tới ngày đến.
 * noShow → noShowPercent. Mốc 0 ngày luôn có (admin bắt buộc) nên luôn khớp được một mốc.
 */
export function cancelPenalty(p: CancelPolicySnap, total: number, checkin: string, today: string, noShow = false): number {
  if (!p.refundable) return total
  const pct = noShow ? p.noShowPercent : ([...p.tiers].filter(t => t.daysBefore <= diffDays(today, checkin)).sort((a, b) => b.daysBefore - a.daysBefore)[0]?.penaltyPercent ?? 100)
  return Math.min(total, round1000((total * pct) / 100))
}

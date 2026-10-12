// Lệnh ghi của admin vào Postgres (POST /api/admin/db). zod kiểm ở server (src/api/pricing.ts); hook ở trình duyệt dùng chung kiểu.
// Không import gì của server. Tiền: số nguyên VND. Phần trăm: số nguyên. Ngày: 'YYYY-MM-DD'.
import { z } from 'zod'
import { diffDays } from './format'
import { MAX_RANGE_DAYS } from './pricing'

const id = z.string().trim().min(1).max(40)
const date = z.iso.date()
const money = z.int().min(0).max(1_000_000_000)
const weekdays = z.array(z.int().min(0).max(6)).max(7)
const text = (max = 200) => z.string().trim().min(1, 'Không được để trống').max(max)
const L = z.object({ vi: text(), en: z.string().trim().max(200).optional() })
const okRange = (r: { from: string; to: string }) => r.from <= r.to && diffDays(r.from, r.to) < MAX_RANGE_DAYS
const RANGE_MSG = { message: `Khoảng ngày sai (từ ≤ đến, tối đa ${MAX_RANGE_DAYS} ngày)` }

export const MEAL_PLANS = ['RO', 'BB', 'HB', 'FB', 'AI'] as const
export const DEPOSIT_TYPES = ['PERCENT', 'FIXED', 'FIRST_NIGHT', 'FULL'] as const

export const Command = z.discriminatedUnion('op', [
  /** Sửa hàng loạt lịch của MỘT hạng phòng: field bỏ trống = giữ nguyên. price null = xoá giá (ngừng bán đêm đó). */
  z.object({
    op: z.literal('bulk'),
    roomTypeId: id,
    ratePlanId: id.optional(), // bỏ trống = gói mặc định
    from: date, to: date, weekdays: weekdays.default([]),
    price: money.nullable().optional(),
    allotment: z.int().min(0).max(999).optional(),
    closed: z.boolean().optional(),
    minStay: z.int().min(1).max(60).optional(),
    maxStay: z.int().min(1).max(365).nullable().optional(), // null = bỏ giới hạn
    closedToArrival: z.boolean().optional(),
    closedToDeparture: z.boolean().optional(),
  }).refine(okRange, RANGE_MSG),
  /** Sinh DailyRate từ PricingRule + basePrice của gói, ghi đè các đêm tính được. */
  z.object({ op: z.literal('generate'), ratePlanId: id, from: date, to: date }).refine(okRange, RANGE_MSG),
  z.object({
    op: z.literal('rule.create'),
    ratePlanId: id, name: text(80),
    startDate: date, endDate: date, weekdays: weekdays.default([]),
    type: z.enum(['FIXED', 'PERCENT']),
    value: z.int().min(-100).max(1_000_000_000),
    priority: z.int().min(0).max(100).default(0),
  }).refine(r => okRange({ from: r.startDate, to: r.endDate }), RANGE_MSG)
    .refine(r => r.type === 'PERCENT' ? r.value <= 1000 : r.value >= 0, { message: 'PERCENT: -100…1000 · FIXED: giá ≥ 0' }),
  z.object({ op: z.literal('rule.delete'), id }),
  z.object({
    op: z.literal('plan.save'),
    id: id.optional(), // bỏ trống = tạo mới
    roomTypeId: id,
    code: z.string().trim().regex(/^[A-Z0-9_-]{1,20}$/, 'Mã: chữ in hoa, số, - _ (tối đa 20)'),
    name: L,
    mealPlan: z.enum(MEAL_PLANS),
    refundable: z.boolean(),
    basePrice: money.nullable(),
    extraAdultFee: money,
    extraChildFee: money,
    cancellationPolicyId: id,
    depositPolicyId: id,
    isDefault: z.boolean(),
    active: z.boolean(),
  }),
  z.object({ op: z.literal('plan.delete'), id }),
  z.object({
    op: z.literal('cancel.save'),
    id: id.optional(),
    name: text(120),
    description: L.optional(),
    tiers: z.array(z.object({ daysBefore: z.int().min(0).max(365), penaltyPercent: z.int().min(0).max(100) })).min(1).max(10)
      .refine(t => t.some(x => x.daysBefore === 0), { message: 'Cần một mốc "≥ 0 ngày" (huỷ sát ngày đến phạt bao nhiêu)' })
      .refine(t => new Set(t.map(x => x.daysBefore)).size === t.length, { message: 'Hai mốc trùng số ngày' }),
    noShowPercent: z.int().min(0).max(100),
  }),
  z.object({ op: z.literal('cancel.delete'), id }),
  z.object({
    op: z.literal('deposit.save'),
    id: id.optional(),
    name: text(120),
    type: z.enum(DEPOSIT_TYPES),
    value: z.int().min(0).max(1_000_000_000),
    holdMinutes: z.int().min(5).max(120),
    balanceDueDaysBefore: z.int().min(0).max(60),
  }).refine(d => d.type !== 'PERCENT' || d.value <= 100, { message: 'Cọc %: 0…100' }),
  z.object({ op: z.literal('deposit.delete'), id }),
])

export type Command = z.input<typeof Command>
export type ParsedCommand = z.output<typeof Command>

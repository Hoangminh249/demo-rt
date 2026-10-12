// Kiểm src/lib/quote.ts — hàm thuần, KHÔNG cần DB. Chạy: yarn check:quote
import assert from 'node:assert/strict'
import { cancelPenalty, quote, type QuoteInput } from '../src/lib/quote'
import type { InventoryDay } from '../src/lib/inventory'

const inv = (date: string, o: Partial<InventoryDay> = {}): InventoryDay =>
  ({ date, allotment: 2, booked: 0, held: 0, closed: false, minStay: 1, maxStay: null, closedToArrival: false, closedToDeparture: false, ...o })
const D = ['2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07'] // T4 → T7 (ngày đi)
const now = new Date('2026-10-12T03:00:00Z')

const base: QuoteInput = {
  checkin: D[0], checkout: D[3], rooms: 1, adults: 2, childAges: [],
  roomType: { maxAdults: 3, maxChildren: 1, maxOccupancy: 3, baseOccupancy: 2 },
  plan: { refundable: true, extraAdultFee: 300_000, extraChildFee: 150_000, active: true },
  inventory: D.map(d => inv(d)),
  rates: { [D[0]]: 2_000_000, [D[1]]: 2_500_000, [D[2]]: 3_000_000 },
  promotion: null,
  taxFees: [{ name: 'VAT + phí phục vụ', type: 'PERCENT', value: 8, included: true }],
  deposit: { type: 'PERCENT', value: 30, holdMinutes: 15, balanceDueDaysBefore: 0 },
  now,
}
const codes = (i: QuoteInput) => quote(i).errors.map(e => e.code)

// 1. 3 đêm giá khác nhau + phụ thu + khuyến mãi → đúng tổng, đúng cọc
{
  const q = quote({
    ...base, adults: 3,
    promotion: { code: 'THU10', type: 'PERCENT', value: 10, minNights: 2, bookStart: null, bookEnd: null, stayStart: '2026-11-01', stayEnd: '2026-11-30', active: true },
  })
  assert.deepEqual(q.errors, [])
  assert.deepEqual(q.nights.map(n => n.total), [2_300_000, 2_800_000, 3_300_000], 'người lớn thứ 3: +300.000/đêm')
  assert.equal(q.subtotal, 8_400_000)
  assert.equal(q.discount, 840_000, 'giảm 10%')
  assert.equal(q.taxFees, 0, 'VAT đã gồm trong giá → không cộng')
  assert.equal(q.total, 7_560_000)
  assert.equal(q.deposit, 2_268_000, 'cọc 30%')
  assert.equal(q.balanceDue, 5_292_000)
  assert.equal(q.balanceDueAt, null, 'trả tại quầy')
  assert.equal(q.holdMinutes, 15)
}
// 1b. thuế cộng thêm, phí theo đêm, trẻ em, cọc đêm đầu, 2 phòng
{
  const q = quote({
    ...base, rooms: 2, adults: 3, childAges: [4, 8],
    roomType: { ...base.roomType, maxChildren: 1 },
    taxFees: [{ name: 'VAT', type: 'PERCENT', value: 8, included: false }, { name: 'Phí đảo', type: 'PER_NIGHT', value: 50_000, included: false }],
    deposit: { type: 'FIRST_NIGHT', value: 0, holdMinutes: 15, balanceDueDaysBefore: 3 },
  })
  assert.deepEqual(q.errors, [])
  assert.equal(q.nights[0].extraFee, 0, '2 phòng = 4 chỗ cơ bản: 3 NL + 1 trẻ ≥ 6 tuổi vừa đủ; trẻ 4 tuổi miễn')
  assert.equal(q.subtotal, 15_000_000)
  assert.equal(q.taxFees, 1_200_000 + 300_000, 'VAT 8% + 50.000 × 3 đêm × 2 phòng')
  assert.equal(q.total, 16_500_000)
  assert.equal(q.deposit, 4_000_000, 'cọc = tiền đêm đầu')
  assert.equal(q.balanceDueAt, '2026-11-01', 'trả nốt trước 3 ngày')
}
// 1c. khuyến mãi không áp được / không có / hết lượt / giảm cố định không vượt tổng
assert.deepEqual(codes({ ...base, promotion: { code: 'X', type: 'FIXED', value: 1, minNights: 4, bookStart: null, bookEnd: null, stayStart: null, stayEnd: null, active: true } }), ['PROMO_NOT_APPLICABLE'], 'thiếu số đêm tối thiểu')
assert.deepEqual(codes({ ...base, promotion: { code: 'X', type: 'FIXED', value: 1, minNights: 1, bookStart: null, bookEnd: null, stayStart: '2026-11-05', stayEnd: null, active: true } }), ['PROMO_NOT_APPLICABLE'], 'một đêm ngoài khoảng lưu trú')
assert.deepEqual(codes({ ...base, promotion: { code: 'X', type: 'FIXED', value: 1, minNights: 1, bookStart: null, bookEnd: new Date('2026-10-01'), stayStart: null, stayEnd: null, active: true } }), ['PROMO_NOT_APPLICABLE'], 'hết hạn đặt')
assert.deepEqual(codes({ ...base, promotion: 'NOT_FOUND' }), ['PROMO_NOT_FOUND'])
assert.deepEqual(codes({ ...base, promotion: 'EXHAUSTED' }), ['PROMO_EXHAUSTED'])
assert.equal(quote({ ...base, promotion: { code: 'X', type: 'FIXED', value: 99_000_000, minNights: 1, bookStart: null, bookEnd: null, stayStart: null, stayEnd: null, active: true } }).total, 0, 'giảm cố định không làm tổng âm')

// 2. thiếu DailyRate một đêm → không bán
assert.deepEqual(quote({ ...base, rates: { [D[0]]: 2_000_000, [D[2]]: 3_000_000 } }).errors, [{ code: 'NO_RATE', date: D[1] }])
// thiếu DailyInventory một đêm → không bán
assert.deepEqual(quote({ ...base, inventory: [inv(D[0]), inv(D[2]), inv(D[3])] }).errors, [{ code: 'NO_INVENTORY', date: D[1] }])

// 3. minStay / maxStay / CTA / CTD / đóng / hết phòng / sức chứa
assert.deepEqual(codes({ ...base, inventory: [inv(D[0], { minStay: 4 }), inv(D[1]), inv(D[2]), inv(D[3])] }), ['MIN_STAY'])
assert.deepEqual(codes({ ...base, inventory: [inv(D[0]), inv(D[1], { minStay: 4 }), inv(D[2]), inv(D[3])] }), [], 'minStay chỉ xét ngày đến')
assert.deepEqual(codes({ ...base, inventory: [inv(D[0], { maxStay: 2 }), inv(D[1]), inv(D[2]), inv(D[3])] }), ['MAX_STAY'])
assert.deepEqual(codes({ ...base, inventory: [inv(D[0], { closedToArrival: true }), inv(D[1]), inv(D[2]), inv(D[3])] }), ['CLOSED_TO_ARRIVAL'])
assert.deepEqual(codes({ ...base, inventory: [inv(D[0]), inv(D[1], { closedToArrival: true }), inv(D[2]), inv(D[3])] }), [], 'CTA giữa kỳ không chặn')
assert.deepEqual(codes({ ...base, inventory: [inv(D[0]), inv(D[1]), inv(D[2]), inv(D[3], { closedToDeparture: true })] }), ['CLOSED_TO_DEPARTURE'])
assert.deepEqual(codes({ ...base, inventory: [inv(D[0], { closedToDeparture: true }), inv(D[1]), inv(D[2]), inv(D[3])] }), [], 'CTD chỉ xét ngày đi')
assert.deepEqual(codes({ ...base, inventory: [inv(D[0]), inv(D[1], { closed: true }), inv(D[2]), inv(D[3])] }), ['CLOSED'])
assert.deepEqual(codes({ ...base, rooms: 2, inventory: [inv(D[0]), inv(D[1], { held: 1 }), inv(D[2]), inv(D[3])], adults: 2 }), ['SOLD_OUT'], 'đêm giữa chỉ còn 1 phòng')
assert.deepEqual(codes({ ...base, adults: 4 }), ['OVER_CAPACITY'])
assert.deepEqual(codes({ ...base, childAges: [3, 5] }), ['OVER_CAPACITY'], 'tối đa 1 trẻ / phòng')
assert.deepEqual(codes({ ...base, checkout: D[0] }), ['INVALID_STAY'])
assert.deepEqual(codes({ ...base, plan: { ...base.plan, active: false } }), ['PLAN_INACTIVE'])

// 4. huỷ trong / ngoài mốc → phạt đúng (PITO: ≥ 7 ngày 50%, < 7 ngày 100%)
const pito = { tiers: [{ daysBefore: 7, penaltyPercent: 50 }, { daysBefore: 0, penaltyPercent: 100 }], noShowPercent: 100, refundable: true }
assert.equal(cancelPenalty(pito, 6_000_000, '2026-11-04', '2026-10-28'), 3_000_000, 'còn đúng 7 ngày → 50%')
assert.equal(cancelPenalty(pito, 6_000_000, '2026-11-04', '2026-10-29'), 6_000_000, 'còn 6 ngày → 100%')
assert.equal(cancelPenalty(pito, 6_000_000, '2026-11-04', '2026-10-01'), 3_000_000, 'còn 34 ngày → vẫn mốc 7 ngày')
const free = { tiers: [{ daysBefore: 14, penaltyPercent: 0 }, { daysBefore: 3, penaltyPercent: 30 }, { daysBefore: 0, penaltyPercent: 100 }], noShowPercent: 100, refundable: true }
assert.equal(cancelPenalty(free, 6_000_000, '2026-11-04', '2026-10-21'), 0, '≥ 14 ngày: miễn phí')
assert.equal(cancelPenalty(free, 6_000_000, '2026-11-04', '2026-10-25'), 1_800_000, '10 ngày → mốc 3 ngày 30%')
assert.equal(cancelPenalty(free, 6_000_000, '2026-11-04', '2026-11-04'), 6_000_000, 'ngày đến → 100%')
assert.equal(cancelPenalty({ ...free, refundable: false }, 6_000_000, '2026-11-04', '2026-10-01'), 6_000_000, 'gói không hoàn')
assert.equal(cancelPenalty(free, 6_000_000, '2026-11-04', '2026-11-05', true), 6_000_000, 'không đến')

console.log('check:quote ok')

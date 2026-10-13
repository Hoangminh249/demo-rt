// Kiểm logic thuần (không gọi API, không cần Next). Chạy: yarn test
import assert from 'node:assert/strict'
import { defaultStay, parseStay, validRange } from '../src/lib/stay'
import { mergeRooms, priceRuns } from '../src/lib/rooms'
import { bookingCode, isEmail, isPhone, roomHref, selectionQuery } from '../src/lib/booking'
import { nightsOf, planOffers, roomsLeft, type InventoryDay } from '../src/lib/inventory'
import { datesIn, priceFromRules, weekdayOf, type Rule } from '../src/lib/pricing'
import type { Room, RoomAvailability } from '../src/types/hotel'

// --- validRange: chặn ở route handler ---
const now = '2026-10-07'
assert.equal(validRange('2026-10-08', '2026-10-10', now), true)
assert.equal(validRange('2026-10-06', '2026-10-08', now), true, 'cho lùi 1 ngày vì lệch đồng hồ qua nửa đêm')
assert.equal(validRange('2026-10-05', '2026-10-08', now), false, 'ngày đã qua')
assert.equal(validRange('2026-10-08', '2026-10-08', now), false, '0 đêm')
assert.equal(validRange('2026-10-08', '2026-11-07', now), true, '30 đêm')
assert.equal(validRange('2026-10-08', '2026-11-08', now), false, 'tối đa 30 đêm')
assert.equal(validRange('2027-10-09', '2027-10-10', now), false, 'quá 365 ngày tới')
assert.equal(validRange('2026-02-30', '2026-03-02', now), false, 'ngày không có thật')
assert.equal(validRange(null, '2026-10-10', now), false)
assert.equal(validRange('2026-12-19', '2026-12-21', now, '2026-12-20'), false, 'trước ngày khai trương')
assert.equal(validRange('2026-12-20', '2026-12-22', now, '2026-12-20'), true)
assert.deepEqual(defaultStay(now), { checkin: '2026-10-08', checkout: '2026-10-10', adults: 2, children: 0, ages: [] })
assert.deepEqual(defaultStay(now, '2026-12-20'), { checkin: '2026-12-20', checkout: '2026-12-22', adults: 2, children: 0, ages: [] })

// --- tuổi trẻ em trên URL (?ag=): 1–11, sai hoặc thiếu = 0 (chưa chọn), luôn đủ số trẻ ---
const sp = (q: string) => new URLSearchParams(q)
assert.deepEqual(parseStay(sp('c=3&ag=4,x,12')).ages, [4, 0, 0])
assert.deepEqual(parseStay(sp('c=1')).ages, [0])
assert.deepEqual(parseStay(sp('c=0&ag=5')).ages, [])

// --- mergeRooms: ghép nội dung phòng với phòng trống theo room_type_id ---
const room = (slug: string, id: string): Room => ({ room_type_id: id, slug, name: slug, size: '', features: [], description: '', images: [] })
const plan = { rate_plan_id: 'p1', title: 'Bao gồm ăn sáng', has_breakfast: true, days_breakdown: [{ day: '2026-10-08', price: 2_500_000 }, { day: '2026-10-09', price: 2_700_000 }], total: 5_200_000 }
const avail = (id: string, quantity: number, adults: number, children: number, plans = [plan]): RoomAvailability =>
  ({ room_type_id: id, title: id, quantity, occ_adults: adults, occ_children: children, occ_infants: 0, plans })
const rooms = [room('a', 'rt1'), room('b', 'rt2'), room('c', 'rt9'), room('d', 'rt4'), room('e', 'rt5'), room('f', 'rt6')]
const list = [avail('rt1', 2, 2, 1), avail('rt2', 0, 2, 1), avail('rt3', 5, 2, 1), avail('rt5', 1, 2, 1, []), avail('rt6', 1, 0, 0)]
const state = (adults: number, children: number) => Object.fromEntries(mergeRooms(rooms, list, { adults, children }).map(o => [o.room.slug, o.state]))
assert.deepEqual(state(2, 0), { a: 'available', b: 'sold_out', c: 'unmapped', d: 'unmapped', e: 'no_rates', f: 'available' })
assert.equal(state(3, 0).a, 'too_small', 'quá số người lớn')
assert.equal(state(2, 2).a, 'too_small', 'quá số trẻ em')
assert.equal(state(5, 3).f, 'available', 'không khai sức chứa (0) thì không chặn')
assert.equal(state(3, 0).b, 'sold_out', 'hết phòng ưu tiên hơn không đủ chỗ')

// --- đặt phòng: mã, URL, kiểm form ---
assert.equal(bookingCode('PITO', '2026-10-08', 42), 'RH-PITO-261008-0042')
assert.equal(bookingCode('CALISTA', '2027-01-02', 123456), 'RH-CALISTA-270102-3456', 'seq tối đa 4 số')
assert.equal(selectionQuery({ hotel: 'pito-hon-thom', room: 'superior', plan: 'p 1' }, defaultStay(now)), 'hotel=pito-hon-thom&room=superior&plan=p+1&in=2026-10-08&out=2026-10-10&a=2&c=0')
assert.equal(roomHref('pito-hon-thom', 'superior'), '/hotel/pito-hon-thom?room=superior#phong')
assert.equal(roomHref('pito-hon-thom', 'superior', { ...defaultStay(now), children: 2, ages: [4] }, 'p1'), '/hotel/pito-hon-thom?room=superior&plan=p1&in=2026-10-08&out=2026-10-10&a=2&c=2&ag=4%2C#phong', 'tuổi chưa chọn để trống')
assert.equal(isEmail('minh.anh@example.com'), true)
assert.equal(isEmail('minh.anh@example'), false)
assert.equal(isPhone('+84 912 345 678'), true)
assert.equal(isPhone('0912'), false)

// --- tồn + giá của Rooty (nguồn db) ---
const inv = (date: string, o: Partial<InventoryDay> = {}): InventoryDay =>
  ({ date, allotment: 2, booked: 0, held: 0, closed: false, minStay: 1, maxStay: null, closedToArrival: false, closedToDeparture: false, ...o })
const week = ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04']
assert.deepEqual(nightsOf('2026-11-01', '2026-11-04'), week.slice(0, 3), 'đêm = [nhận, trả)')
assert.equal(roomsLeft(week.map(d => inv(d)), '2026-11-01', '2026-11-04'), 2)
assert.equal(roomsLeft([inv(week[0]), inv(week[1], { booked: 1, held: 1 }), inv(week[2])], '2026-11-01', '2026-11-04'), 0, 'một đêm hết → cả khoảng hết')
assert.equal(roomsLeft([inv(week[0]), inv(week[1], { held: 1 }), inv(week[2])], '2026-11-01', '2026-11-04'), 1, 'lấy đêm ít phòng nhất')
assert.equal(roomsLeft([inv(week[0]), inv(week[2])], '2026-11-01', '2026-11-04'), 0, 'thiếu dòng tồn một đêm → không bán')
assert.equal(roomsLeft([inv(week[0]), inv(week[1], { closed: true }), inv(week[2])], '2026-11-01', '2026-11-04'), 0, 'đêm đóng')
assert.equal(roomsLeft([inv(week[0], { minStay: 4 }), inv(week[1]), inv(week[2])], '2026-11-01', '2026-11-04'), 0, 'minStay của ngày đến')
assert.equal(roomsLeft([inv(week[0]), inv(week[1], { minStay: 4 }), inv(week[2])], '2026-11-01', '2026-11-04'), 2, 'minStay chỉ xét ngày đến')
assert.equal(roomsLeft([inv(week[0], { maxStay: 2 }), inv(week[1]), inv(week[2])], '2026-11-01', '2026-11-04'), 0, 'maxStay')
assert.equal(roomsLeft([inv(week[0], { closedToArrival: true }), inv(week[1]), inv(week[2])], '2026-11-01', '2026-11-04'), 0, 'CTA ngày đến')
assert.equal(roomsLeft([...week.slice(0, 3).map(d => inv(d)), inv(week[3], { closedToDeparture: true })], '2026-11-01', '2026-11-04'), 0, 'CTD ngày đi')
assert.equal(roomsLeft([inv(week[0], { closedToDeparture: true }), inv(week[1]), inv(week[2])], '2026-11-01', '2026-11-04'), 2, 'CTD chỉ xét ngày đi')
assert.equal(roomsLeft(week.map(d => inv(d, { allotment: 1, booked: 2 })), '2026-11-01', '2026-11-04'), 0, 'bán quá (admin giảm allotment) → 0, không âm')
const ratePlan = (id: string, rates: Record<string, number>) => ({ id, title: id, has_breakfast: true, rates })
const offers = planOffers([ratePlan('bb', { [week[0]]: 2_000_000, [week[1]]: 2_500_000, [week[2]]: 3_000_000 }), ratePlan('ro', { [week[0]]: 1_000_000, [week[2]]: 1_000_000 })], '2026-11-01', '2026-11-04')
assert.equal(offers.length, 1, 'gói thiếu giá một đêm → không bán')
assert.equal(offers[0].total, 7_500_000)
assert.deepEqual(offers[0].days_breakdown.map(d => d.price), [2_000_000, 2_500_000, 3_000_000])

// --- admin: chọn ngày + sinh giá từ PricingRule ---
assert.equal(weekdayOf('2026-10-12'), 1, '12/10/2026 là thứ Hai')
assert.deepEqual(datesIn('2026-10-12', '2026-10-14'), ['2026-10-12', '2026-10-13', '2026-10-14'], 'gồm cả ngày cuối')
assert.deepEqual(datesIn('2026-10-12', '2026-10-25', [5, 6]), ['2026-10-16', '2026-10-17', '2026-10-23', '2026-10-24'], 'T6 + T7')
assert.deepEqual(datesIn('2026-10-14', '2026-10-12'), [], 'khoảng ngược')
const rules: Rule[] = [
  { startDate: '2026-10-01', endDate: '2026-12-31', weekdays: [5, 6], type: 'PERCENT', value: 20, priority: 1 },
  { startDate: '2026-12-24', endDate: '2026-12-31', weekdays: [], type: 'FIXED', value: 3_500_000, priority: 5 },
  { startDate: '2026-10-01', endDate: '2026-12-31', weekdays: [], type: 'PERCENT', value: -10, priority: 0 },
]
assert.equal(priceFromRules(rules, 2_720_000, '2026-10-13'), 2_448_000, 'ngày thường: -10%')
assert.equal(priceFromRules(rules, 2_720_000, '2026-10-16'), 3_264_000, 'T6: +20% (priority cao hơn -10%)')
assert.equal(priceFromRules(rules, 2_720_000, '2026-12-26'), 3_500_000, 'lễ: giá cố định thắng')
assert.equal(priceFromRules(rules, 2_720_000, '2027-01-05'), 2_720_000, 'ngoài mọi rule → basePrice')
assert.equal(priceFromRules(rules, null, '2027-01-05'), null, 'không rule, không basePrice → không ghi')
assert.equal(priceFromRules(rules, null, '2026-10-13'), null, 'PERCENT thiếu basePrice → không ghi')
assert.equal(priceFromRules(rules, null, '2026-12-26'), 3_500_000, 'FIXED không cần basePrice')
assert.equal(priceFromRules([{ ...rules[0], type: 'PERCENT', value: -150, weekdays: [] }], 1_000_000, '2026-10-13'), 0, 'không ra giá âm')

// --- priceRuns: gộp đêm liền nhau cùng giá ---
assert.deepEqual(priceRuns([{ day: '2026-10-12', price: 3_500_000 }, { day: '2026-10-13', price: 3_500_000 }, { day: '2026-10-14', price: 4_000_000 }, { day: '2026-10-15', price: 3_500_000 }]), [
  { from: '2026-10-12', to: '2026-10-13', price: 3_500_000, nights: 2 },
  { from: '2026-10-14', to: '2026-10-14', price: 4_000_000, nights: 1 },
  { from: '2026-10-15', to: '2026-10-15', price: 3_500_000, nights: 1 },
], 'cùng giá nhưng không liền nhau → dòng riêng')
assert.deepEqual(priceRuns([]), [])

console.log('check: ok')

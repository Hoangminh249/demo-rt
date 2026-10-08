// Kiểm logic thuần của phần tích hợp Gohost (không gọi API, không cần Next). Chạy: yarn test
import assert from 'node:assert/strict'
import { defaultStay, validRange } from '../src/lib/stay'
import { mergeRooms, minDefaultRate, nightly } from '../src/lib/rooms'
import { bookingCode, deposit, isEmail, isPhone, roomHref, selectionQuery } from '../src/lib/booking'
import type { Room, RoomAvailability } from '../src/lib/types'

// --- validRange: chặn ở route handler trước khi tốn lượt gọi Gohost ---
const now = '2026-10-07'
assert.equal(validRange('2026-10-08', '2026-10-10', now), true)
assert.equal(validRange('2026-10-06', '2026-10-08', now), true, 'cho lùi 1 ngày vì lệch đồng hồ qua nửa đêm')
assert.equal(validRange('2026-10-05', '2026-10-08', now), false, 'ngày đã qua')
assert.equal(validRange('2026-10-08', '2026-10-08', now), false, '0 đêm')
assert.equal(validRange('2026-10-08', '2026-11-07', now), true, '30 đêm')
assert.equal(validRange('2026-10-08', '2026-11-08', now), false, '31 đêm — Gohost chỉ cho 30')
assert.equal(validRange('2027-10-09', '2027-10-10', now), false, 'quá 365 ngày tới')
assert.equal(validRange('2026-02-30', '2026-03-02', now), false, 'ngày không có thật')
assert.equal(validRange(null, '2026-10-10', now), false)
assert.equal(validRange('2026-12-19', '2026-12-21', now, '2026-12-20'), false, 'trước ngày khai trương')
assert.equal(validRange('2026-12-20', '2026-12-22', now, '2026-12-20'), true)
assert.deepEqual(defaultStay(now), { checkin: '2026-10-08', checkout: '2026-10-10', adults: 2, children: 0 })
assert.deepEqual(defaultStay(now, '2026-12-20'), { checkin: '2026-12-20', checkout: '2026-12-22', adults: 2, children: 0 })

// --- mergeRooms: ghép nội dung Rooty với kết quả Gohost theo room_type_id ---
const room = (slug: string, id: string | null): Room => ({ room_type_id: id, slug, name: slug, size: '', features: [], description: '', images: [] })
const plan = { rate_plan_id: 'p1', title: 'Bao gồm ăn sáng', has_breakfast: true, days_breakdown: [{ day: '2026-10-08', price: 2_500_000 }, { day: '2026-10-09', price: 2_700_000 }], total: 5_200_000 }
const avail = (id: string, quantity: number, adults: number, children: number, plans = [plan]): RoomAvailability =>
  ({ room_type_id: id, title: id, quantity, occ_adults: adults, occ_children: children, occ_infants: 0, plans })
const rooms = [room('a', 'rt1'), room('b', 'rt2'), room('c', null), room('d', 'rt4'), room('e', 'rt5'), room('f', 'rt6')]
const list = [avail('rt1', 2, 2, 1), avail('rt2', 0, 2, 1), avail('rt3', 5, 2, 1), avail('rt5', 1, 2, 1, []), avail('rt6', 1, 0, 0)]
const state = (adults: number, children: number) => Object.fromEntries(mergeRooms(rooms, list, { adults, children }).map(o => [o.room.slug, o.state]))
assert.deepEqual(state(2, 0), { a: 'available', b: 'sold_out', c: 'unmapped', d: 'unmapped', e: 'no_rates', f: 'available' })
assert.equal(state(3, 0).a, 'too_small', 'quá số người lớn')
assert.equal(state(2, 2).a, 'too_small', 'quá số trẻ em')
assert.equal(state(5, 3).f, 'available', 'Gohost không khai sức chứa (0) thì không chặn')
assert.equal(state(3, 0).b, 'sold_out', 'hết phòng ưu tiên hơn không đủ chỗ')
assert.equal(nightly(plan), 2_600_000)

// --- minDefaultRate: "Giá từ" chỉ tính hạng phòng thật, đã ánh xạ, tiền VND, giá > 0 ---
const rt = (id: string, is_virtual: boolean, currency: string, default_rates: number[]) => ({ id, is_virtual, rate_plans: [{ currency, default_rates }] })
const catalog = [rt('rt1', false, 'VND', [2_700_000, 2_500_000, 0, 2_900_000]), rt('rt2', true, 'VND', [100]), rt('rt3', false, 'VND', [50]), rt('rt7', false, 'USD', [10])]
assert.equal(minDefaultRate(catalog, new Set(['rt1', 'rt2', 'rt7'])), 2_500_000)
assert.equal(minDefaultRate(catalog, new Set()), null, 'chưa ánh xạ phòng nào → không hiện giá')

// --- luồng đặt phòng (minh hoạ) ---
assert.equal(deposit(5_280_000), 1_584_000)
assert.equal(deposit(1_234_567), 370_000, 'làm tròn nghìn đồng')
assert.equal(bookingCode('PITO', '2026-10-08', 42), 'RH-PITO-261008-0042')
assert.equal(bookingCode('CALISTA', '2027-01-02', 123456), 'RH-CALISTA-270102-3456', 'seq tối đa 4 số')
assert.equal(selectionQuery({ hotel: 'pito-hon-thom', room: 'superior', plan: 'p 1' }, defaultStay(now)), 'hotel=pito-hon-thom&room=superior&plan=p+1&in=2026-10-08&out=2026-10-10&a=2&c=0')
assert.equal(roomHref('pito-hon-thom', 'superior'), '/hotel/pito-hon-thom/superior')
assert.equal(isEmail('minh.anh@example.com'), true)
assert.equal(isEmail('minh.anh@example'), false)
assert.equal(isPhone('+84 912 345 678'), true)
assert.equal(isPhone('0912'), false)

console.log('check: ok')

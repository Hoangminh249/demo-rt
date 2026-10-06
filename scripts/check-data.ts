// Kiểm tra dữ liệu seed tái hiện đúng các ví dụ trong PDF v4. Chạy: yarn check-data
import assert from 'node:assert/strict'
import { generateBookings } from '../src/data/bookings'
import { ROOM_TYPES } from '../src/data/hotels'
import { CUSTOMERS } from '../src/data/commerce'
import { buildSoldIndex, cell, availability } from '../src/lib/inventory'
import { kpis } from '../src/lib/metrics'
import { diffDays } from '../src/lib/format'
import { parseRequest, SAMPLE_PROMPTS } from '../src/lib/ai-parse'

const t0 = Date.now()
const bookings = generateBookings()
const ms = Date.now() - t0
const idx = buildSoldIndex(bookings)
const rt = (id: string) => ROOM_TYPES.find(r => r.room_type_id === id)!
const none = new Set<string>()

const sep = kpis(bookings, ROOM_TYPES, { from: '2026-09-01', to: '2026-09-30' })
console.log(`${bookings.length} booking, sinh trong ${ms}ms`)
console.log({
  booking: sep.bookings, roomNights: sep.roomNights, revenueTy: +(sep.revenue / 1e9).toFixed(2),
  occupancy: +sep.occupancy.toFixed(3), adrTrieu: +(sep.adr / 1e6).toFixed(2),
  direct: +sep.direct.toFixed(3), agent: +sep.agent.toFixed(3), ota: +sep.ota.toFixed(3), cancel: +sep.cancellation.toFixed(3),
})

const c = cell(idx, rt('RT-PITO-DOV'), '2026-10-20', none)
assert.deepEqual([c.website, c.agent, c.ota, c.offline, c.left], [7, 5, 8, 3, 7], 'Tồn 20/10 phải là 7·5·8·3 → còn 7')
assert.equal(availability(idx, rt('RT-PITO-DOV'), '2026-10-12', '2026-10-15', none), 3, '12–15/10 còn 3 phòng')
assert.equal(availability(idx, rt('RT-PITO-FOV'), '2026-10-20', '2026-10-23', none), 2, 'Family OV 20–23/10 còn 2')
assert.equal(availability(idx, rt('RT-CAL-FS'), '2026-10-20', '2026-10-23', none), 3, 'Calista Family Suite 20–23/10 còn 3')

const nva = bookings.filter(b => b.customer_id === CUSTOMERS[0].id && b.status !== 'cancelled')
assert.equal(nva.length, 4)
assert.equal(nva.reduce((s, b) => s + diffDays(b.checkin_date, b.checkout_date), 0), 11)
assert.equal(nva.reduce((s, b) => s + b.total, 0), 42_000_000)
assert.equal(nva.map(b => b.checkout_date).sort().at(-1), '2026-09-05')

const near = (v: number, target: number, tol: number, label: string) => assert.ok(Math.abs(v - target) <= tol, `${label}: ${v} lệch xa ${target}`)
near(sep.bookings, 1284, 90, 'Booking 09/2026')
near(sep.roomNights, 3421, 150, 'Room nights')
near(sep.revenue / 1e9, 8.4, 0.4, 'Doanh thu (tỷ)')
near(sep.occupancy, 0.76, 0.03, 'Occupancy')
near(sep.adr / 1e6, 2.45, 0.12, 'ADR (triệu)')
near(sep.direct, 0.38, 0.03, 'Direct'); near(sep.agent, 0.26, 0.03, 'Agent'); near(sep.ota, 0.36, 0.03, 'OTA')
near(sep.cancellation, 0.074, 0.015, 'Huỷ')

// cùng seed → cùng dữ liệu
assert.equal(JSON.stringify(generateBookings().slice(0, 50)), JSON.stringify(bookings.slice(0, 50)))
console.log('OK — dữ liệu khớp ví dụ PDF')

// AI parser — câu mẫu PDF §9
const it = parseRequest(SAMPLE_PROMPTS[0])
assert.deepEqual([it.checkin, it.checkout, it.adults, it.children, it.budget], ['2026-10-20', '2026-10-23', 2, 2, 10_000_000])
assert.ok(it.tags.includes('gan-bien') && it.tags.includes('ho-boi'))
const it4 = parseRequest(SAMPLE_PROMPTS[3])
assert.deepEqual([it4.checkin, it4.checkout, it4.adults, it4.budgetPerNight, it4.area], ['2026-11-15', '2026-11-17', 2, 2_000_000, 'trung-tam'])
assert.equal(parseRequest('20/10, 3 đêm, hai người lớn').checkout, '2026-10-23')
assert.equal(parseRequest('xin chào').tags.length, 0)
console.log('OK — AI parser')

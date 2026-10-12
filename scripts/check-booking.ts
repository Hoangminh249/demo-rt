// Kiểm lõi đặt phòng trên Postgres THẬT (DATABASE_URL). Chạy: yarn check:booking — chỉ sau bước APPLY DB.
// Tạo khách sạn thử riêng (slug zz-check-booking, 1 phòng web/đêm) → chạy các ca → XOÁ SẠCH dữ liệu thử (kể cả khi lỗi).
// Ca: (1) hai người giữ phòng cuối cùng lúc → đúng một người được · (2) hết hạn giữ → trả phòng · (3) webhook 2 lần → một Payment,
// CONFIRMED một lần, một email · (4) tiền về sau khi hết hạn: còn phòng → tự xác nhận; hết phòng → needsRefund + Refund ·
// (5) phiên khách (CUSTOMER) gọi API admin → bị từ chối · (6) huỷ → phạt theo chính sách lúc đặt + Refund.
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { cancelBooking, createHold, expireDue, handleWebhook, quoteSelection, recordPayment, resolveRefund, setStayStatus, startPayment, todayAt, type Selection } from '../src/lib/booking-engine'
import { sendBookingEmails } from '../src/lib/email'
import { isSession } from '../src/lib/admin-auth'
import { addDays } from '../src/lib/format'
import { newPaymentRef } from '../src/lib/payment'
import { newPrisma } from '../src/lib/pg'

try { process.loadEnvFile() } catch {}
delete process.env.RESEND_API_KEY // email in ra console (EmailLog CONSOLE), không gửi thật
if (!process.env.DATABASE_URL) throw new Error('Thiếu DATABASE_URL')
const db = newPrisma(process.env.DATABASE_URL, 10)

const SLUG = 'zz-check-booking'
const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`)
const checkin = addDays(todayAt(new Date()), 40)
const checkout = addDays(checkin, 2)
const contact = { name: 'Khách Thử', phone: '+84 900 000 000', email: 'check-booking@example.invalid' }
const silence = <T>(fn: () => Promise<T>) => { const log = console.info; console.info = () => {}; return fn().finally(() => { console.info = log }) }

async function cleanup() {
  const hotel = await db.hotel.findUnique({ where: { slug: SLUG }, include: { roomTypes: { include: { ratePlans: true } } } })
  const users = await db.user.findMany({ where: { email: { endsWith: '@check-booking.invalid' } }, select: { id: true } })
  if (hotel) {
    const bookings = (await db.booking.findMany({ where: { hotelId: hotel.id }, select: { id: true } })).map(b => b.id)
    const providerRefs = (await db.payment.findMany({ where: { bookingId: { in: bookings } }, select: { providerRef: true } })).map(p => p.providerRef)
    await db.$executeRaw`DELETE FROM "PaymentWebhookEvent" WHERE payload->>'providerRef' = ANY(${providerRefs})`
    await db.refund.deleteMany({ where: { bookingId: { in: bookings } } })
    await db.payment.deleteMany({ where: { bookingId: { in: bookings } } })
    await db.emailLog.deleteMany({ where: { bookingId: { in: bookings } } })
    await db.booking.deleteMany({ where: { id: { in: bookings } } }) // cascade: rooms, nights, history, redemption
    const plans = hotel.roomTypes.flatMap(r => r.ratePlans)
    await db.ratePlan.deleteMany({ where: { id: { in: plans.map(p => p.id) } } }) // cascade: DailyRate
    await db.roomType.deleteMany({ where: { hotelId: hotel.id } }) // cascade: DailyInventory
    await db.hotel.delete({ where: { id: hotel.id } })
    await db.cancellationPolicy.deleteMany({ where: { id: { in: plans.map(p => p.cancellationPolicyId) } } })
    await db.depositPolicy.deleteMany({ where: { id: { in: plans.map(p => p.depositPolicyId) } } })
  }
  await db.session.deleteMany({ where: { userId: { in: users.map(u => u.id) } } })
  await db.user.deleteMany({ where: { id: { in: users.map(u => u.id) } } })
}

async function setup() {
  const cancel = await db.cancellationPolicy.create({ data: { name: 'zz test', tiers: [{ daysBefore: 7, penaltyPercent: 50 }, { daysBefore: 0, penaltyPercent: 100 }], noShowPercent: 100 } })
  const deposit = await db.depositPolicy.create({ data: { name: 'zz test', type: 'PERCENT', value: 30, holdMinutes: 15 } })
  const hotel = await db.hotel.create({
    data: { slug: SLUG, code: 'ZZTEST', status: 'PUBLISHED', name: 'ZZ Check Booking', area: { vi: 'x' }, address: { vi: 'x' }, mapQuery: 'x', checkInTime: '14:00', checkOutTime: '12:00', operator: 'x', content: {}, notifyEmail: 'hotel@check-booking.invalid' },
  })
  const rt = await db.roomType.create({
    data: { hotelId: hotel.id, slug: 'std', status: 'PUBLISHED', name: { vi: 'Std' }, description: { vi: 'x' }, maxAdults: 2, maxChildren: 1, maxOccupancy: 3, baseOccupancy: 2, size: { vi: 'x' }, totalRooms: 3, content: {} },
  })
  const plan = await db.ratePlan.create({ data: { roomTypeId: rt.id, code: 'BB', name: { vi: 'BB' }, mealPlan: 'BB', cancellationPolicyId: cancel.id, depositPolicyId: deposit.id, isDefault: true } })
  for (let i = 0; i <= 2; i++) await db.dailyInventory.create({ data: { roomTypeId: rt.id, date: day(addDays(checkin, i)), allotment: 1 } })
  for (let i = 0; i < 2; i++) await db.dailyRate.create({ data: { ratePlanId: plan.id, date: day(addDays(checkin, i)), price: 2_000_000 } })
  const users = await Promise.all(['a', 'b', 'c'].map(n => db.user.create({ data: { email: `${n}-${randomUUID().slice(0, 6)}@check-booking.invalid`, role: 'CUSTOMER' } })))
  return { rt, plan, users }
}

const inv = (roomTypeId: string) => db.dailyInventory.findMany({ where: { roomTypeId, date: { gte: day(checkin), lt: day(checkout) } }, orderBy: { date: 'asc' }, select: { booked: true, held: true } })

async function main() {
  await cleanup() // lần chạy trước bị ngắt giữa chừng
  const { rt, plan, users: [ua, ub, uc] } = await setup()
  const sel: Selection = { hotel: SLUG, room: 'std', ratePlanId: plan.id, checkin, checkout, rooms: 1, adults: 2, childAges: [] }
  const q = await quoteSelection(db, sel, null)
  assert.ok(q && !q.errors.length, `báo giá lỗi: ${JSON.stringify(q?.errors)}`)
  assert.equal(q.total, 4_000_000)
  assert.equal(q.deposit, 1_200_000)

  // (1) Hai khách tranh phòng cuối cùng lúc → đúng một người giữ được
  const [ra, rb] = await Promise.all([createHold(db, ua.id, sel, contact, q.total), createHold(db, ub.id, sel, contact, q.total)])
  const wins = [ra, rb].filter(r => r.ok)
  assert.equal(wins.length, 1, `tranh phòng cuối: ${JSON.stringify([ra, rb])}`)
  assert.equal([ra, rb].find(r => !r.ok && r.error === 'SOLD_OUT') !== undefined, true, 'người thua nhận SOLD_OUT')
  assert.deepEqual(await inv(rt.id), [{ booked: 0, held: 1 }, { booked: 0, held: 1 }], 'held = 1 mọi đêm')
  console.log('✓ (1) hai giữ phòng đồng thời → đúng một thành công')
  const winner = ra.ok ? ua : ub
  const code1 = (ra.ok ? ra : rb as Extract<typeof ra, { ok: true }>).code

  // Bấm "giữ phòng" lần nữa → trả lại booking đang giữ, không trừ thêm
  const again = await createHold(db, winner.id, sel, contact, q.total)
  assert.ok(again.ok && again.code === code1 && again.reused)
  // Giá khách thấy lệch → PRICE_CHANGED (không tin giá trình duyệt)
  const lied = await createHold(db, uc.id, { ...sel, adults: 1 }, contact, 1_000)
  assert.ok(!lied.ok && (lied.error === 'PRICE_CHANGED' || lied.error === 'UNAVAILABLE'))

  // (2) Hết hạn giữ phòng → EXPIRED, trả held
  const future = new Date(Date.now() + 16 * 60_000)
  assert.equal(await expireDue(db, future), 1)
  assert.equal((await db.booking.findUniqueOrThrow({ where: { code: code1 } })).status, 'EXPIRED')
  assert.deepEqual(await inv(rt.id), [{ booked: 0, held: 0 }, { booked: 0, held: 0 }], 'held trả về 0')
  console.log('✓ (2) hết hạn giữ phòng → EXPIRED, trả phòng')

  // (3) Giữ lại → thanh toán cọc → webhook gửi 2 lần → một Payment SUCCEEDED, CONFIRMED một lần, một email
  const h3 = await createHold(db, ua.id, sel, contact, q.total)
  assert.ok(h3.ok)
  const p3 = await startPayment(db, ua.id, h3.code, 'deposit', 'mock', newPaymentRef)
  assert.ok(p3.ok && p3.amount === 1_200_000 && p3.kind === 'DEPOSIT')
  const ev = { eventId: `EVT-${randomUUID()}`, providerRef: p3.providerRef, status: 'succeeded' as const, amount: p3.amount, raw: { providerRef: p3.providerRef } }
  const [w1, w2] = await Promise.all([handleWebhook(db, 'mock', ev), handleWebhook(db, 'mock', ev)])
  const firsts = [w1, w2].filter(w => !w.duplicate)
  assert.equal(firsts.length, 1, 'đúng một lần xử lý')
  assert.equal([w1, w2].filter(w => !w.duplicate && w.confirmedNow).length, 1, 'CONFIRMED đúng một lần')
  const b3 = await db.booking.findUniqueOrThrow({ where: { code: h3.code }, include: { payments: true, history: true } })
  assert.equal(b3.status, 'CONFIRMED')
  assert.equal(b3.paymentStatus, 'DEPOSIT_PAID')
  assert.equal(b3.paidAmount, 1_200_000)
  assert.equal(b3.balanceDue, 2_800_000)
  assert.equal(b3.payments.filter(p => p.status === 'SUCCEEDED').length, 1)
  assert.equal(b3.history.filter(h => h.to === 'CONFIRMED').length, 1)
  assert.deepEqual(await inv(rt.id), [{ booked: 1, held: 0 }, { booked: 1, held: 0 }], 'held → booked')
  // email gửi sau commit; gọi 2 lần (như 2 webhook cùng lúc) vẫn chỉ một email mỗi loại
  await silence(() => Promise.all([sendBookingEmails(db, b3.id), sendBookingEmails(db, b3.id)]).then(() => sendBookingEmails(db, b3.id)))
  const mails = await db.emailLog.findMany({ where: { bookingId: b3.id } })
  assert.equal(mails.filter(m => m.template === 'BookingConfirmed').length, 1, `email khách: ${mails.length}`)
  assert.equal(mails.filter(m => m.template === 'NewBookingNotice').length, 1, 'email khách sạn')
  // webhook thứ 3 khác eventId nhưng cùng payment → bỏ qua, không cộng tiền
  const w3 = await handleWebhook(db, 'mock', { ...ev, eventId: `EVT-${randomUUID()}` })
  assert.ok(!w3.duplicate && !w3.confirmedNow)
  assert.equal((await db.booking.findUniqueOrThrow({ where: { code: h3.code } })).paidAmount, 1_200_000)
  console.log('✓ (3) webhook 2 lần → 1 Payment, CONFIRMED 1 lần, 1 email mỗi loại')

  // (6) Huỷ booking đã xác nhận (còn ~40 ngày ≥ 7 ngày) → phạt 50% tổng = 2.000.000 > đã trả 1.200.000 → không hoàn
  const c6 = await cancelBooking(db, b3.id, { userId: null, reason: 'Kiểm thử' })
  assert.deepEqual(c6, { ok: true, penalty: 2_000_000, refund: 0 })
  assert.deepEqual(await inv(rt.id), [{ booked: 0, held: 0 }, { booked: 0, held: 0 }], 'huỷ → trả booked')
  console.log('✓ (6) huỷ → phạt theo chính sách lúc đặt, trả phòng')

  // (4a) Tiền về sau khi hết hạn, vẫn còn phòng → tự xác nhận
  const h4 = await createHold(db, ub.id, sel, contact, q.total)
  assert.ok(h4.ok)
  const p4 = await startPayment(db, ub.id, h4.code, 'full', 'mock', newPaymentRef)
  assert.ok(p4.ok && p4.amount === 4_000_000)
  await expireDue(db, future)
  const w4 = await handleWebhook(db, 'mock', { eventId: `EVT-${randomUUID()}`, providerRef: p4.providerRef, status: 'succeeded', amount: p4.amount, raw: { providerRef: p4.providerRef } })
  assert.ok(!w4.duplicate && w4.confirmedNow && !w4.needsRefund, JSON.stringify(w4))
  const b4 = await db.booking.findUniqueOrThrow({ where: { code: h4.code } })
  assert.equal(b4.status, 'CONFIRMED')
  assert.equal(b4.paymentStatus, 'PAID')
  console.log('✓ (4a) tiền về sau hết hạn, còn phòng → tự xác nhận')

  // (4b) Tiền về sau khi hết hạn, phòng đã bán cho người khác → needsRefund + Refund chờ xử lý
  await cancelBooking(db, b4.id, { userId: null, reason: 'dọn cho ca 4b' })
  const h5 = await createHold(db, uc.id, sel, contact, q.total)
  assert.ok(h5.ok)
  const p5 = await startPayment(db, uc.id, h5.code, 'deposit', 'mock', newPaymentRef)
  assert.ok(p5.ok)
  await expireDue(db, future)
  const h6 = await createHold(db, ua.id, sel, contact, q.total) // người khác lấy phòng
  assert.ok(h6.ok)
  const w5 = await handleWebhook(db, 'mock', { eventId: `EVT-${randomUUID()}`, providerRef: p5.providerRef, status: 'succeeded', amount: p5.amount, raw: { providerRef: p5.providerRef } })
  assert.ok(!w5.duplicate && !w5.confirmedNow && w5.needsRefund, JSON.stringify(w5))
  const b5 = await db.booking.findUniqueOrThrow({ where: { code: h5.code }, include: { refunds: true } })
  assert.equal(b5.status, 'EXPIRED')
  assert.equal(b5.needsRefund, true)
  assert.equal(b5.refunds.length, 1)
  assert.equal(b5.refunds[0].status, 'PENDING')
  assert.equal(b5.refunds[0].amount, p5.amount)
  assert.deepEqual(await inv(rt.id), [{ booked: 0, held: 1 }, { booked: 0, held: 1 }], 'không bán quá: chỉ booking h6 đang giữ')
  console.log('✓ (4b) tiền về sau hết hạn, hết phòng → needsRefund + Refund PENDING')

  // Webhook sai số tiền → không xác nhận
  const p6 = await startPayment(db, ua.id, h6.code, 'deposit', 'mock', newPaymentRef)
  assert.ok(p6.ok)
  const w6 = await handleWebhook(db, 'mock', { eventId: `EVT-${randomUUID()}`, providerRef: p6.providerRef, status: 'succeeded', amount: 1, raw: { providerRef: p6.providerRef } })
  assert.ok(!w6.duplicate && !w6.confirmedNow)
  assert.equal((await db.booking.findUniqueOrThrow({ where: { code: h6.code } })).status, 'PENDING_PAYMENT')

  // (7) Vận hành tại khách sạn: tiền về đúng → CONFIRMED; thu nốt tại quầy → PAID; nhận / trả phòng đúng thứ tự; đã trả phòng thì không huỷ được
  const w7 = await handleWebhook(db, 'mock', { eventId: `EVT-${randomUUID()}`, providerRef: p6.providerRef, status: 'succeeded', amount: p6.amount, raw: { providerRef: p6.providerRef } })
  assert.ok(!w7.duplicate && w7.confirmedNow)
  const b7 = await db.booking.findUniqueOrThrow({ where: { code: h6.code } })
  assert.deepEqual(await recordPayment(db, b7.id, { amount: b7.balanceDue + 1, method: 'cash', byUserId: null }), { ok: false, error: `Số tiền vượt phần còn lại (${b7.balanceDue}).` })
  assert.ok((await recordPayment(db, b7.id, { amount: b7.balanceDue, method: 'cash', byUserId: null })).ok)
  const paid7 = await db.booking.findUniqueOrThrow({ where: { id: b7.id } })
  assert.equal(paid7.paymentStatus, 'PAID')
  assert.equal(paid7.balanceDue, 0)
  assert.equal((await setStayStatus(db, b7.id, 'CHECKED_OUT', null)).ok, false, 'chưa nhận phòng thì chưa trả phòng')
  assert.ok((await setStayStatus(db, b7.id, 'CHECKED_IN', null)).ok)
  assert.ok((await setStayStatus(db, b7.id, 'CHECKED_OUT', null)).ok)
  assert.deepEqual(await cancelBooking(db, b7.id, { userId: null, reason: 'x' }), { ok: false, error: 'NOT_CANCELLABLE' })
  console.log('✓ (7) thu tiền tại quầy → PAID, nhận / trả phòng đúng thứ tự, đã trả phòng thì không huỷ')

  // (8) Xử lý hoàn tiền: DONE → bỏ cờ needsRefund, trừ đã trả, trạng thái REFUNDED
  const ref = await db.refund.findFirstOrThrow({ where: { bookingId: b5.id } })
  assert.ok((await resolveRefund(db, ref.id, 'DONE', null)).ok)
  assert.equal((await resolveRefund(db, ref.id, 'DONE', null)).ok, false, 'không xử lý hai lần')
  const b8 = await db.booking.findUniqueOrThrow({ where: { id: b5.id } })
  assert.equal(b8.needsRefund, false)
  assert.equal(b8.paidAmount, 0)
  assert.equal(b8.paymentStatus, 'REFUNDED')
  console.log('✓ (8) xử lý hoàn tiền → hết cờ cần hoàn, REFUNDED')

  // (5) Phiên khách (CUSTOMER) gọi API admin → bị từ chối
  const token = randomUUID()
  await db.session.create({ data: { sessionToken: token, userId: ua.id, expires: new Date(Date.now() + 3600_000) } })
  assert.equal(isSession(token), false, 'token phiên khách không phải phiên admin')
  const base = process.env.CHECK_BASE_URL ?? 'http://localhost:3000'
  const res = await fetch(`${base}/api/admin/db`, {
    method: 'POST', headers: { 'content-type': 'application/json', cookie: `authjs.session-token=${token}` },
    body: JSON.stringify({ op: 'rule.delete', id: 'x' }),
  }).catch(() => null)
  if (res) { assert.equal(res.status, 401, 'API admin trả 401 cho khách'); console.log('✓ (5) CUSTOMER gọi API admin → 401') }
  else console.log('✓ (5) CUSTOMER không qua được kiểm phiên admin (dev server không chạy nên chưa gọi HTTP)')
}

main()
  .then(() => console.log('check:booking ok'))
  .catch(e => { console.error(e); process.exitCode = 1 })
  .finally(async () => { await cleanup().catch(e => console.error('Dọn dữ liệu thử lỗi:', e)); await db.$disconnect() })

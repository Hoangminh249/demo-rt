// Lõi đặt phòng trên Postgres: báo giá, giữ phòng, thanh toán, webhook, hết hạn, huỷ.
// Nhận Prisma client làm tham số (không 'server-only') để scripts/check-booking.ts gọi thẳng được.
// Server dùng qua src/api/booking.ts (thêm phiên đăng nhập, email sau commit). Component KHÔNG import file này.
//
// Chống bán quá: giữ phòng = MỘT câu UPDATE có điều kiện `booked + held + n <= allotment` trên mọi đêm, đếm số dòng
// bị sửa; thiếu một đêm → ném lỗi → rollback cả transaction. Postgres khoá dòng nên hai người tranh phòng cuối chỉ một
// người qua. Giá luôn tính lại bằng src/lib/quote.ts ngay trong transaction.
import { Prisma, type PrismaClient } from '@/generated/prisma/client'
import { CONFIRM_LATE_PAYMENT_IF_AVAILABLE, MAX_PENDING_PER_USER } from './booking-rules'
import { bookingCode } from './booking'
import { nightsOf } from './inventory'
import { cancelPenalty, quote, type CancelPolicySnap, type Quote, type QuoteInput } from './quote'
import type { L } from '@/types/global'

type Db = PrismaClient
type Tx = Prisma.TransactionClient

const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`)
const iso = (d: Date) => d.toISOString().slice(0, 10)
const json = (v: unknown) => v as Prisma.InputJsonValue
/** Hôm nay theo giờ Việt Nam tại thời điểm `now`. */
export const todayAt = (now: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(now)

/** Booking đang "sống" (chiếm lượt khuyến mãi / phòng). */
const LIVE: ('PENDING_PAYMENT' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT')[] = ['PENDING_PAYMENT', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT']

export interface Selection {
  hotel: string // slug
  room: string // slug hạng phòng
  ratePlanId: string
  checkin: string
  checkout: string
  rooms: number
  adults: number
  childAges: number[]
  promoCode?: string | null
}

export interface Contact { name: string; phone: string; email: string; guestName?: string | null; specialRequests?: string | null }

export const selectionKey = (s: Selection) =>
  [s.hotel, s.room, s.ratePlanId, s.checkin, s.checkout, s.rooms, s.adults, s.childAges.join('.')].join('|')

// ---------- Báo giá ----------

async function loadSelection(db: Db | Tx, s: Selection, userId: string | null, now: Date) {
  const hotel = await db.hotel.findFirst({
    where: { slug: s.hotel, status: 'PUBLISHED' },
    include: { taxFees: { where: { active: true }, orderBy: { sortOrder: 'asc' } } },
  })
  const roomType = hotel && await db.roomType.findFirst({ where: { hotelId: hotel.id, slug: s.room, status: 'PUBLISHED' } })
  const plan = roomType && await db.ratePlan.findFirst({
    where: { id: s.ratePlanId, roomTypeId: roomType.id },
    include: { cancellationPolicy: true, depositPolicy: true },
  })
  if (!hotel || !roomType || !plan) return null

  const [inventory, rates] = await Promise.all([
    db.dailyInventory.findMany({ where: { roomTypeId: roomType.id, date: { gte: day(s.checkin), lte: day(s.checkout) } } }),
    db.dailyRate.findMany({ where: { ratePlanId: plan.id, date: { gte: day(s.checkin), lt: day(s.checkout) } } }),
  ])

  let promotion: QuoteInput['promotion'] = null
  let promotionId: string | null = null
  const code = s.promoCode?.trim().toUpperCase()
  if (code) {
    const p = await db.promotion.findFirst({
      where: { code, OR: [{ hotelId: null }, { hotelId: hotel.id }], AND: [{ OR: [{ ratePlanId: null }, { ratePlanId: plan.id }] }] },
    })
    if (!p) promotion = 'NOT_FOUND'
    else {
      const live = { booking: { status: { in: LIVE } } }
      const [all, mine] = await Promise.all([
        p.maxRedemptions != null ? db.promotionRedemption.count({ where: { promotionId: p.id, ...live } }) : 0,
        p.perUserLimit != null && userId ? db.promotionRedemption.count({ where: { promotionId: p.id, userId, ...live } }) : 0,
      ])
      const exhausted = (p.maxRedemptions != null && all >= p.maxRedemptions) || (p.perUserLimit != null && mine >= p.perUserLimit)
      promotionId = p.id
      promotion = exhausted ? 'EXHAUSTED' : {
        code: p.code, type: p.type, value: p.value, minNights: p.minNights, bookStart: p.bookStart, bookEnd: p.bookEnd,
        stayStart: p.stayStart ? iso(p.stayStart) : null, stayEnd: p.stayEnd ? iso(p.stayEnd) : null, active: p.active,
      }
    }
  }

  const input: QuoteInput = {
    checkin: s.checkin, checkout: s.checkout, rooms: s.rooms, adults: s.adults, childAges: s.childAges,
    roomType, plan,
    inventory: inventory.map(d => ({ ...d, date: iso(d.date) })),
    rates: Object.fromEntries(rates.map(r => [iso(r.date), r.price])),
    promotion,
    taxFees: hotel.taxFees.map(t => ({ name: (t.name as unknown as L).vi, type: t.type, value: t.value, included: t.included })),
    deposit: plan.depositPolicy,
    now,
  }
  const q = quote(input)
  // Ngày đã qua / trước ngày khai trương: không bán (quote thuần không biết "hôm nay").
  const first = hotel.openingDate && iso(hotel.openingDate) > todayAt(now) ? iso(hotel.openingDate) : todayAt(now)
  if (s.checkin < first) q.errors.unshift({ code: 'INVALID_STAY' })
  return { q, hotel, roomType, plan, promotionId }
}

export async function quoteSelection(db: Db | Tx, s: Selection, userId: string | null, now = new Date()): Promise<Quote | null> {
  return (await loadSelection(db, s, userId, now))?.q ?? null
}

// ---------- Hết hạn giữ phòng ----------

/** Trả số phòng đã trừ cho booking về lại DailyInventory (cột held khi đang giữ, booked khi đã xác nhận). */
async function release(tx: Tx, bookingId: string, column: 'held' | 'booked') {
  const b = await tx.booking.findUniqueOrThrow({ where: { id: bookingId }, include: { rooms: { select: { roomTypeId: true } } } })
  const nights = nightsOf(iso(b.checkIn), iso(b.checkOut))
  const byType = new Map<string, number>()
  for (const r of b.rooms) byType.set(r.roomTypeId, (byType.get(r.roomTypeId) ?? 0) + 1)
  for (const [roomTypeId, n] of byType) {
    if (column === 'held') await tx.$executeRaw`UPDATE "DailyInventory" SET held = held - ${n}, "updatedAt" = now() WHERE "roomTypeId" = ${roomTypeId} AND date = ANY(${nights}::date[])`
    else await tx.$executeRaw`UPDATE "DailyInventory" SET booked = booked - ${n}, "updatedAt" = now() WHERE "roomTypeId" = ${roomTypeId} AND date = ANY(${nights}::date[])`
  }
}

/** Chuyển booking chờ thanh toán đã quá hạn giữ phòng → EXPIRED, trả phòng. Gọi lười khi đọc + cron. Trả số booking đã xử lý. */
export async function expireDue(db: Db, now = new Date(), bookingId?: string): Promise<number> {
  return db.$transaction(async tx => {
    const only = bookingId ? Prisma.sql`AND id = ${bookingId}` : Prisma.empty
    const rows = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Booking" WHERE status = 'PENDING_PAYMENT' AND "holdExpiresAt" < ${now} ${only}
      ORDER BY "holdExpiresAt" LIMIT 200 FOR UPDATE SKIP LOCKED`
    for (const { id } of rows) {
      await release(tx, id, 'held')
      await tx.booking.update({ where: { id }, data: { status: 'EXPIRED' } })
      await tx.bookingStatusHistory.create({ data: { bookingId: id, from: 'PENDING_PAYMENT', to: 'EXPIRED', note: 'Hết thời gian giữ phòng' } })
    }
    return rows.length
  })
}

// ---------- Giữ phòng ----------

export type HoldResult =
  | { ok: true; code: string; reused: boolean }
  | { ok: false; error: 'NOT_FOUND' | 'TOO_MANY_PENDING' | 'SOLD_OUT' }
  | { ok: false; error: 'UNAVAILABLE' | 'PRICE_CHANGED'; quote: Quote }

class SoldOut extends Error {}

/**
 * Tạo booking PENDING_PAYMENT + trừ tồn (held) trong một transaction. `expectedTotal` = tổng khách đã thấy;
 * server tính lại, lệch thì trả PRICE_CHANGED kèm báo giá mới để hỏi lại khách. Cùng khách + cùng lựa chọn đang giữ → trả lại booking đó.
 */
export async function createHold(db: Db, userId: string, s: Selection, contact: Contact, expectedTotal: number, now = new Date()): Promise<HoldResult> {
  await expireDue(db, now)
  const key = selectionKey(s)
  const existing = await db.booking.findFirst({ where: { userId, selectionKey: key, status: 'PENDING_PAYMENT' }, select: { code: true } })
  if (existing) return { ok: true, code: existing.code, reused: true }
  if (await db.booking.count({ where: { userId, status: 'PENDING_PAYMENT' } }) >= MAX_PENDING_PER_USER) return { ok: false, error: 'TOO_MANY_PENDING' }

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await db.$transaction(async tx => {
        // Khoá mã khuyến mãi trước khi đếm lượt dùng: hai người dùng lượt cuối cùng lúc thì một người phải chờ.
        if (s.promoCode?.trim()) await tx.$queryRaw`SELECT id FROM "Promotion" WHERE code = ${s.promoCode.trim().toUpperCase()} FOR UPDATE`
        const sel = await loadSelection(tx, s, userId, now)
        if (!sel) return { ok: false, error: 'NOT_FOUND' } as const
        const { q, hotel, roomType, plan, promotionId } = sel
        if (q.errors.length) return { ok: false, error: 'UNAVAILABLE', quote: q } as const
        if (q.total !== expectedTotal) return { ok: false, error: 'PRICE_CHANGED', quote: q } as const

        const nights = nightsOf(s.checkin, s.checkout)
        const held = await tx.$executeRaw`
          UPDATE "DailyInventory" SET held = held + ${s.rooms}, "updatedAt" = now()
          WHERE "roomTypeId" = ${roomType.id} AND date = ANY(${nights}::date[]) AND NOT closed AND booked + held + ${s.rooms} <= allotment`
        if (held !== nights.length) throw new SoldOut()

        const code = bookingCode(hotel.code, todayAt(now), Math.floor(Math.random() * 10000))
        const perRoom = (k: number) => Math.floor(s.adults / s.rooms) + (k < s.adults % s.rooms ? 1 : 0)
        const kids = (k: number) => Math.floor(s.childAges.length / s.rooms) + (k < s.childAges.length % s.rooms ? 1 : 0)
        const booking = await tx.booking.create({
          data: {
            code, userId, hotelId: hotel.id, status: 'PENDING_PAYMENT', paymentStatus: 'UNPAID',
            checkIn: day(s.checkin), checkOut: day(s.checkout),
            contactName: contact.name, contactPhone: contact.phone, contactEmail: contact.email,
            guestName: contact.guestName || null, specialRequests: contact.specialRequests || null,
            adults: s.adults, children: s.childAges.length, childAges: s.childAges,
            subtotal: q.subtotal, discount: q.discount, taxFees: q.taxFees, total: q.total,
            depositAmount: q.deposit, paidAmount: 0, balanceDue: q.total, balanceDueAt: q.balanceDueAt ? day(q.balanceDueAt) : null,
            holdExpiresAt: new Date(now.getTime() + q.holdMinutes * 60_000),
            selectionKey: key, source: 'web',
            policySnapshot: json({
              hotel: { name: hotel.name, checkInTime: hotel.checkInTime, checkOutTime: hotel.checkOutTime, phone: hotel.phone, email: hotel.email },
              roomType: { slug: roomType.slug, name: roomType.name },
              ratePlan: { id: plan.id, code: plan.code, name: plan.name, mealPlan: plan.mealPlan },
              cancellation: { name: plan.cancellationPolicy.name, description: plan.cancellationPolicy.description, tiers: plan.cancellationPolicy.tiers, noShowPercent: plan.cancellationPolicy.noShowPercent, refundable: plan.refundable },
              deposit: { type: plan.depositPolicy.type, value: plan.depositPolicy.value, holdMinutes: plan.depositPolicy.holdMinutes, balanceDueDaysBefore: plan.depositPolicy.balanceDueDaysBefore },
              quote: { nights: q.nights, rooms: s.rooms, taxLines: q.taxLines, promoCode: q.promoCode },
              quotedAt: now.toISOString(),
            }),
            rooms: {
              create: Array.from({ length: s.rooms }, (_, k) => ({
                roomTypeId: roomType.id, ratePlanId: plan.id, adults: perRoom(k), children: kids(k),
                subtotal: q.nights.reduce((sum, n) => sum + n.price + (k === 0 ? n.extraFee : 0), 0),
                // phụ thu cả booking ghi vào phòng đầu
                nights: { create: q.nights.map(n => ({ date: day(n.date), price: n.price, extraFee: k === 0 ? n.extraFee : 0 })) },
              })),
            },
            history: { create: { to: 'PENDING_PAYMENT', byUserId: userId, note: `Giữ phòng ${q.holdMinutes} phút` } },
          },
        })
        if (promotionId && q.discount > 0) await tx.promotionRedemption.create({ data: { promotionId, bookingId: booking.id, userId, amount: q.discount } })
        return { ok: true, code, reused: false } as const
      })
    } catch (e) {
      if (e instanceof SoldOut) return { ok: false, error: 'SOLD_OUT' }
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        // Trùng booking chờ của cùng khách + lựa chọn (bấm 2 lần) → trả booking đã có; trùng mã → thử mã khác.
        const again = await db.booking.findFirst({ where: { userId, selectionKey: key, status: 'PENDING_PAYMENT' }, select: { code: true } })
        if (again) return { ok: true, code: again.code, reused: true }
        continue
      }
      throw e
    }
  }
  throw new Error('Không tạo được mã đặt phòng')
}

// ---------- Thanh toán ----------

export type StartPaymentResult =
  | { ok: true; providerRef: string; amount: number; kind: 'DEPOSIT' | 'FULL' }
  | { ok: false; error: 'NOT_FOUND' | 'NOT_PENDING' | 'EXPIRED' }

/** Tạo một lần thanh toán (PENDING) cho booking đang giữ. mode 'deposit' = cọc theo chính sách, 'full' = trả đủ. */
export async function startPayment(db: Db, userId: string, code: string, mode: 'deposit' | 'full', provider: string, newRef: () => string, now = new Date()): Promise<StartPaymentResult> {
  const b0 = await db.booking.findFirst({ where: { code, userId }, select: { id: true } })
  if (!b0) return { ok: false, error: 'NOT_FOUND' }
  await expireDue(db, now, b0.id)
  return db.$transaction(async tx => {
    const [b] = await tx.$queryRaw<{ status: string; holdExpiresAt: Date | null; total: number; depositAmount: number; paidAmount: number }[]>`
      SELECT status, "holdExpiresAt", total, "depositAmount", "paidAmount" FROM "Booking" WHERE id = ${b0.id} FOR UPDATE`
    if (b.status === 'EXPIRED') return { ok: false, error: 'EXPIRED' } as const
    if (b.status !== 'PENDING_PAYMENT') return { ok: false, error: 'NOT_PENDING' } as const
    const kind = mode === 'deposit' && b.depositAmount < b.total ? 'DEPOSIT' : 'FULL'
    const amount = (kind === 'DEPOSIT' ? b.depositAmount : b.total) - b.paidAmount
    const providerRef = newRef()
    await tx.payment.create({ data: { bookingId: b0.id, kind, provider, providerRef, amount, status: 'PENDING' } })
    return { ok: true, providerRef, amount, kind } as const
  })
}

export interface WebhookEvent { eventId: string; providerRef: string; status: 'succeeded' | 'failed'; amount: number; raw: unknown }

export type WebhookResult =
  | { duplicate: true }
  | { duplicate: false; bookingId: string | null; confirmedNow: boolean; needsRefund: boolean; note: string }

/**
 * Xử lý webhook thanh toán — CỬA DUY NHẤT xác nhận booking. Idempotent: (provider, eventId) unique; payment đã SUCCEEDED thì bỏ qua.
 * Tiền về khi còn giữ phòng → CONFIRMED (held → booked). Tiền về sau khi hết hạn → còn phòng thì xác nhận, hết phòng thì
 * needsRefund + Refund chờ xử lý tay (CONFIRM_LATE_PAYMENT_IF_AVAILABLE).
 */
export async function handleWebhook(db: Db, provider: string, ev: WebhookEvent, now = new Date()): Promise<WebhookResult> {
  return db.$transaction(async tx => {
    const inserted = await tx.$executeRaw`
      INSERT INTO "PaymentWebhookEvent" (id, provider, "eventId", payload, "receivedAt")
      VALUES (gen_random_uuid()::text, ${provider}, ${ev.eventId}, ${JSON.stringify(ev.raw ?? null)}::jsonb, ${now})
      ON CONFLICT (provider, "eventId") DO NOTHING`
    if (!inserted) return { duplicate: true } as const
    const done = (note: string, r: Partial<Extract<WebhookResult, { duplicate: false }>> = {}) =>
      tx.paymentWebhookEvent.update({ where: { provider_eventId: { provider, eventId: ev.eventId } }, data: { processedAt: now, error: r.bookingId === undefined ? note : null } })
        .then(() => ({ duplicate: false, bookingId: null, confirmedNow: false, needsRefund: false, note, ...r }) as const)

    const [pay] = await tx.$queryRaw<{ id: string; bookingId: string; status: string; amount: number; kind: string }[]>`
      SELECT id, "bookingId", status, amount, kind FROM "Payment" WHERE provider = ${provider} AND "providerRef" = ${ev.providerRef} FOR UPDATE`
    if (!pay) return done('Không thấy payment')
    if (pay.status === 'SUCCEEDED') return done('Payment đã ghi nhận trước đó', { bookingId: pay.bookingId })
    if (ev.status === 'failed') {
      await tx.payment.update({ where: { id: pay.id }, data: { status: 'FAILED', rawPayload: json(ev.raw) } })
      return done('Thanh toán thất bại — booking vẫn chờ, khách thử lại được', { bookingId: pay.bookingId })
    }
    if (ev.amount !== pay.amount) return done(`Số tiền lệch: webhook ${ev.amount} ≠ payment ${pay.amount} — không xác nhận`)

    await tx.payment.update({ where: { id: pay.id }, data: { status: 'SUCCEEDED', paidAt: now, rawPayload: json(ev.raw) } })
    const [b] = await tx.$queryRaw<{ status: string; holdExpiresAt: Date | null; total: number; paidAmount: number }[]>`
      SELECT status, "holdExpiresAt", total, "paidAmount" FROM "Booking" WHERE id = ${pay.bookingId} FOR UPDATE`
    const paid = b.paidAmount + pay.amount
    const money = { paidAmount: paid, balanceDue: Math.max(0, b.total - paid), paymentStatus: paid >= b.total ? 'PAID' as const : 'DEPOSIT_PAID' as const }
    const confirm = async (from: 'PENDING_PAYMENT' | 'EXPIRED', note: string) => {
      await tx.booking.update({ where: { id: pay.bookingId }, data: { status: 'CONFIRMED', holdExpiresAt: null, ...money } })
      await tx.bookingStatusHistory.create({ data: { bookingId: pay.bookingId, from, to: 'CONFIRMED', note } })
      return done(note, { bookingId: pay.bookingId, confirmedNow: true })
    }
    const refund = async (reason: string) => {
      await tx.booking.update({ where: { id: pay.bookingId }, data: { ...money, needsRefund: true } })
      await tx.refund.create({ data: { bookingId: pay.bookingId, paymentId: pay.id, amount: pay.amount, reason } })
      return done(reason, { bookingId: pay.bookingId, needsRefund: true })
    }

    let status = b.status
    if (status === 'PENDING_PAYMENT' && b.holdExpiresAt && b.holdExpiresAt < now) {
      // Hết hạn nhưng cron chưa quét: trả phòng giữ trước, rồi xử lý như tiền về muộn.
      await release(tx, pay.bookingId, 'held')
      await tx.booking.update({ where: { id: pay.bookingId }, data: { status: 'EXPIRED' } })
      await tx.bookingStatusHistory.create({ data: { bookingId: pay.bookingId, from: 'PENDING_PAYMENT', to: 'EXPIRED', note: 'Hết thời gian giữ phòng (phát hiện lúc tiền về)' } })
      status = 'EXPIRED'
    }
    if (status === 'PENDING_PAYMENT') {
      await release(tx, pay.bookingId, 'held')
      await tx.$executeRaw`
        UPDATE "DailyInventory" i SET booked = booked + r.n, "updatedAt" = now()
        FROM (SELECT "roomTypeId", count(*)::int AS n FROM "BookingRoom" WHERE "bookingId" = ${pay.bookingId} GROUP BY 1) r,
             (SELECT "checkIn", "checkOut" FROM "Booking" WHERE id = ${pay.bookingId}) bk
        WHERE i."roomTypeId" = r."roomTypeId" AND i.date >= bk."checkIn" AND i.date < bk."checkOut"`
      return confirm('PENDING_PAYMENT', 'Đã nhận thanh toán')
    }
    if (status === 'EXPIRED') {
      if (CONFIRM_LATE_PAYMENT_IF_AVAILABLE) {
        // Còn phòng thì giữ lại cho khách (cùng điều kiện chống bán quá như lúc giữ phòng).
        const bk = await tx.booking.findUniqueOrThrow({ where: { id: pay.bookingId }, include: { rooms: { select: { roomTypeId: true } } } })
        const nights = nightsOf(iso(bk.checkIn), iso(bk.checkOut))
        const byType = new Map<string, number>()
        for (const r of bk.rooms) byType.set(r.roomTypeId, (byType.get(r.roomTypeId) ?? 0) + 1)
        // SAVEPOINT: thiếu phòng một đêm thì lùi riêng phần trừ tồn, vẫn giữ bản ghi tiền đã về (không rollback cả webhook).
        await tx.$executeRaw`SAVEPOINT rebook`
        let ok = true
        for (const [roomTypeId, n] of byType) {
          const c = await tx.$executeRaw`
            UPDATE "DailyInventory" SET booked = booked + ${n}, "updatedAt" = now()
            WHERE "roomTypeId" = ${roomTypeId} AND date = ANY(${nights}::date[]) AND booked + held + ${n} <= allotment`
          if (c !== nights.length) { ok = false; break }
        }
        if (ok) {
          await tx.$executeRaw`RELEASE SAVEPOINT rebook`
          return confirm('EXPIRED', 'Tiền về sau khi hết giữ phòng — còn phòng nên tự xác nhận')
        }
        await tx.$executeRaw`ROLLBACK TO SAVEPOINT rebook`
      }
      return refund('Tiền về sau khi hết giữ phòng và đã hết phòng — cần hoàn tiền')
    }
    return refund(`Tiền về cho booking đang ở trạng thái ${status} — cần kiểm tra và hoàn tiền`)
  })
}

// ---------- Huỷ ----------

export type CancelResult = { ok: true; penalty: number; refund: number } | { ok: false; error: 'NOT_FOUND' | 'NOT_CANCELLABLE' }

/** Huỷ booking: phạt theo chính sách lúc đặt (policySnapshot), trả phòng, tạo Refund chờ xử lý tay nếu đã trả nhiều hơn tiền phạt. */
export async function cancelBooking(db: Db, bookingId: string, by: { userId: string | null; reason: string; noShow?: boolean }, now = new Date()): Promise<CancelResult> {
  return db.$transaction(async tx => {
    const [b] = await tx.$queryRaw<{ id: string; status: string; total: number; paidAmount: number; checkIn: Date; policySnapshot: { cancellation: CancelPolicySnap } }[]>`
      SELECT id, status, total, "paidAmount", "checkIn", "policySnapshot" FROM "Booking" WHERE id = ${bookingId} FOR UPDATE`
    if (!b) return { ok: false, error: 'NOT_FOUND' } as const
    if (b.status !== 'PENDING_PAYMENT' && b.status !== 'CONFIRMED') return { ok: false, error: 'NOT_CANCELLABLE' } as const
    const penalty = b.status === 'PENDING_PAYMENT' ? 0 : cancelPenalty(b.policySnapshot.cancellation, b.total, iso(b.checkIn), todayAt(now), by.noShow)
    const refund = Math.max(0, b.paidAmount - penalty)
    await release(tx, b.id, b.status === 'PENDING_PAYMENT' ? 'held' : 'booked')
    await tx.booking.update({
      where: { id: b.id },
      data: { status: by.noShow ? 'NO_SHOW' : 'CANCELLED', cancelledAt: now, cancelReason: by.reason, holdExpiresAt: null, needsRefund: refund > 0, balanceDue: 0 },
    })
    await tx.bookingStatusHistory.create({ data: { bookingId: b.id, from: b.status as 'CONFIRMED', to: by.noShow ? 'NO_SHOW' : 'CANCELLED', byUserId: by.userId, note: `${by.reason} · phạt ${penalty} · hoàn ${refund}` } })
    if (refund > 0) await tx.refund.create({ data: { bookingId: b.id, amount: refund, reason: `Huỷ: phạt ${penalty} trên tổng ${b.total}, đã trả ${b.paidAmount}` } })
    return { ok: true, penalty, refund } as const
  })
}

// ---------- Đọc ----------

/** Booking cho trang kết quả / thanh toán (kiểm chủ ở tầng gọi). Hết hạn thì cập nhật luôn (lười). */
export async function readBooking(db: Db, code: string, now = new Date()) {
  const b0 = await db.booking.findUnique({ where: { code }, select: { id: true, status: true } })
  if (!b0) return null
  if (b0.status === 'PENDING_PAYMENT') await expireDue(db, now, b0.id)
  return db.booking.findUnique({
    where: { code },
    include: { hotel: { select: { slug: true, name: true, phone: true, email: true, zalo: true, checkInTime: true, checkOutTime: true } }, rooms: { select: { roomTypeId: true } } },
  })
}

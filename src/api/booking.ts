// Đặt phòng thật (DATA_SOURCE=db) phía server: gắn khách đang đăng nhập, kiểm chủ booking, gửi email SAU commit.
// Lõi giao dịch ở src/lib/booking-engine.ts. Route handler /api/bookings/*, /api/payments/*, /api/cron/* gọi file này.
import 'server-only'
import { after } from 'next/server'
import { db, isDbSource } from '@/lib/db'
import { cancelBooking, createHold, expireDue, handleWebhook, penaltyPreview, quoteSelection, readBooking, startPayment, type Contact, type Selection } from '@/lib/booking-engine'
import { cancellationText, sendBookingEmails, sendCancelEmails } from '@/lib/email'
import { isMockProvider, methodOf, mockPayments, mockWebhook, MOCK_SIGNATURE_HEADER, newPaymentRef, paymentProvider, providerByName } from '@/lib/payment'
import type { PayMethod } from '@/lib/booking-requests'
import type { QuoteNight } from '@/lib/quote'
import type { L } from '@/types/global'
import type { HoldResponse, LiveBooking, LiveQuote, MyBooking } from '@/types/booking'

const iso = (d: Date) => d.toISOString().slice(0, 10)

interface Snapshot {
  roomType: { slug: string; name: L }
  ratePlan: { name: L }
  cancellation: { description: L | null; tiers: { daysBefore: number; penaltyPercent: number }[]; noShowPercent: number; refundable: boolean }
  quote: { rooms: number; nights: QuoteNight[] }
}

export const bookingApi = {
  /** Đặt phòng thật đang mở (DATA_SOURCE=db). Không thì các trang đặt phòng chạy bản minh hoạ như cũ. */
  enabled: isDbSource,
  /** Cổng giả lập: trang thanh toán hiện nhãn "môi trường thử". */
  mockPayments,

  quote: (s: Selection, userId: string | null): Promise<LiveQuote | null> => quoteSelection(db(), s, userId),

  hold: (userId: string, s: Selection, contact: Contact, expectedTotal: number): Promise<HoldResponse> => createHold(db(), userId, s, contact, expectedTotal),

  /** Booking của chính khách (người khác → null, như không tồn tại). */
  async get(userId: string, code: string): Promise<LiveBooking | null> {
    const b = await readBooking(db(), code)
    if (!b || b.userId !== userId) return null
    const s = b.policySnapshot as unknown as Snapshot
    const [last, paid] = await Promise.all([
      db().payment.findFirst({ where: { bookingId: b.id }, orderBy: { createdAt: 'desc' }, select: { status: true } }),
      db().payment.findFirst({ where: { bookingId: b.id, status: 'SUCCEEDED', kind: { not: 'BALANCE' } }, orderBy: { paidAt: 'desc' }, select: { provider: true, providerRef: true, paidAt: true } }),
    ])
    const cancellable = b.status === 'PENDING_PAYMENT' || b.status === 'CONFIRMED'
    const now = cancellable ? penaltyPreview(b) : null
    return {
      code: b.code, status: b.status, paymentStatus: b.paymentStatus,
      hotel: { slug: b.hotel.slug, name: b.hotel.name },
      room: { slug: s.roomType.slug, name: s.roomType.name.vi },
      planName: s.ratePlan.name.vi,
      checkIn: iso(b.checkIn), checkOut: iso(b.checkOut), rooms: s.quote.rooms, adults: b.adults, children: b.children,
      total: b.total, depositAmount: b.depositAmount, paidAmount: b.paidAmount, balanceDue: b.balanceDue,
      balanceDueAt: b.balanceDueAt ? iso(b.balanceDueAt) : null,
      holdExpiresAt: b.holdExpiresAt?.toISOString() ?? null,
      needsRefund: b.needsRefund,
      lastPaymentFailed: last?.status === 'FAILED',
      createdAt: b.createdAt.toISOString(),
      nights: s.quote.nights.map(n => ({ date: n.date, total: n.total })),
      checkInTime: b.hotel.checkInTime, checkOutTime: b.hotel.checkOutTime,
      hotelContact: { phone: b.hotel.phone, zalo: b.hotel.zalo },
      contact: { name: b.contactName, phone: b.contactPhone, email: b.contactEmail, guestName: b.guestName, specialRequests: b.specialRequests },
      cancel: {
        text: cancellationText(s.cancellation), tiers: s.cancellation.tiers, noShowPercent: s.cancellation.noShowPercent, refundable: s.cancellation.refundable,
        now: now && { penalty: now.penalty, refund: now.refund },
      },
      payment: paid?.paidAt ? { method: methodOf(paid.provider), ref: paid.providerRef, paidAt: paid.paidAt.toISOString() } : null,
      cancelledAt: b.cancelledAt?.toISOString() ?? null,
    }
  },

  /** Mọi booking của khách, mới nhất trước (trang "Đơn của tôi"). Booking giữ phòng đã hết hạn được chuyển EXPIRED trước khi đọc. */
  async list(userId: string): Promise<MyBooking[]> {
    await expireDue(db())
    const rows = await db().booking.findMany({
      where: { userId }, orderBy: { createdAt: 'desc' }, take: 100,
      select: { code: true, status: true, checkIn: true, checkOut: true, adults: true, children: true, total: true, paidAmount: true, holdExpiresAt: true, needsRefund: true, policySnapshot: true, hotel: { select: { slug: true, name: true } } },
    })
    return rows.map(b => {
      const s = b.policySnapshot as unknown as Snapshot
      return {
        code: b.code, status: b.status, hotel: b.hotel, room: s.roomType.name.vi, planName: s.ratePlan.name.vi, rooms: s.quote.rooms,
        checkIn: iso(b.checkIn), checkOut: iso(b.checkOut), adults: b.adults, children: b.children,
        total: b.total, paidAmount: b.paidAmount, holdExpiresAt: b.holdExpiresAt?.toISOString() ?? null, needsRefund: b.needsRefund,
      }
    })
  },

  /** Tạo lần thanh toán (trả đủ) + link sang cổng của hình thức khách chọn. */
  async pay(userId: string, code: string, method: PayMethod, locale: string) {
    const provider = paymentProvider(method)
    const r = await startPayment(db(), userId, code, provider.name, newPaymentRef)
    if (!r.ok) return r
    return { ok: true as const, url: provider.checkoutUrl({ providerRef: r.providerRef, amount: r.amount, bookingCode: code, locale }) }
  },

  /** Khách tự huỷ: phạt theo chính sách lúc đặt; tiền hoàn (nếu có) thành Refund chờ admin chuyển. Email sau commit. */
  async cancel(userId: string, code: string) {
    const b = await db().booking.findFirst({ where: { code, userId }, select: { id: true } })
    if (!b) return { ok: false as const, error: 'NOT_FOUND' as const }
    const r = await cancelBooking(db(), b.id, { userId, reason: 'Khách huỷ trên web' })
    if (r.ok) after(() => sendCancelEmails(db(), b.id))
    return r
  },

  /** Webhook cổng thanh toán: kiểm chữ ký → handleWebhook (idempotent) → email sau khi trả lời cổng. */
  async webhook(providerName: string, body: string, headers: Headers) {
    const provider = providerByName(providerName)
    const ev = provider?.parseWebhook(body, headers)
    if (!provider || !ev) return { status: 401 as const }
    const r = await handleWebhook(db(), provider.name, ev)
    if (!r.duplicate && r.confirmedNow && r.bookingId) {
      const id = r.bookingId
      after(() => sendBookingEmails(db(), id))
    }
    return { status: 200 as const, result: r }
  },

  /** Cổng giả lập: payment của chính khách để hiện trang "thanh toán". */
  async mockPayment(userId: string, ref: string) {
    const p = await db().payment.findFirst({
      where: { providerRef: ref, booking: { userId } },
      select: { provider: true, amount: true, status: true, kind: true, booking: { select: { code: true, hotel: { select: { name: true } } } } },
    })
    return p && isMockProvider(p.provider) ? { provider: p.provider, amount: p.amount, status: p.status, kind: p.kind, code: p.booking.code, hotelName: p.booking.hotel.name } : null
  },

  /** Cổng giả lập: khách bấm kết quả → ký body như cổng thật rồi đi đúng đường webhook. */
  async mockResult(userId: string, ref: string, result: 'succeeded' | 'failed') {
    const p = await bookingApi.mockPayment(userId, ref)
    if (!p) return null
    const { body, signature } = mockWebhook(ref, result, p.amount)
    await bookingApi.webhook(p.provider, body, new Headers({ [MOCK_SIGNATURE_HEADER]: signature }))
    return p.code
  },

  expire: () => expireDue(db()),
}

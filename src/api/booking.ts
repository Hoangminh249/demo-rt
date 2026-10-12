// Đặt phòng thật (DATA_SOURCE=db) phía server: gắn khách đang đăng nhập, kiểm chủ booking, gửi email SAU commit.
// Lõi giao dịch ở src/lib/booking-engine.ts. Route handler /api/bookings/*, /api/payments/*, /api/cron/* gọi file này.
import 'server-only'
import { after } from 'next/server'
import { db, isDbSource } from '@/lib/db'
import { createHold, expireDue, handleWebhook, quoteSelection, readBooking, startPayment, type Contact, type Selection } from '@/lib/booking-engine'
import { sendBookingEmails } from '@/lib/email'
import { mockWebhook, MOCK_SIGNATURE_HEADER, newPaymentRef, paymentProvider, providerByName } from '@/lib/payment'
import type { L } from '@/types/global'
import type { HoldResponse, LiveBooking, LiveQuote } from '@/types/booking'

const iso = (d: Date) => d.toISOString().slice(0, 10)

export const bookingApi = {
  /** Đặt phòng thật đang mở (DATA_SOURCE=db). Không thì các trang đặt phòng chạy bản minh hoạ như cũ. */
  enabled: isDbSource,
  /** Cổng giả lập: trang thanh toán hiện nhãn "môi trường thử". */
  mockPayments: () => paymentProvider().name === 'mock',

  quote: (s: Selection, userId: string | null): Promise<LiveQuote | null> => quoteSelection(db(), s, userId),

  hold: (userId: string, s: Selection, contact: Contact, expectedTotal: number): Promise<HoldResponse> => createHold(db(), userId, s, contact, expectedTotal),

  /** Booking của chính khách (người khác → null, như không tồn tại). */
  async get(userId: string, code: string): Promise<LiveBooking | null> {
    const b = await readBooking(db(), code)
    if (!b || b.userId !== userId) return null
    const s = b.policySnapshot as unknown as { roomType: { slug: string; name: L }; ratePlan: { name: L }; quote: { rooms: number } }
    const last = await db().payment.findFirst({ where: { bookingId: b.id }, orderBy: { createdAt: 'desc' }, select: { status: true } })
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
    }
  },

  /** Tạo lần thanh toán + link sang cổng. */
  async pay(userId: string, code: string, mode: 'deposit' | 'full', locale: string) {
    const provider = paymentProvider()
    const r = await startPayment(db(), userId, code, mode, provider.name, newPaymentRef)
    if (!r.ok) return r
    return { ok: true as const, url: provider.checkoutUrl({ providerRef: r.providerRef, amount: r.amount, bookingCode: code, locale }) }
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
      where: { providerRef: ref, provider: 'mock', booking: { userId } },
      select: { amount: true, status: true, kind: true, booking: { select: { code: true, hotel: { select: { name: true } } } } },
    })
    return p && { amount: p.amount, status: p.status, kind: p.kind, code: p.booking.code, hotelName: p.booking.hotel.name }
  },

  /** Cổng giả lập: khách bấm kết quả → ký body như cổng thật rồi đi đúng đường webhook. */
  async mockResult(userId: string, ref: string, result: 'succeeded' | 'failed') {
    const p = await bookingApi.mockPayment(userId, ref)
    if (!p) return null
    const { body, signature } = mockWebhook(ref, result, p.amount)
    await bookingApi.webhook('mock', body, new Headers({ [MOCK_SIGNATURE_HEADER]: signature }))
    return p.code
  },

  expire: () => expireDue(db()),
}

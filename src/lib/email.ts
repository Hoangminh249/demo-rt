// Email đặt phòng (Resend + react-email). Gọi SAU KHI transaction xác nhận đã commit; gửi lỗi không đụng tới booking,
// chỉ ghi EmailLog (FAILED) để admin bấm "Gửi lại". Không có RESEND_API_KEY → in nội dung ra console (EmailLog CONSOLE).
// Mỗi (booking, template) chỉ gửi một lần trừ khi force (nút "Gửi lại").
import { createElement } from 'react'
import { render } from '@react-email/components'
import { Resend } from 'resend'
import type { Prisma, PrismaClient } from '@/generated/prisma/client'
import { BookingConfirmed } from '@/emails/booking-confirmed'
import { NewBookingNotice } from '@/emails/new-booking-notice'
import { NOTIFY_HOTEL } from './booking-rules'
import type { QuoteNight } from './quote'
import type { L } from '@/types/global'

export interface EmailBooking {
  code: string
  hotelName: string; hotelPhone: string | null; hotelEmail: string | null
  checkIn: string; checkOut: string; checkInTime: string; checkOutTime: string
  roomName: string; planName: string; rooms: number; adults: number; children: number
  nights: QuoteNight[]
  discount: number; promoCode: string | null; taxFees: number; total: number; paid: number; balanceDue: number; balanceDueAt: string | null
  cancellation: string
  contactName: string; contactPhone: string; contactEmail: string; guestName: string | null; specialRequests: string | null
}

export type EmailTemplate = 'BookingConfirmed' | 'NewBookingNotice'

const iso = (d: Date) => d.toISOString().slice(0, 10)

interface Snapshot {
  hotel: { name: string; checkInTime: string; checkOutTime: string; phone: string | null; email: string | null }
  roomType: { name: L }
  ratePlan: { name: L }
  cancellation: { description: L | null; tiers: { daysBefore: number; penaltyPercent: number }[]; noShowPercent: number; refundable: boolean }
  quote: { nights: QuoteNight[]; rooms: number; promoCode: string | null }
}

function cancellationText(c: Snapshot['cancellation']) {
  if (c.description?.vi) return c.description.vi
  if (!c.refundable) return 'Gói không hoàn huỷ: huỷ hoặc không đến thu 100%.'
  const tiers = [...c.tiers].sort((a, b) => b.daysBefore - a.daysBefore)
    .map(t => (t.daysBefore ? `huỷ trước từ ${t.daysBefore} ngày: phí ${t.penaltyPercent}%` : `huỷ sát ngày đến: phí ${t.penaltyPercent}%`))
  return `${tiers.join(' · ')} · không đến: ${c.noShowPercent}%.`
}

async function load(db: PrismaClient, bookingId: string) {
  const b = await db.booking.findUniqueOrThrow({ where: { id: bookingId }, include: { hotel: { select: { notifyEmail: true } } } })
  const s = b.policySnapshot as unknown as Snapshot
  const data: EmailBooking = {
    code: b.code,
    hotelName: s.hotel.name, hotelPhone: s.hotel.phone, hotelEmail: s.hotel.email,
    checkIn: iso(b.checkIn), checkOut: iso(b.checkOut), checkInTime: s.hotel.checkInTime, checkOutTime: s.hotel.checkOutTime,
    roomName: s.roomType.name.vi, planName: s.ratePlan.name.vi, rooms: s.quote.rooms, adults: b.adults, children: b.children,
    nights: s.quote.nights, discount: b.discount, promoCode: s.quote.promoCode, taxFees: b.taxFees, total: b.total,
    paid: b.paidAmount, balanceDue: b.balanceDue, balanceDueAt: b.balanceDueAt ? iso(b.balanceDueAt) : null,
    cancellation: cancellationText(s.cancellation),
    contactName: b.contactName, contactPhone: b.contactPhone, contactEmail: b.contactEmail, guestName: b.guestName, specialRequests: b.specialRequests,
  }
  return { data, notifyEmail: b.hotel.notifyEmail }
}

async function deliver(db: Prisma.TransactionClient, bookingId: string, template: EmailTemplate, to: string, subject: string, element: React.ReactElement) {
  const [html, text] = await Promise.all([render(element), render(element, { plainText: true })])
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.info(`[email:console] ${template} → ${to}\nSubject: ${subject}\n${text}`)
    return db.emailLog.create({ data: { bookingId, to, template, subject, status: 'CONSOLE' } })
  }
  try {
    const from = process.env.EMAIL_FROM || 'Rooty Hospitality <booking@rootyhospitality.com>'
    const { data, error } = await new Resend(key).emails.send({ from, to, subject, html, text })
    if (error) throw new Error(`${error.name}: ${error.message}`)
    return db.emailLog.create({ data: { bookingId, to, template, subject, status: 'SENT', providerId: data?.id ?? null } })
  } catch (e) {
    console.error('[email] gửi lỗi', template, bookingId, e)
    return db.emailLog.create({ data: { bookingId, to, template, subject, status: 'FAILED', error: e instanceof Error ? e.message.slice(0, 500) : 'Lỗi không rõ' } })
  }
}

/**
 * Gửi email của booking đã xác nhận: BookingConfirmed cho khách, NewBookingNotice cho khách sạn (nếu có notifyEmail).
 * Đã gửi (SENT/CONSOLE) thì bỏ qua, trừ khi `force` (admin bấm "Gửi lại"). Không ném lỗi — mọi kết quả nằm ở EmailLog.
 */
export async function sendBookingEmails(db: PrismaClient, bookingId: string, opts: { force?: boolean; only?: EmailTemplate } = {}) {
  try {
    const { data, notifyEmail } = await load(db, bookingId)
    // Khoá theo booking: hai lần gọi cùng lúc thì lần sau chờ, đọc thấy đã gửi → bỏ qua (không gửi trùng).
    await db.$transaction(async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`email:${bookingId}`}))`
      const sent = opts.force ? [] : (await tx.emailLog.findMany({ where: { bookingId, status: { in: ['SENT', 'CONSOLE'] } }, select: { template: true } })).map(x => x.template)
      const want = (t: EmailTemplate) => (!opts.only || opts.only === t) && !sent.includes(t)
      if (want('BookingConfirmed')) await deliver(tx, bookingId, 'BookingConfirmed', data.contactEmail, `Xác nhận đặt phòng ${data.code} — ${data.hotelName}`, createElement(BookingConfirmed, { b: data }))
      if (NOTIFY_HOTEL && notifyEmail && want('NewBookingNotice')) await deliver(tx, bookingId, 'NewBookingNotice', notifyEmail, `[Booking mới] ${data.code} · ${data.checkIn}`, createElement(NewBookingNotice, { b: data }))
    }, { timeout: 30_000, maxWait: 30_000 })
  } catch (e) {
    console.error('[email] không gửi được', bookingId, e)
  }
}

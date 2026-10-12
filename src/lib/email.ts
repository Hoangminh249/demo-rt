// Email đặt phòng (Resend + react-email). Gọi SAU KHI transaction đã commit; gửi lỗi không đụng tới booking,
// chỉ ghi EmailLog (FAILED) để admin bấm "Gửi lại". Không có RESEND_API_KEY → in nội dung ra console (EmailLog CONSOLE).
// Mỗi (booking, template) chỉ gửi một lần trừ khi force (nút "Gửi lại").
// Email cho team khách sạn đi tới Hotel.notifyEmail (một hoặc nhiều địa chỉ, cách nhau dấu phẩy), Reply-To = email khách.
import { createElement } from 'react'
import { render } from '@react-email/components'
import { Resend } from 'resend'
import type { Prisma, PrismaClient } from '@/generated/prisma/client'
import { BookingConfirmed } from '@/emails/booking-confirmed'
import { BookingCancelled } from '@/emails/booking-cancelled'
import { NewBookingNotice, TeamTestNotice } from '@/emails/new-booking-notice'
import { LoginCode } from '@/emails/login-code'
import { NOTIFY_HOTEL } from './booking-rules'
import { methodOf } from './payment'
import type { QuoteNight } from './quote'
import type { L } from '@/types/global'

export interface EmailBooking {
  code: string
  hotelName: string; hotelPhone: string | null; hotelEmail: string | null
  checkIn: string; checkOut: string; checkInTime: string; checkOutTime: string
  roomName: string; planName: string; rooms: number; adults: number; children: number
  nights: QuoteNight[]
  discount: number; promoCode: string | null; taxFees: number; total: number; paid: number; balanceDue: number; balanceDueAt: string | null
  /** Hình thức thanh toán của lần trả thành công gần nhất. */
  method: 'bank' | 'onepay' | null
  cancellation: string
  contactName: string; contactPhone: string; contactEmail: string; guestName: string | null; specialRequests: string | null
  /** Link xem đơn (khách) và mở đơn trong admin (team). */
  orderUrl: string; adminUrl: string
  /** Chỉ có ở email huỷ: tiền phạt, tiền hoàn theo chính sách lúc đặt. */
  cancel?: { penalty: number; refund: number }
}

export type EmailTemplate = 'BookingConfirmed' | 'NewBookingNotice' | 'BookingCancelled' | 'CancelNotice'

const iso = (d: Date) => d.toISOString().slice(0, 10)
const dm = (s: string) => `${s.slice(8, 10)}/${s.slice(5, 7)}`
/** Gốc URL trong email (link tuyệt đối). Production: AUTH_URL. */
const siteUrl = () => (process.env.AUTH_URL || 'http://localhost:3000').replace(/\/$/, '')
const from = () => process.env.EMAIL_FROM || 'Rooty Hospitality <booking@rootyhospitality.com>'
const split = (list: string) => list.split(',').map(s => s.trim()).filter(Boolean)

interface Snapshot {
  hotel: { name: string; checkInTime: string; checkOutTime: string; phone: string | null; email: string | null }
  roomType: { name: L }
  ratePlan: { name: L }
  cancellation: { description: L | null; tiers: { daysBefore: number; penaltyPercent: number }[]; noShowPercent: number; refundable: boolean }
  quote: { nights: QuoteNight[]; rooms: number; promoCode: string | null }
}

export function cancellationText(c: Snapshot['cancellation']) {
  if (c.description?.vi) return c.description.vi
  if (!c.refundable) return 'Gói không hoàn huỷ: huỷ hoặc không đến thu 100%.'
  const tiers = [...c.tiers].sort((a, b) => b.daysBefore - a.daysBefore)
    .map(t => (t.daysBefore ? `huỷ trước từ ${t.daysBefore} ngày: phí ${t.penaltyPercent}%` : `huỷ sát ngày đến: phí ${t.penaltyPercent}%`))
  return `${tiers.join(' · ')} · không đến: ${c.noShowPercent}%.`
}

async function load(db: PrismaClient, bookingId: string) {
  const b = await db.booking.findUniqueOrThrow({ where: { id: bookingId }, include: { hotel: { select: { notifyEmail: true, content: true } } } })
  const paid = await db.payment.findFirst({ where: { bookingId, status: 'SUCCEEDED' }, orderBy: { paidAt: 'desc' }, select: { provider: true } })
  const s = b.policySnapshot as unknown as Snapshot
  const data: EmailBooking = {
    code: b.code,
    hotelName: s.hotel.name, hotelPhone: s.hotel.phone, hotelEmail: s.hotel.email,
    checkIn: iso(b.checkIn), checkOut: iso(b.checkOut), checkInTime: s.hotel.checkInTime, checkOutTime: s.hotel.checkOutTime,
    roomName: s.roomType.name.vi, planName: s.ratePlan.name.vi, rooms: s.quote.rooms, adults: b.adults, children: b.children,
    nights: s.quote.nights, discount: b.discount, promoCode: s.quote.promoCode, taxFees: b.taxFees, total: b.total,
    paid: b.paidAmount, balanceDue: b.balanceDue, balanceDueAt: b.balanceDueAt ? iso(b.balanceDueAt) : null,
    method: paid ? methodOf(paid.provider) : null,
    cancellation: cancellationText(s.cancellation),
    contactName: b.contactName, contactPhone: b.contactPhone, contactEmail: b.contactEmail, guestName: b.guestName, specialRequests: b.specialRequests,
    orderUrl: `${siteUrl()}/don-cua-toi/${encodeURIComponent(b.code)}`, adminUrl: `${siteUrl()}/admin/orders/${encodeURIComponent(b.code)}`,
  }
  const notify = (b.hotel.content as { notify?: { booking: boolean; cancel: boolean } } | null)?.notify
  return { data, team: NOTIFY_HOTEL && b.hotel.notifyEmail ? split(b.hotel.notifyEmail) : [], notify: { booking: notify?.booking ?? true, cancel: notify?.cancel ?? true } }
}

async function send(to: string[], subject: string, element: React.ReactElement, replyTo?: string) {
  const [html, text] = await Promise.all([render(element), render(element, { plainText: true })])
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.info(`[email:console] → ${to.join(', ')}\nSubject: ${subject}\n${text}`)
    return { console: true as const }
  }
  const { data, error } = await new Resend(key).emails.send({ from: from(), to, subject, html, text, ...(replyTo ? { replyTo } : {}) })
  if (error) throw new Error(`${error.name}: ${error.message}`)
  return { console: false as const, id: data?.id ?? null }
}

async function deliver(db: Prisma.TransactionClient, bookingId: string, template: EmailTemplate, to: string[], subject: string, element: React.ReactElement, replyTo?: string) {
  const log = { bookingId, to: to.join(', ').slice(0, 500), template, subject }
  try {
    const r = await send(to, subject, element, replyTo)
    return db.emailLog.create({ data: { ...log, status: r.console ? 'CONSOLE' : 'SENT', providerId: r.console ? null : r.id } })
  } catch (e) {
    console.error('[email] gửi lỗi', template, bookingId, e)
    return db.emailLog.create({ data: { ...log, status: 'FAILED', error: e instanceof Error ? e.message.slice(0, 500) : 'Lỗi không rõ' } })
  }
}

/** Mã đăng nhập (Auth.js gọi). Không có RESEND_API_KEY → in console (máy dev). Gửi lỗi → ném lỗi để màn đăng nhập báo. */
export async function sendLoginCode(to: string, code: string, minutes: number) {
  if (!process.env.RESEND_API_KEY) {
    console.info(`[email:console] Mã đăng nhập → ${to}: ${code} (hiệu lực ${minutes} phút)`)
    return
  }
  await send([to], `Mã đăng nhập Rooty Hospitality: ${code}`, createElement(LoginCode, { code, minutes }))
}

/** Nút "Gửi email thử" ở admin: kiểm hộp thư team nhận được email. Không ghi EmailLog. */
export async function sendTestNotice(list: string, hotelName: string): Promise<{ ok: true; console: boolean } | { ok: false; error: string }> {
  try {
    const r = await send(split(list), `[Thử] Email team nhận booking — ${hotelName}`, createElement(TeamTestNotice, { hotelName }))
    return { ok: true, console: r.console }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message.slice(0, 200) : 'Lỗi không rõ' }
  }
}

/** Gửi một nhóm email của booking trong khoá advisory: hai lần gọi cùng lúc thì lần sau chờ, đọc thấy đã gửi → bỏ qua. */
async function once(db: PrismaClient, bookingId: string, force: boolean, fn: (tx: Prisma.TransactionClient, want: (t: EmailTemplate) => boolean) => Promise<void>) {
  await db.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`email:${bookingId}`}))`
    const sent = force ? [] : (await tx.emailLog.findMany({ where: { bookingId, status: { in: ['SENT', 'CONSOLE'] } }, select: { template: true } })).map(x => x.template)
    await fn(tx, t => !sent.includes(t))
  }, { timeout: 30_000, maxWait: 30_000 })
}

/**
 * Gửi email của booking đã xác nhận: BookingConfirmed cho khách, NewBookingNotice cho team khách sạn (nếu có email team và bật báo).
 * Đã gửi (SENT/CONSOLE) thì bỏ qua, trừ khi `force` (admin bấm "Gửi lại"). Không ném lỗi — mọi kết quả nằm ở EmailLog.
 */
export async function sendBookingEmails(db: PrismaClient, bookingId: string, opts: { force?: boolean; only?: EmailTemplate } = {}) {
  try {
    const { data: b, team, notify } = await load(db, bookingId)
    const only = (t: EmailTemplate) => !opts.only || opts.only === t
    await once(db, bookingId, !!opts.force, async (tx, want) => {
      if (only('BookingConfirmed') && want('BookingConfirmed')) await deliver(tx, bookingId, 'BookingConfirmed', [b.contactEmail], `Xác nhận đặt phòng ${b.code} — ${b.hotelName}`, createElement(BookingConfirmed, { b }))
      if (team.length && notify.booking && only('NewBookingNotice') && want('NewBookingNotice')) {
        await deliver(tx, bookingId, 'NewBookingNotice', team, `[Booking mới] ${b.hotelName} · ${b.roomName} · ${dm(b.checkIn)} → ${dm(b.checkOut)} · ${b.code}`, createElement(NewBookingNotice, { b }), b.contactEmail)
      }
    })
  } catch (e) {
    console.error('[email] không gửi được', bookingId, e)
  }
}

/** Email khi khách huỷ: xác nhận huỷ cho khách + báo team (nếu bật báo huỷ). Không ném lỗi. */
export async function sendCancelEmails(db: PrismaClient, bookingId: string) {
  try {
    const { data, team, notify } = await load(db, bookingId)
    const last = await db.refund.findFirst({ where: { bookingId }, orderBy: { createdAt: 'desc' }, select: { amount: true } })
    const refund = last?.amount ?? 0
    const b: EmailBooking = { ...data, cancel: { refund, penalty: Math.max(0, data.paid - refund) } }
    await once(db, bookingId, false, async (tx, want) => {
      if (want('BookingCancelled')) await deliver(tx, bookingId, 'BookingCancelled', [b.contactEmail], `Đã huỷ đặt phòng ${b.code} — ${b.hotelName}`, createElement(BookingCancelled, { b, team: false }))
      if (team.length && notify.cancel && want('CancelNotice')) {
        await deliver(tx, bookingId, 'CancelNotice', team, `[Khách huỷ] ${b.hotelName} · ${b.roomName} · ${dm(b.checkIn)} → ${dm(b.checkOut)} · ${b.code}`, createElement(BookingCancelled, { b, team: true }), b.contactEmail)
      }
    })
  } catch (e) {
    console.error('[email] không gửi được email huỷ', bookingId, e)
  }
}

// Admin — booking đặt trên web (Postgres): danh sách có lọc, chi tiết, thao tác (thu tiền tại quầy, nhận / trả phòng, huỷ,
// không đến, gửi lại email, xử lý hoàn tiền). Lõi giao dịch ở src/lib/booking-engine.ts; mỗi thao tác ghi AuditLog. Chỉ server.
import 'server-only'
import { Prisma } from '@/generated/prisma/client'
import { cancelBooking, penaltyPreview, readBooking, recordPayment, resolveRefund, setStayStatus } from '@/lib/booking-engine'
import { audit } from '@/lib/audit'
import { db } from '@/lib/db'
import { cancellationText, sendBookingEmails } from '@/lib/email'
import type { ParsedOrderCommand } from '@/lib/order-commands'
import type { L } from '@/types/global'
import type { AdminOrder, AdminOrders, OrderStatus } from '@/types/admin'

const iso = (d: Date) => d.toISOString().slice(0, 10)
const PAGE = 50

export interface OrdersQuery { status?: string; hotel?: string; from?: string; to?: string; refund?: boolean; q?: string; page?: number }

async function list(q: OrdersQuery): Promise<AdminOrders> {
  const search = q.q?.trim()
  const where: Prisma.BookingWhereInput = {
    ...(q.status ? { status: q.status as OrderStatus } : {}),
    ...(q.hotel ? { hotel: { slug: q.hotel } } : {}),
    ...(q.from || q.to ? { checkIn: { ...(q.from ? { gte: new Date(`${q.from}T00:00:00Z`) } : {}), ...(q.to ? { lte: new Date(`${q.to}T00:00:00Z`) } : {}) } } : {}),
    ...(q.refund ? { needsRefund: true } : {}),
    ...(search ? { OR: [
      { code: { contains: search, mode: 'insensitive' } }, { contactEmail: { contains: search, mode: 'insensitive' } },
      { contactPhone: { contains: search } }, { contactName: { contains: search, mode: 'insensitive' } },
    ] } : {}),
  }
  const page = Math.max(1, q.page ?? 1)
  const [rows, total, hotels, needsRefund] = await Promise.all([
    db().booking.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * PAGE, take: PAGE, include: { hotel: { select: { name: true } } } }),
    db().booking.count({ where }),
    db().hotel.findMany({ orderBy: { sortOrder: 'asc' }, select: { slug: true, name: true } }),
    db().booking.count({ where: { needsRefund: true } }),
  ])
  return {
    rows: rows.map(b => ({
      code: b.code, status: b.status, paymentStatus: b.paymentStatus, hotel: b.hotel.name, checkIn: iso(b.checkIn), checkOut: iso(b.checkOut),
      guest: b.guestName || b.contactName, email: b.contactEmail, phone: b.contactPhone,
      total: b.total, paidAmount: b.paidAmount, balanceDue: b.balanceDue, needsRefund: b.needsRefund, createdAt: b.createdAt.toISOString(),
    })),
    total, page, pages: Math.max(1, Math.ceil(total / PAGE)), hotels, needsRefund,
  }
}

interface Snap { roomType: { name: L }; ratePlan: { name: L }; quote: { promoCode: string | null }; cancellation: Parameters<typeof cancellationText>[0] }

async function detail(code: string): Promise<AdminOrder | null> {
  const b0 = await readBooking(db(), code) // hết hạn giữ phòng thì cập nhật luôn
  if (!b0) return null
  const b = await db().booking.findUniqueOrThrow({
    where: { id: b0.id },
    include: {
      hotel: { select: { slug: true, name: true } },
      user: { select: { email: true } },
      rooms: { include: { nights: { orderBy: { date: 'asc' } } } },
      payments: { orderBy: { createdAt: 'asc' } },
      refunds: { orderBy: { createdAt: 'asc' } },
      history: { orderBy: { createdAt: 'asc' }, include: { byUser: { select: { email: true, name: true } } } },
      emails: { orderBy: { createdAt: 'asc' } },
    },
  })
  const s = b.policySnapshot as unknown as Snap
  return {
    code: b.code, status: b.status, paymentStatus: b.paymentStatus, source: b.source,
    hotel: b.hotel, checkIn: iso(b.checkIn), checkOut: iso(b.checkOut), adults: b.adults, children: b.children, childAges: b.childAges,
    contact: { name: b.contactName, phone: b.contactPhone, email: b.contactEmail, guestName: b.guestName, account: b.user.email },
    specialRequests: b.specialRequests,
    room: s.roomType.name.vi, plan: s.ratePlan.name.vi,
    rooms: b.rooms.map(r => ({ roomType: s.roomType.name.vi, adults: r.adults, children: r.children, nights: r.nights.map(n => ({ date: iso(n.date), price: n.price, extraFee: n.extraFee })) })),
    subtotal: b.subtotal, discount: b.discount, promoCode: s.quote.promoCode, taxFees: b.taxFees, total: b.total,
    depositAmount: b.depositAmount, paidAmount: b.paidAmount, balanceDue: b.balanceDue, balanceDueAt: b.balanceDueAt ? iso(b.balanceDueAt) : null,
    holdExpiresAt: b.holdExpiresAt?.toISOString() ?? null, needsRefund: b.needsRefund,
    cancelledAt: b.cancelledAt?.toISOString() ?? null, cancelReason: b.cancelReason, createdAt: b.createdAt.toISOString(),
    cancellation: cancellationText(s.cancellation),
    preview: ['CONFIRMED', 'PENDING_PAYMENT'].includes(b.status) ? penaltyPreview(b) : null,
    payments: b.payments.map(p => ({ id: p.id, kind: p.kind, provider: p.provider, amount: p.amount, status: p.status, paidAt: p.paidAt?.toISOString() ?? null, createdAt: p.createdAt.toISOString() })),
    refunds: b.refunds.map(r => ({ id: r.id, amount: r.amount, status: r.status, reason: r.reason, processedAt: r.processedAt?.toISOString() ?? null, createdAt: r.createdAt.toISOString() })),
    history: b.history.map(h => ({ from: h.from, to: h.to, by: h.byUser?.email ?? h.byUser?.name ?? null, note: h.note, at: h.createdAt.toISOString() })),
    emails: b.emails.map(e => ({ template: e.template, to: e.to, status: e.status, error: e.error, at: e.createdAt.toISOString() })),
  }
}

/** Một thao tác trên booking `code`. Trả câu báo cho admin; lỗi nghiệp vụ → { error }. */
async function act(code: string, cmd: ParsedOrderCommand, userId: string | null): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  const b = await db().booking.findUnique({ where: { code }, select: { id: true } })
  if (!b) return { ok: false, error: 'Không thấy booking.' }
  const logged = async (action: string, after: unknown, r: { ok: true; note: string } | { ok: false; error: string }) => {
    if (r.ok) await db().$transaction(tx => audit(tx, action, 'Booking', b.id, after))
    return r.ok ? { ok: true as const, message: r.note } : r
  }
  switch (cmd.op) {
    case 'order.pay': return logged('record-payment', cmd, await recordPayment(db(), b.id, { amount: cmd.amount, method: cmd.method, note: cmd.note, byUserId: userId }))
    case 'order.checkin': return logged('check-in', cmd, await setStayStatus(db(), b.id, 'CHECKED_IN', userId))
    case 'order.checkout': return logged('check-out', cmd, await setStayStatus(db(), b.id, 'CHECKED_OUT', userId))
    case 'order.cancel': {
      const r = await cancelBooking(db(), b.id, { userId, reason: cmd.reason, noShow: cmd.noShow })
      if (!r.ok) return { ok: false, error: r.error === 'NOT_CANCELLABLE' ? 'Chỉ huỷ được booking đang chờ thanh toán hoặc đã xác nhận.' : 'Không thấy booking.' }
      return logged(cmd.noShow ? 'no-show' : 'cancel', { ...cmd, ...r }, { ok: true, note: `${cmd.noShow ? 'Đã đánh dấu không đến' : 'Đã huỷ'} · phạt ${r.penalty.toLocaleString('vi-VN')} đ${r.refund ? ` · cần hoàn ${r.refund.toLocaleString('vi-VN')} đ (danh sách hoàn tiền)` : ''}.` })
    }
    case 'order.email': {
      await sendBookingEmails(db(), b.id, { force: true, only: cmd.template })
      const last = await db().emailLog.findMany({ where: { bookingId: b.id }, orderBy: { createdAt: 'desc' }, take: cmd.template ? 1 : 2, select: { status: true, to: true } })
      const failed = last.filter(e => e.status === 'FAILED')
      return logged('resend-email', cmd, failed.length ? { ok: false, error: `Gửi lỗi tới ${failed.map(f => f.to).join(', ')} — xem nhật ký email bên dưới.` } : { ok: true, note: `Đã gửi lại (${last.map(e => `${e.to}: ${e.status}`).join(' · ') || 'không có email nào để gửi'}).` })
    }
    case 'order.refund': {
      const r = await db().refund.findUnique({ where: { id: cmd.refundId }, select: { bookingId: true } })
      if (r?.bookingId !== b.id) return { ok: false, error: 'Khoản hoàn không thuộc booking này.' }
      return logged('refund', cmd, await resolveRefund(db(), cmd.refundId, cmd.status, userId))
    }
  }
}

export const bookingAdminApi = { list, detail, act }

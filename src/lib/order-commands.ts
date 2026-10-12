// Thao tác admin trên MỘT booking web (POST /api/admin/orders/{code}). STAFF chỉ được nhận / trả phòng.
// zod kiểm ở server; hook trình duyệt dùng chung kiểu. Không import gì của server.
import { z } from 'zod'

export const PAY_METHODS = ['cash', 'transfer', 'card'] as const

export const OrderCommand = z.discriminatedUnion('op', [
  /** Thu phần còn lại tại quầy (hoặc khoản trả thêm). */
  z.object({ op: z.literal('order.pay'), amount: z.int().min(1).max(1_000_000_000), method: z.enum(PAY_METHODS), note: z.string().trim().max(300).nullish() }),
  z.object({ op: z.literal('order.checkin') }),
  z.object({ op: z.literal('order.checkout') }),
  /** Huỷ (phạt theo chính sách lúc đặt) hoặc đánh dấu không đến (phạt noShow). Tạo khoản hoàn chờ xử lý nếu đã trả hơn tiền phạt. */
  z.object({ op: z.literal('order.cancel'), reason: z.string().trim().min(3, 'Ghi lý do (ít nhất 3 ký tự)').max(300), noShow: z.boolean().default(false) }),
  /** Gửi lại email (mặc định cả hai: khách + khách sạn). */
  z.object({ op: z.literal('order.email'), template: z.enum(['BookingConfirmed', 'NewBookingNotice']).optional() }),
  z.object({ op: z.literal('order.refund'), refundId: z.string().trim().min(1).max(40), status: z.enum(['DONE', 'REJECTED']) }),
])

export const STAFF_OPS: OrderCommand['op'][] = ['order.checkin', 'order.checkout']

export type OrderCommand = z.input<typeof OrderCommand>
export type ParsedOrderCommand = z.output<typeof OrderCommand>

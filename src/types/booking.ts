// Kiểu dùng cho luồng đặt phòng: khách sạn + phòng của các bước, thông tin khách, request/response /api/bookings/*.
import type { InfoTable } from './global'
import type { Room } from './hotel'

/** Khách sạn + phòng đưa cho các bước đặt phòng (hotelApi.bookingTarget). */
export interface BookingTarget {
  hotel: { slug: string; code: string; name: string; opening: string | null; cancel_summary: string; address: string; map_url: string }
  room: Room
  times: { checkin: string; checkout: string }
  children: InfoTable | null
}

export type ChildAge = 'under6' | '6to11' | '12plus'
export type Arrival = '14-16' | '16-18' | '18-20' | '20+' // khung giờ đến
export type StayRequest = 'quiet' | 'high' | 'early' | 'occasion'

/** Thông tin khách nhập ở bước 2 (sessionStorage, không lên URL). */
export interface GuestDraft {
  name: string
  phone: string
  email: string
  country: string // ISO-2
  self: boolean // người liên hệ cũng là khách nhận phòng
  guest: string // tên khách nhận phòng khi self = false
  children: ChildAge[]
  arrival: Arrival | '' // '' = chưa rõ
  requests: StayRequest[]
  notes: string // tối đa 500 ký tự
  marketing: boolean
}

// ---------- /api/bookings/* ----------

/** Báo giá server trả về (src/lib/quote.ts). */
export interface LiveQuote {
  nights: { date: string; price: number; extraFee: number; total: number }[]
  subtotal: number; discount: number; promoCode: string | null
  taxLines: { name: string; amount: number; included: boolean }[]; taxFees: number
  total: number; deposit: number; balanceDue: number; balanceDueAt: string | null; holdMinutes: number
  errors: { code: string; date?: string }[]
}

export type HoldResponse =
  | { ok: true; code: string; reused: boolean }
  | { ok: false; error: 'NOT_FOUND' | 'TOO_MANY_PENDING' | 'SOLD_OUT' | 'UNAUTHORIZED' }
  | { ok: false; error: 'UNAVAILABLE' | 'PRICE_CHANGED'; quote: LiveQuote }

/** Booking của chính khách đang đăng nhập (GET /api/bookings/{code}). */
export interface LiveBooking {
  code: string
  status: 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED' | 'NO_SHOW' | 'CHECKED_IN' | 'CHECKED_OUT'
  paymentStatus: 'UNPAID' | 'DEPOSIT_PAID' | 'PAID' | 'PARTIALLY_REFUNDED' | 'REFUNDED'
  hotel: { slug: string; name: string }
  room: { slug: string; name: string }
  planName: string
  checkIn: string; checkOut: string; rooms: number; adults: number; children: number
  total: number; depositAmount: number; paidAmount: number; balanceDue: number; balanceDueAt: string | null
  holdExpiresAt: string | null
  needsRefund: boolean
  lastPaymentFailed: boolean
  createdAt: string
  /** Giá từng đêm đã chốt lúc đặt (cả booking: giá × số phòng + phụ thu). */
  nights: { date: string; total: number }[]
  checkInTime: string; checkOutTime: string
  hotelContact: { phone: string | null; zalo: string | null }
  contact: { name: string; phone: string; email: string; guestName: string | null; specialRequests: string | null }
  /** Chính sách huỷ lúc đặt + tiền phạt nếu huỷ ngay bây giờ (null = không huỷ được nữa). */
  cancel: { text: string; tiers: { daysBefore: number; penaltyPercent: number }[]; noShowPercent: number; refundable: boolean; now: { penalty: number; refund: number } | null }
  /** Lần thanh toán thành công gần nhất. */
  payment: { method: 'bank' | 'onepay' | null; ref: string; paidAt: string } | null
  cancelledAt: string | null
}

/** Một dòng ở trang "Đơn của tôi". */
export interface MyBooking {
  code: string
  status: LiveBooking['status']
  hotel: { slug: string; name: string }
  room: string; planName: string; rooms: number
  checkIn: string; checkOut: string; adults: number; children: number
  total: number; paidAmount: number
  holdExpiresAt: string | null
  needsRefund: boolean
}

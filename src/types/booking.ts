// Luồng đặt phòng (bản minh hoạ): khách sạn + phòng của các bước, thông tin khách, kết quả thanh toán.
// Field bám Gohost POST /bookings để sau này nối thẳng (docs/api-docs/gohost-api.md).
import type { InfoTable } from './global'
import type { Room } from './hotel'

/** Khách sạn + phòng đưa cho các bước đặt phòng (hotelApi.bookingTarget). */
export interface BookingTarget {
  hotel: { slug: string; code: string; name: string; online: boolean; opening: string | null; cancel_summary: string; address: string; map_url: string }
  room: Room
  times: { checkin: string; checkout: string }
  children: InfoTable | null
}

export type ChildAge = 'under6' | '6to11' | '12plus'
export type Arrival = '14-16' | '16-18' | '18-20' | '20+' // khung giờ đến → Gohost arrival_hour (lấy giờ đầu)
export type StayRequest = 'quiet' | 'high' | 'early' | 'occasion'

/** Thông tin khách nhập ở bước 2 (sessionStorage, không lên URL). */
export interface GuestDraft {
  name: string
  phone: string
  email: string
  country: string // ISO-2, Gohost customer.country
  self: boolean // người liên hệ cũng là khách nhận phòng
  guest: string // tên khách nhận phòng khi self = false
  children: ChildAge[]
  arrival: Arrival | '' // '' = chưa rõ
  requests: StayRequest[]
  notes: string // → notes, tối đa 500 ký tự
  marketing: boolean
}

/** Kết quả bước thanh toán (minh hoạ) + ảnh chụp giá lúc trả, để trang xác nhận không phụ thuộc phòng trống sau đó. */
export interface PaymentDraft {
  code: string
  mode: 'deposit' | 'full'
  method: 'qr' | 'card'
  paid: number
  total: number
  plan: string
  breakfast: boolean
  at: string
}

// ---------- Đặt phòng thật (DATA_SOURCE=db) — /api/bookings/* ----------

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
}

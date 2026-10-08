// Luồng đặt phòng (bản minh hoạ, chỉ chạy trên trình duyệt — chưa POST Gohost, chưa cổng thanh toán).
// Lựa chọn (khách sạn, phòng, gói, ngày, khách) nằm trên URL; thông tin cá nhân của khách KHÔNG lên URL (sessionStorage).
import { stayQuery } from './stay'
import type { Stay } from './types'

// ponytail: tỉ lệ cọc cố định 30% — chờ kế toán chốt (review §"Trả 100% hay đặt cọc?"), đổi ở đây.
export const DEPOSIT_RATE = 0.3

/** Tiền cọc, làm tròn nghìn đồng. */
export const deposit = (total: number) => Math.round((total * DEPOSIT_RATE) / 1000) * 1000

/** Mã đặt phòng Rooty theo review §4.5: RH-{KS}-{yymmdd}-{seq 4 số}. */
export const bookingCode = (hotelCode: string, isoDate: string, seq: number) =>
  `RH-${hotelCode}-${isoDate.slice(2, 4)}${isoDate.slice(5, 7)}${isoDate.slice(8, 10)}-${String(seq % 10000).padStart(4, '0')}`

export interface Selection { hotel: string; room: string; plan?: string | null }

export const selectionQuery = (sel: Selection, stay: Stay) =>
  `${new URLSearchParams({ hotel: sel.hotel, room: sel.room, ...(sel.plan ? { plan: sel.plan } : {}) })}&${stayQuery(stay)}`

export const roomHref = (hotel: string, room: string, stay?: Stay, plan?: string | null) =>
  `/hotel/${hotel}/${room}${stay ? `?${stayQuery(stay)}${plan ? `&plan=${encodeURIComponent(plan)}` : ''}` : ''}`

export const CHILD_AGES = ['under6', '6to11', '12plus'] as const
export type ChildAge = (typeof CHILD_AGES)[number]
export const ARRIVALS = ['14-16', '16-18', '18-20', '20+'] as const // khung giờ đến → Gohost arrival_hour (lấy giờ đầu)
export const REQUESTS = ['quiet', 'high', 'early', 'occasion'] as const

/** Thông tin khách nhập ở bước 2 — tên field bám Gohost POST /bookings để sau này nối thẳng (docs/api-docs/gohost-api.md). */
export interface GuestDraft {
  name: string
  phone: string
  email: string
  country: string // ISO-2, Gohost customer.country
  self: boolean // người liên hệ cũng là khách nhận phòng
  guest: string // tên khách nhận phòng khi self = false
  children: ChildAge[]
  arrival: (typeof ARRIVALS)[number] | '' // '' = chưa rõ
  requests: (typeof REQUESTS)[number][]
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

export const NOTES_MAX = 500
export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim())
export const isPhone = (s: string) => /^\+?[\d\s.()-]{8,20}$/.test(s.trim()) && s.replace(/\D/g, '').length >= 9

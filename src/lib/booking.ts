// Luồng đặt phòng (bản minh hoạ, chỉ chạy trên trình duyệt — chưa POST Gohost, chưa cổng thanh toán).
// Lựa chọn (khách sạn, phòng, gói, ngày, khách) nằm trên URL; thông tin cá nhân của khách KHÔNG lên URL (sessionStorage).
import { stayQuery } from './stay'
import type { Stay } from '@/types/hotel'
import type { Arrival, ChildAge, StayRequest } from '@/types/booking'

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

// Thứ tự hiển thị trên form; kiểu ở src/types/booking.ts.
export const CHILD_AGES: ChildAge[] = ['under6', '6to11', '12plus']
export const ARRIVALS: Arrival[] = ['14-16', '16-18', '18-20', '20+']
export const REQUESTS: StayRequest[] = ['quiet', 'high', 'early', 'occasion']

export const NOTES_MAX = 500
export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim())
export const isPhone = (s: string) => /^\+?[\d\s.()-]{8,20}$/.test(s.trim()) && s.replace(/\D/g, '').length >= 9

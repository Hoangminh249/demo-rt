// /admin (chỉ xem): booking Gohost đã lọc field + kiểu trả về của /api/admin/* (src/api/admin.ts).
import type { HotelContent, RoomAvailability, RoomContent } from './hotel'
import type { GhRoomType, GohostErrorCode, GohostStatus } from './gohost'

// ---------- Booking (Gohost GET /bookings, /bookings/{id}) — chỉ admin, chỉ các field được phép (không CCCD, ảnh giấy tờ) ----------

/** Trạng thái booking Gohost (spec + gọi thật). Dùng cho bộ lọc và kiểm tham số ở /api/admin/bookings. */
export const BOOKING_STATUSES = ['new', 'confirmed', 'in_progress', 'finished', 'no_show', 'cancelled', 'merged'] as const

export interface BookingRow {
  code: string // mã booking Gohost (field `id`, 8 ký tự), dùng cho trang chi tiết
  status: string // new | confirmed | in_progress | finished | no_show | cancelled | merged
  payment_status: string | null // not_pay | … (mới thấy not_pay)
  checkin: string | null
  checkout: string | null
  amount: number | null
  currency: string
  customer: string | null
  phone: string | null // đã che phần giữa
  source: string | null
  rooms: string | null
}

export interface BookingDetail extends BookingRow {
  booked_at: string | null
  arrival_hour: string | null
  departure_hour: string | null
  payment_collect: string | null
  ota_code: string | null // source_reservation_code
  notes: string | null
  email: string | null // đã che phần trước @
  room_list: { room_type: string; unit: string | null; nights: number | null; adults: number; children: number; infants: number; breakfast: boolean; guests: { name: string; primary: boolean }[] }[]
  payments: number
}

export interface BookingPage { rows: BookingRow[]; page: number; lastPage: number; total: number }

/** ok = đọc được trên Gohost · none = nội dung chưa có tenant · unknown = không đọc được Gohost · missing = tenant không có trên Gohost */
export type ConnectState = 'ok' | 'none' | 'unknown' | 'missing'

export interface HotelCheck {
  slug: string
  name: string
  area: string
  opening: string | null
  cover: string | null
  tenant: string | null
  state: ConnectState
  ghRooms: GhRoomType[]
  unmappedGohost: GhRoomType[] // hạng trên Gohost chưa có nội dung → web không hiện
  orphanContent: RoomContent[] // nội dung trỏ tới ID không có trên Gohost
  unlinkedContent: RoomContent[] // nội dung chưa có gohost_room_type_id
  contentRooms: RoomContent[]
  photos: { src: string; label: string }[]
  roomsWithPhotos: number
  enMissing: number
  enReview: boolean
  pending: string[]
  fromPrice: number | null
}

export interface Issue { level: 'chan' | 'sua'; hotel: string; title: string; desc: string; go: string; href: string }
export interface ContentRow { label: string; value: string; viMissing: number; enMissing: number }
export interface GohostPropertyOption { id: string; title: string; prefix: string; hotel: string | null }

// ---------- Response của /api/admin/* ----------

type Err = GohostErrorCode | null

/** GET /api/admin/overview */
export interface AdminOverview { status: GohostStatus; error: Err; checks: HotelCheck[]; issues: Issue[] }
/** GET /api/admin/hotels/{slug} — properties: mọi property key đọc được, để chọn đúng ID khi khách sạn chưa nối */
export interface AdminHotel {
  check: HotelCheck
  error: Err
  content: HotelContent
  properties: { id: string; title: string; prefix: string; rooms: { id: string; title: string; quantity: number }[] }[] | null
  rows: ContentRow[]
}
/** GET /api/admin/hotels/{slug}/availability */
export interface AdminAvailability { rooms: RoomAvailability[] | null; error: Err }
/** GET /api/admin/properties */
export interface AdminProperties { properties: GohostPropertyOption[] | null; error: Err }
/** GET /api/admin/bookings */
export interface AdminBookings { data: BookingPage | null; error: Err }
/** GET /api/admin/bookings/{code} */
export interface AdminBooking { data: BookingDetail | null; error: Err }

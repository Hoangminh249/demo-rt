// Kiểu dữ liệu. Phần đọc từ Gohost giữ tên field của Gohost (docs/api-docs/gohost-api.md); phần nội dung
// (ảnh, mô tả, chính sách, bản dịch) là của Rooty, nằm ở src/content — Gohost API không có những thứ này.

export type Locale = 'vi' | 'en'

/** Chữ hai ngôn ngữ. Thiếu `en` thì web dùng `vi`, admin báo thiếu bản dịch. */
export interface L { vi: string; en?: string }

export type IconKey =
  | 'map-pin' | 'clock' | 'cable-car' | 'door-open' | 'plane' | 'bus' | 'ferris-wheel' | 'coffee' | 'wifi' | 'shirt'
  | 'receipt' | 'washing-machine'

// ---------- Nội dung Rooty (src/content) — không chứa giá, tồn, sức chứa: những thứ đó thuộc Gohost ----------

export interface InfoTableContent { caption: L; head: L[]; rows: L[][]; note?: L }

export interface RoomContent {
  gohost_room_type_id: string | null // null = chưa ánh xạ với Gohost → chưa có giá trực tuyến
  slug: string
  name: L
  size: L
  beds?: L
  view?: L
  features: L[]
  description: L
  note?: L // lưu ý bắt buộc phải báo khách trước khi đặt
  images: string[] // ảnh đầu là ảnh thẻ; [] = khung "Chưa có ảnh"
}

export interface HeroImage { src: string; focus: string }

export interface HotelContent {
  slug: string // rootyhospitality.com/hotel/{slug} — vĩnh viễn, không đổi
  code: string // mã Rooty (review §4.5), vd PITO
  gohost_tenant_id: string | null // null = chưa nối Gohost → web không có giá trực tuyến
  opening: string | null // 'YYYY-MM-DD'; ngày tương lai thì web hiện nhãn khai trương và chặn ngày nhận trước đó
  name: string
  area: L
  address: L
  map_query: string // ô tìm Google Maps
  operator: string // pháp nhân vận hành khách sạn
  tagline: L
  description: L
  highlights: L[]
  facts: { icon: IconKey; label: L; value: L }[]
  included: { icon: IconKey; label: L; desc?: L }[]
  not_available: L[]
  getting_here: { title: L; body?: L; tables: InfoTableContent[]; notes: L[] }[]
  policies: [label: L, text: L][]
  children: InfoTableContent | null
  cancel_summary: L // một dòng, hiện dưới gói giá (Gohost không có chính sách huỷ)
  faq: [q: L, a: L][]
  cover: string | null
  gallery: string[]
  /** Banner trang chủ: ảnh hợp khung ngang + điểm lấy nét (object-position) để không cắt mất chủ thể */
  hero: HeroImage[]
  rooms: RoomContent[]
  en_review?: boolean // bản tiếng Anh chưa được Marketing duyệt — admin báo
  pending: string[] // chỗ tài liệu mâu thuẫn chờ khách sạn xác nhận — chỉ admin hiện (docs/2026-10-07-du-lieu-that-va-admin.md §3)
}

export interface SiteContent {
  phone: string // dạng tel:
  phone_display: string
  zalo: string
  email: string
  owner: { name: string; id: string; address: L } // pháp nhân đứng tên website
}

/** Trang tĩnh (liên hệ, chính sách). `draft`: bản Rooty soạn, chờ pháp chế duyệt — web gắn nhãn. */
export type PageSlug = 'lien-he' | 'chinh-sach-huy' | 'chinh-sach-bao-mat' | 'dieu-khoan-dat-phong'
export interface PageSectionContent { id: string; title: L; body: L[]; list?: L[]; link?: { href: string; label: L } }
export interface PageContent { slug: PageSlug; eyebrow: L; title: L; lead: L; updated: string; draft: boolean; sections: PageSectionContent[] }
export interface PageSection { id: string; title: string; body: string[]; list?: string[]; link?: { href: string; label: string } }
export interface Page { slug: PageSlug; eyebrow: string; title: string; lead: string; updated: string; draft: boolean; sections: PageSection[] }

/** Kênh đặt phòng (Zalo / hotline / email) — chưa có đặt phòng trực tuyến. */
export type Contact = Pick<SiteContent, 'phone' | 'phone_display' | 'zalo' | 'email'>

// ---------- Bản đã chọn ngôn ngữ, đưa cho UI ----------

export interface InfoTable { caption: string; head: string[]; rows: string[][]; note?: string }

export interface Room {
  room_type_id: string | null
  slug: string
  name: string
  size: string
  beds?: string
  view?: string
  features: string[]
  description: string
  note?: string
  images: string[]
}

export interface Hotel {
  slug: string
  code: string
  online: boolean // đã nối Gohost (có tenant) → có giá và phòng trống trực tuyến
  opening: string | null
  name: string
  area: string
  address: string
  map_url: string
  operator: string
  tagline: string
  description: string
  highlights: string[]
  facts: { icon: IconKey; label: string; value: string }[]
  included: { icon: IconKey; label: string; desc?: string }[]
  not_available: string[]
  getting_here: { title: string; body?: string; tables: InfoTable[]; notes: string[] }[]
  policies: [label: string, text: string][]
  children: InfoTable | null
  cancel_summary: string
  faq: [q: string, a: string][]
  cover: string | null
  gallery: string[]
  hero: HeroImage[]
  rooms: Room[]
}

/** Khách sạn + phòng đưa cho các bước đặt phòng (repo.bookingTarget). */
export interface BookingTarget {
  hotel: { slug: string; code: string; name: string; online: boolean; opening: string | null; cancel_summary: string; address: string; map_url: string }
  room: Room
  times: { checkin: string; checkout: string }
  children: InfoTable | null
}

// ---------- Phòng trống + giá (Gohost GET /properties/{tenant}/room_types) ----------

export interface DayPrice { day: string; price: number } // Gohost days_breakdown

export interface PlanOffer {
  rate_plan_id: string
  title: string // tên gói trên Gohost (chưa có bản dịch)
  has_breakfast: boolean
  days_breakdown: DayPrice[]
  total: number // estimated_total_price
}

export interface RoomAvailability {
  room_type_id: string
  title: string // tên hạng phòng trên Gohost
  quantity: number // số phòng còn trống cho cả khoảng ngày
  occ_adults: number
  occ_children: number
  occ_infants: number
  plans: PlanOffer[]
}

export interface Stay { checkin: string; checkout: string; adults: number; children: number }

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

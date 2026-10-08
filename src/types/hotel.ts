// Khách sạn + phòng. Nội dung (ảnh, mô tả, chính sách, bản dịch) là của Rooty, ở src/content — Gohost API không có.
// Giá, tồn, sức chứa thuộc Gohost (đọc qua src/api/hotel.ts), giữ tên field của Gohost.
import type { IconKey, InfoTable, InfoTableContent, L } from './global'

// ---------- Nội dung Rooty (src/content) ----------

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

/** Kênh đặt phòng (Zalo / hotline / email). */
export type Contact = Pick<SiteContent, 'phone' | 'phone_display' | 'zalo' | 'email'>

// ---------- Bản đã chọn ngôn ngữ, đưa cho UI ----------

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

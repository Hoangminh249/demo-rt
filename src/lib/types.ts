// Kiểu dữ liệu. Tên field theo Gohost PMS API (docs/context/04-gohost-api.md) ở chỗ Gohost có dữ liệu;
// chỗ ghi [Rooty CMS] là nội dung Gohost API không có (ảnh, mô tả, tiện ích, chính sách) → Rooty tự quản.

export interface Hotel {
  id: string
  tenant_id: string // Gohost property tenant_id
  slug: string // rootyhospitality.com/hotel/{slug} — vĩnh viễn, không đổi
  name: string
  stars: number
  area: string // nhãn khu vực, vd "Nam đảo · Hòn Thơm" [Rooty CMS]
  address: string
  phone: string
  tagline: string
  description: string
  highlights: string[] // 3–4 ý, ý đầu hiện trên thẻ ở trang chủ
  facts: { icon: IconKey; label: string; value: string }[]
  amenities: { icon: IconKey; label: string }[]
  restaurants: { name: string; meta: string; desc: string; image: string }[]
  experiences: { name: string; desc: string; image: string; href: string }[]
  distances: [place: string, time: string][]
  policies: [label: string, text: string][]
  faq: [q: string, a: string][]
  map_url: string
  cover: string
  gallery: string[]
}

export type IconKey =
  | 'map-pin' | 'clock' | 'cable-car' | 'door-open' | 'plane' | 'waves' | 'umbrella' | 'baby' | 'flower' | 'dumbbell'
  | 'utensils' | 'martini' | 'wifi' | 'car' | 'parking' | 'store'

export interface RoomType {
  room_type_id: string // Gohost room_type id
  hotel_id: string
  slug: string
  name: string
  quantity: number // Gohost quantity (tổng số phòng)
  max_adults: number // Gohost occupancy
  max_children: number
  size_m2: number // [Rooty CMS]
  beds: string // [Rooty CMS]
  view: string // [Rooty CMS]
  base_price: number // giá gốc/đêm (Gohost default_rate)
  amenities: string[] // [Rooty CMS]
  description: string // [Rooty CMS]
  image: string // [Rooty CMS] — '' = chưa có ảnh
}

export interface RatePlan {
  rate_plan_id: string // Gohost rate_plan_id
  room_type_id: string
  name: string
  has_breakfast: boolean // Gohost has_breakfast
  free_cancel_days: number | null // [Rooty — Gohost API không có chính sách huỷ]
  factor: number // hệ số so với base_price
}

export interface DayPrice { day: string; price: number } // Gohost days_breakdown

export interface Stay { checkin: string; checkout: string; adults: number; children: number }

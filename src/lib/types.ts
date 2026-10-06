// Kiểu dữ liệu dùng chung. Tên field bám Gohost PMS Public API khi có
// (xem README §"Ánh xạ field → Gohost"). Field không có trong Gohost ghi chú [Rooty].

export type Area = 'bac-dao' | 'trung-tam' | 'nam-dao'
export type HotelTag = 'gan-bien' | 'ho-boi' | 'kids-club' | 'spa' | 'an-sang' | 'huy-mien-phi'

export interface Restaurant { name: string; cuisine: string; hours: string; desc: string }
export interface Hotel {
  id: string
  tenant_id: string // Gohost property tenant_id
  slug: string // đường dẫn rootyhospitality.com/{slug} [Rooty]
  name: string
  area: Area
  stars: number
  address: string
  phone: string
  email: string
  lat: number
  lng: number
  tagline: string
  description: string
  amenities: string[]
  tags: HotelTag[]
  restaurants: Restaurant[]
  experiences: { name: string; desc: string }[]
  policies: { checkin: string; checkout: string; cancel: string; children: string; pets: string }
  gallery: string[]
  cover: string
  hue: number // màu placeholder
}

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
  ocean_view: boolean
  family: boolean
  amenities: string[]
  description: string
  base_price: number // giá gói ăn sáng ngày thường, mùa chuẩn — sinh lịch giá
  public_rate: number // giá niêm yết cho đại lý [Rooty — Gohost không có]
  image: string
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

export type Channel = 'website' | 'agent' | 'ota' | 'offline'
export type Ota = 'Booking.com' | 'Agoda' | 'Traveloka'
// Gohost status: new, confirmed, in_progress, finished, no_show (+ cancelled)
export type BookingStatus = 'new' | 'confirmed' | 'checked_in' | 'finished' | 'cancelled' | 'no_show'
export type PaymentStatus = 'paid' | 'deposit' | 'credit' | 'unpaid'
export type PaymentCollect = 'property' | 'ota' | 'online' | '' // Gohost payment_collect
export type PaymentMethod = 'card' | 'qr' | 'transfer' | 'cash' | 'ota' | 'credit'

export interface BookingRoom { room_type_id: string; rate_plan_id: string; days_breakdown: DayPrice[] }
export interface BookingAddon { addon_id: string; name: string; qty: number; unit_price: number; total: number }
export interface Payment { id: string; at: string; method: PaymentMethod; amount: number; note?: string }
export interface TimelineEvent { at: string; by: string; text: string }
export interface Guest { name: string; phone: string; email: string; nationality: string }

export interface Booking {
  code: string
  hotel_id: string
  checkin_date: string
  checkout_date: string
  booking_rooms: BookingRoom[] // Gohost booking_rooms
  adults: number
  children: number
  child_ages?: number[]
  channel: Channel // [Rooty] nhóm kênh cho báo cáo
  source_name: string // Gohost source_name (chuỗi)
  ota?: Ota
  agent_id?: string // [Rooty — Gohost không có đại lý có id]
  source_commission?: number
  customer_id?: string // [Rooty CRM / TourWell]
  guest: Guest
  guests_list?: string[]
  status: BookingStatus
  payment_status: PaymentStatus
  payment_collect: PaymentCollect
  payments: Payment[]
  room_total: number
  discount: number
  promo_id?: string
  addons: BookingAddon[]
  addons_total: number
  total: number
  public_total?: number // đại lý: tổng theo giá niêm yết
  notes?: string
  arrival_hour?: string // Gohost arrival_hour
  invoice?: { company: string; tax_code: string; address: string }
  created_at: string // ISO datetime
  created_by: string
  timeline: TimelineEvent[]
}

export type Tier = 'Member' | 'Silver' | 'Gold' | 'Platinum'
export interface Voucher { code: string; desc: string; expires: string; used?: boolean }
export interface Customer {
  id: string
  name: string
  phone: string
  email: string
  nationality: string
  birthday: string
  tier: Tier
  points: number
  preferences: string[]
  family: boolean
  vouchers: Voucher[]
  note?: string
  created_at: string
}

export interface Agent {
  id: string
  name: string
  tax_code: string
  contact: string
  phone: string
  email: string
  address: string
  credit_limit: number
  discount: number // net = public × (1 − discount)
  commission_pct: number // hoa hồng thưởng doanh số (ghi nhận cuối tháng)
  net_overrides: Record<string, number> // room_type_id → net rate cố định
  status: 'active' | 'pending' | 'rejected'
  joined: string
  share: number // tỉ trọng sinh dữ liệu
}

export type PromoType = 'early-bird' | 'stay-longer' | 'family' | 'honeymoon' | 'package'
export interface Promotion {
  id: string
  slug: string
  type: PromoType
  name: string
  summary: string
  description: string
  perks: string[]
  discount_pct: number
  min_advance_days?: number
  min_nights?: number
  min_children?: number
  needs_code?: boolean // Honeymoon: khách chọn ưu đãi
  needs_addons?: string[] // Package: cần các nhóm add-on
  valid_from: string
  valid_to: string
  hotel_ids: string[] | 'all'
  active: boolean
  image: string
}

export type AddonCategory = 'transfer' | 'tour' | 'rivus' | 'spa' | 'dining'
export interface Addon {
  id: string
  name: string
  provider: 'Rooty Trip' | 'RIVUS' | 'Khách sạn'
  category: AddonCategory
  unit: 'trip' | 'person' | 'booking'
  price: number
  child_price?: number
  desc: string
  duration?: string
  image: string
}

export type AdminRole = 'executive' | 'hotel_manager' | 'sales' | 'accountant' | 'sysadmin'
export interface AdminUser { id: string; name: string; role: AdminRole; hotel_id?: string; email: string; title: string }

export interface Article {
  slug: string
  title: string
  excerpt: string
  category: string
  date: string
  read_min: number
  image: string
  body: string[]
  published: boolean
}

export interface Destination { slug: 'phu-quoc' | Area; name: string; desc: string; highlights: string[]; image: string }
export interface ExperienceGroup {
  slug: string
  name: string
  desc: string
  items: { name: string; desc: string }[]
  addon_ids: string[]
  image: string
}

export interface AgentApplication {
  id: string
  company: string
  tax_code: string
  contact: string
  phone: string
  email: string
  address: string
  note?: string
  submitted_at: string
  status: 'pending' | 'approved' | 'rejected'
}

export interface Lead { id: string; kind: 'mice' | 'wedding'; name: string; phone: string; email: string; date: string; guests: number; note: string; at: string }

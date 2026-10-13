// Kiểu trả về của /api/admin/*.
import type { RoomContent } from './hotel'
import type { GhRoomType, GohostErrorCode } from './gohost'
import type { L } from './global'

// ---------- Kết nối Gohost (chỉ xem, Cài đặt → Kết nối Gohost) ----------

/** ok = đọc được trên Gohost · none = chưa có tenant · unknown = không đọc được Gohost · missing = tenant không có trên Gohost */
export type ConnectState = 'ok' | 'none' | 'unknown' | 'missing'

export interface HotelCheck {
  tenant: string | null
  state: ConnectState
  ghRooms: GhRoomType[]
  orphanContent: RoomContent[] // hạng phòng trỏ tới ID không có trên Gohost
  unlinkedContent: RoomContent[] // hạng phòng chưa có gohost_room_type_id
  contentRooms: RoomContent[]
}

/** GET /api/admin/hotels/{slug} — properties: mọi property key đọc được, để chọn đúng ID khi khách sạn chưa nối */
export interface AdminHotel {
  check: HotelCheck
  error: GohostErrorCode | null
  properties: { id: string; title: string; prefix: string; rooms: { id: string; title: string; quantity: number }[] }[] | null
}

// ---------- Giá & tồn của Rooty (Postgres) — GET /api/admin/hotels/{slug}/rates, /plans ----------

export interface DbInventory { allotment: number; booked: number; held: number; closed: boolean; minStay: number; maxStay: number | null; cta: boolean; ctd: boolean }

/** Lịch một khoảng ngày: mỗi hạng phòng có tồn theo ngày + giá theo ngày của từng gói. Ngày thiếu = chưa có dòng (không bán). */
export interface AdminRates {
  from: string
  to: string
  roomTypes: {
    id: string; slug: string; name: L; status: string; totalRooms: number
    inventory: Record<string, DbInventory>
    plans: { id: string; code: string; name: L; isDefault: boolean; active: boolean; rates: Record<string, number> }[]
  }[]
}

export interface DbRule { id: string; name: string; startDate: string; endDate: string; weekdays: number[]; type: 'FIXED' | 'PERCENT'; value: number; priority: number; active: boolean }

export interface DbPlan {
  id: string; roomTypeId: string; code: string; name: L; mealPlan: 'RO' | 'BB' | 'HB' | 'FB' | 'AI'; refundable: boolean
  basePrice: number | null; extraAdultFee: number; extraChildFee: number
  cancellationPolicyId: string; depositPolicyId: string; isDefault: boolean; active: boolean
  gohostRatePlanId: string | null
  rules: DbRule[]
}

export interface DbCancelPolicy { id: string; name: string; description: L | null; tiers: { daysBefore: number; penaltyPercent: number }[]; noShowPercent: number; used: number }
export interface DbDepositPolicy { id: string; name: string; type: 'PERCENT' | 'FIXED' | 'FIRST_NIGHT' | 'FULL'; value: number; holdMinutes: number; balanceDueDaysBefore: number; used: number }

export interface AdminPlans {
  roomTypes: { id: string; slug: string; name: L; status: string; totalRooms: number; plans: DbPlan[] }[]
  cancellation: DbCancelPolicy[]
  deposit: DbDepositPolicy[]
}

/** Kết quả POST /api/admin/db. */
export interface AdminWriteResult { ok: true; message: string }

// ---------- Sản phẩm (Postgres) — GET /api/admin/catalog/{slug}, /amenities, /media, /promotions, /users ----------

export interface AdminMediaItem { id: string; path: string; alt: L | null; source: 'STATIC' | 'UPLOAD'; used: number }
export interface AdminMediaLink { mediaId: string; path: string; isCover: boolean; focus: string | null }

export interface AdminRoomTypeEdit {
  id: string; slug: string; status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  name: L; description: L; size: L; beds: L | null
  maxAdults: number; maxChildren: number; maxOccupancy: number; baseOccupancy: number; totalRooms: number; sortOrder: number
  gohostRoomTypeId: string | null
  content: { features: L[]; view?: L; tagline?: L; note?: L }
  rooms: { id: string; number: string; floor: number | null; note: string | null; active: boolean }[]
  media: AdminMediaLink[]
  bookings: number
}

export interface AdminHotelEdit {
  hotel: {
    id: string; slug: string; code: string; name: string; status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
    area: L; address: L; mapQuery: string; lat: number | null; lng: number | null; stars: number | null
    checkInTime: string; checkOutTime: string; phone: string | null; email: string | null; zalo: string | null; notifyEmail: string | null
    operator: string; openingDate: string | null; gohostTenantId: string | null; sortOrder: number
    content: import('@/lib/catalog-commands').HotelContentInput
    bookings: number
  }
  roomTypes: AdminRoomTypeEdit[]
  gallery: AdminMediaLink[]
  hero: AdminMediaLink[]
  amenities: { amenityId: string; available: boolean; description: L | null }[]
  taxFees: { id: string; name: L; type: 'PERCENT' | 'PER_NIGHT' | 'PER_BOOKING'; value: number; included: boolean; active: boolean; sortOrder: number }[]
}

export interface AdminAmenity { id: string; code: string; name: L; icon: string | null; used: number }

export interface AdminMediaLibrary { items: AdminMediaItem[]; uploadEnabled: boolean }

export interface AdminPromotion {
  id: string; code: string; name: L; type: 'PERCENT' | 'FIXED'; value: number
  hotelId: string | null; ratePlanId: string | null
  bookStart: string | null; bookEnd: string | null; stayStart: string | null; stayEnd: string | null
  minNights: number; maxRedemptions: number | null; perUserLimit: number | null; active: boolean; used: number
}
export interface AdminPromotions {
  items: AdminPromotion[]
  hotels: { id: string; name: string }[]
  ratePlans: { id: string; hotelId: string; label: string }[]
}

export interface AdminUser { id: string; name: string | null; email: string | null; role: 'CUSTOMER' | 'STAFF' | 'ADMIN'; createdAt: string; bookings: number }

// ---------- Booking web (Postgres) — GET /api/admin/orders, /orders/{code} ----------

export type OrderStatus = 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED' | 'NO_SHOW' | 'CHECKED_IN' | 'CHECKED_OUT'
export type OrderPaymentStatus = 'UNPAID' | 'DEPOSIT_PAID' | 'PAID' | 'PARTIALLY_REFUNDED' | 'REFUNDED'

export interface AdminOrderRow {
  code: string; status: OrderStatus; paymentStatus: OrderPaymentStatus; hotel: string
  checkIn: string; checkOut: string; guest: string; email: string; phone: string
  total: number; paidAmount: number; balanceDue: number; needsRefund: boolean; createdAt: string
}

export interface AdminOrders {
  rows: AdminOrderRow[]; total: number; page: number; pages: number
  hotels: { slug: string; name: string }[]
  needsRefund: number
}

export interface AdminOrder {
  code: string; status: OrderStatus; paymentStatus: OrderPaymentStatus; source: string
  hotel: { slug: string; name: string }
  checkIn: string; checkOut: string; adults: number; children: number; childAges: number[]
  contact: { name: string; phone: string; email: string; guestName: string | null; account: string | null }
  specialRequests: string | null
  room: string; plan: string; rooms: { roomType: string; adults: number; children: number; nights: { date: string; price: number; extraFee: number }[] }[]
  subtotal: number; discount: number; promoCode: string | null; taxFees: number; total: number
  depositAmount: number; paidAmount: number; balanceDue: number; balanceDueAt: string | null
  holdExpiresAt: string | null; needsRefund: boolean; cancelledAt: string | null; cancelReason: string | null; createdAt: string
  cancellation: string
  preview: { penalty: number; refund: number; noShow: number; noShowRefund: number } | null
  payments: { id: string; kind: string; provider: string; amount: number; status: string; paidAt: string | null; createdAt: string }[]
  refunds: { id: string; amount: number; status: 'PENDING' | 'DONE' | 'REJECTED'; reason: string; processedAt: string | null; createdAt: string }[]
  history: { from: string | null; to: string; by: string | null; note: string | null; at: string }[]
  emails: { template: string; to: string; status: string; error: string | null; at: string }[]
}

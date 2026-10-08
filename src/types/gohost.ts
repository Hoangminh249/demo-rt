// Gohost PMS Public API — kiểu response thô, giữ nguyên tên field (spec: docs/api-docs/gohost-api.md, đã đối chiếu response thật).
// Chỉ server dùng kiểu thô; UI nhận bản đã ghép nội dung ở src/types/hotel.ts.

/** Mọi response: `{ success, data, pagination? }`. Lỗi (success ≠ true) được src/lib/gohost.ts đổi thành GohostError. */
export interface GhResponse<T> { success: boolean; data: T; pagination?: GhPagination }
export interface GhPagination { current_page: number; last_page: number; per_page: number; total: number }

// ---------- GET /properties ----------

export interface GhRatePlan {
  id: string; title: string; is_default: boolean; rate_plan_type: string; currency: string; sell_mode: string
  default_rate: number; default_rates: number[] /* 7 giá T2 → CN */; min_rate: number | null; max_rate: number | null
  min_stay: number | null; max_stay: number | null
}
export interface GhRoomType {
  id: string; title: string; notes: string | null; quantity: number; room_kind: string; is_virtual: boolean
  occ_adults: number; occ_children: number; occ_infants: number; rate_plans: GhRatePlan[]
}
export interface GhProperty { id: string; prefix: string; title: string; property_type: string; currency: string; timezone: string; room_types: GhRoomType[] }

// ---------- GET /properties/{tenant}/room_types?checkin_date&checkout_date ----------
// data[] = { room_types: GhAvailRoomType } (object, đã kiểm response thật 08/10/2026)

export interface GhAvailRatePlan { id: string; title: string; currency: string; sell_mode?: string; is_default?: boolean; has_breakfast: boolean; days_breakdown: { day: string; price: number }[]; estimated_total_price: number }
export interface GhAvailRoomType { id: string; title: string; quantity: number; occ_adults: number; occ_children: number; occ_infants: number; rate_plans: GhAvailRatePlan[] }

// ---------- Lỗi + trạng thái lượt gọi (admin) ----------

export type GohostErrorCode = 'NOT_CONFIGURED' | 'RATE_LIMITED' | 'UPSTREAM' | 'NOT_FOUND'

export interface GohostStatus {
  configured: boolean
  budget: number
  budgetLeft: number
  cooldownUntil: number
  last: { at: number; path: string; status: number | 'network' } | null
  lastError: { at: number; code: GohostErrorCode } | null
}

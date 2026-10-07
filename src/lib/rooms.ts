// Logic thuần ghép nội dung phòng (Rooty) với phòng trống + giá (Gohost). Dùng ở cả server (repo) và trình duyệt (khối Chọn phòng),
// nên không import gì của server. Kiểm bằng scripts/check.ts.
import type { PlanOffer, Room, RoomAvailability, Stay } from './types'

/** Giá thấp nhất/đêm trong danh mục Gohost: giá mặc định T2 → CN của các gói VND, chỉ hạng phòng thật đã ánh xạ. */
export function minDefaultRate(
  roomTypes: { id: string; is_virtual: boolean; rate_plans?: { currency: string; default_rates?: number[] }[] }[],
  mapped: Set<string>,
): number | null {
  const prices = roomTypes
    .filter(rt => mapped.has(rt.id) && !rt.is_virtual)
    .flatMap(rt => rt.rate_plans ?? [])
    .filter(p => p.currency === 'VND')
    .flatMap(p => p.default_rates ?? [])
    .filter(n => typeof n === 'number' && n > 0)
  return prices.length ? Math.min(...prices) : null
}

export type RoomState =
  | 'available' // còn phòng, đủ chỗ cho đoàn → hiện gói giá
  | 'sold_out' // Gohost báo hết phòng cho khoảng ngày này
  | 'too_small' // còn phòng nhưng không đủ chỗ cho số khách đã chọn
  | 'no_rates' // còn phòng nhưng Gohost không trả gói giá nào
  | 'unmapped' // nội dung chưa gắn với hạng phòng Gohost → chưa có giá trực tuyến

export interface RoomOffer { room: Room; state: RoomState; left: number; occ: { adults: number; children: number } | null; plans: PlanOffer[] }

/** Ghép theo room_type_id. `avail` = kết quả Gohost (đã tải xong) cho khoảng ngày của `stay`. */
export function mergeRooms(rooms: Room[], avail: RoomAvailability[], stay: Pick<Stay, 'adults' | 'children'>): RoomOffer[] {
  return rooms.map(room => {
    const a = room.room_type_id ? avail.find(x => x.room_type_id === room.room_type_id) : undefined
    if (!a) return { room, state: 'unmapped', left: 0, occ: null, plans: [] }
    const occ = { adults: a.occ_adults, children: a.occ_children }
    // Gohost trả occ_* = 0 khi hạng phòng không khai sức chứa → không chặn theo số khách.
    const fits = (!occ.adults || stay.adults <= occ.adults) && (!occ.adults || stay.children <= occ.children)
    const state: RoomState = a.quantity <= 0 ? 'sold_out' : !fits ? 'too_small' : a.plans.length ? 'available' : 'no_rates'
    return { room, state, left: a.quantity, occ, plans: a.plans }
  })
}

/** Giá trung bình/đêm của một gói, làm tròn nghìn đồng. */
export const nightly = (p: PlanOffer) => (p.days_breakdown.length ? Math.round(p.total / p.days_breakdown.length / 1000) * 1000 : p.total)

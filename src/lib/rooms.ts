// Logic thuần ghép nội dung phòng với phòng trống + giá (Postgres, qua /api/hotels/{slug}/rooms). Dùng ở cả server và trình duyệt (khối Chọn phòng),
// nên không import gì của server. Kiểm bằng scripts/check.ts.
import type { PlanOffer, Room, RoomAvailability, Stay } from '@/types/hotel'

export type RoomState =
  | 'available' // còn phòng, đủ chỗ cho đoàn → hiện gói giá
  | 'sold_out' // hết phòng cho khoảng ngày này
  | 'too_small' // còn phòng nhưng không đủ chỗ cho số khách đã chọn
  | 'no_rates' // còn phòng nhưng chưa có gói giá nào cho khoảng ngày
  | 'unmapped' // hạng phòng không có trong kết quả (chưa có tồn / giá) → liên hệ đặt phòng

export interface RoomOffer { room: Room; state: RoomState; left: number; occ: { adults: number; children: number } | null; plans: PlanOffer[] }

/** Ghép theo room_type_id. `avail` = kết quả đã tải xong cho khoảng ngày của `stay`. */
export function mergeRooms(rooms: Room[], avail: RoomAvailability[], stay: Pick<Stay, 'adults' | 'children'>): RoomOffer[] {
  return rooms.map(room => {
    const a = avail.find(x => x.room_type_id === room.room_type_id)
    if (!a) return { room, state: 'unmapped', left: 0, occ: null, plans: [] }
    const occ = { adults: a.occ_adults, children: a.occ_children }
    // occ_* = 0 khi hạng phòng không khai sức chứa → không chặn theo số khách.
    const fits = (!occ.adults || stay.adults <= occ.adults) && (!occ.adults || stay.children <= occ.children)
    const state: RoomState = a.quantity <= 0 ? 'sold_out' : !fits ? 'too_small' : a.plans.length ? 'available' : 'no_rates'
    return { room, state, left: a.quantity, occ, plans: a.plans }
  })
}


/** Gộp các đêm liền nhau cùng giá (days_breakdown đã liên tục theo ngày): 30 đêm thường chỉ còn vài dòng. */
export function priceRuns(days: { day: string; price: number }[]) {
  const runs: { from: string; to: string; price: number; nights: number }[] = []
  for (const d of days) {
    const last = runs.at(-1)
    if (last?.price === d.price) { last.to = d.day; last.nights++ } else runs.push({ from: d.day, to: d.day, price: d.price, nights: 1 })
  }
  return runs
}

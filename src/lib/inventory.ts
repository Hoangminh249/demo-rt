// Tồn phòng theo ngày × hạng phòng × kênh. Tồn = tổng − đã bán (đếm từ booking) − đóng bán.
// Không có bảng tồn riêng → một nguồn sự thật. Ngoài đời: tồn chỉ nằm ở Gohost (nguyên tắc 3).
import type { Booking, Channel, RoomType } from './types'
import { nightsBetween } from './format'

export type SoldByChannel = Record<Channel, number>
export type SoldIndex = Map<string, Map<string, SoldByChannel>> // room_type_id → day → sold

const consumes = (b: Booking) => b.status !== 'cancelled'

export function buildSoldIndex(bookings: Booking[]): SoldIndex {
  const idx: SoldIndex = new Map()
  for (const b of bookings) {
    if (!consumes(b)) continue
    for (const room of b.booking_rooms) {
      let byDay = idx.get(room.room_type_id)
      if (!byDay) idx.set(room.room_type_id, (byDay = new Map()))
      for (const day of nightsBetween(b.checkin_date, b.checkout_date)) {
        let s = byDay.get(day)
        if (!s) byDay.set(day, (s = { website: 0, agent: 0, ota: 0, offline: 0 }))
        s[b.channel]++
      }
    }
  }
  return idx
}

export interface InventoryCell extends SoldByChannel { day: string; total: number; sold: number; left: number; closed: boolean }

export const closureKey = (room_type_id: string, day: string) => `${room_type_id}|${day}`

export function cell(idx: SoldIndex, rt: RoomType, day: string, closures: Set<string>): InventoryCell {
  const s = idx.get(rt.room_type_id)?.get(day) ?? { website: 0, agent: 0, ota: 0, offline: 0 }
  const sold = s.website + s.agent + s.ota + s.offline
  const closed = closures.has(closureKey(rt.room_type_id, day))
  return { day, total: rt.quantity, ...s, sold, left: closed ? 0 : Math.max(0, rt.quantity - sold), closed }
}

/** Số phòng còn bán được cho cả khoảng ngày = min theo từng đêm. */
export const availability = (idx: SoldIndex, rt: RoomType, checkin: string, checkout: string, closures: Set<string>) =>
  Math.min(...nightsBetween(checkin, checkout).map(d => cell(idx, rt, d, closures).left))

export const stockLevel = (left: number, total: number): 'out' | 'low' | 'ok' =>
  left <= 0 ? 'out' : left <= Math.max(2, Math.round(total * 0.15)) ? 'low' : 'ok'

// Chỉ số dashboard — TÍNH từ booking, không hardcode.
// Quy ước: Tổng booking & huỷ & cơ cấu kênh tính theo booking có ngày nhận phòng trong kỳ.
// Room nights, doanh thu phòng, occupancy, ADR tính theo đêm lưu trú rơi vào kỳ (không tính booking huỷ).
// Doanh thu phòng = giá phòng sau giảm giá (đại lý: giá net; OTA: giá bán gồm hoa hồng).
import type { Agent, Booking, Channel, Hotel, RoomType } from './types'
import { TODAY, addDays, diffDays, nightsBetween } from './format'

export interface Period { from: string; to: string } // gồm cả 2 đầu

export const inPeriod = (d: string, p: Period) => d >= p.from && d <= p.to
export const periodDays = (p: Period) => diffDays(p.from, p.to) + 1
export const previousPeriod = (p: Period): Period => ({ from: addDays(p.from, -periodDays(p)), to: addDays(p.from, -1) })

const nightRevenueFactor = (b: Booking) => (b.room_total ? (b.room_total - b.discount) / b.room_total : 1)

export interface Kpis {
  bookings: number
  cancelled: number
  roomNights: number
  revenue: number
  availableRN: number
  occupancy: number
  adr: number
  channelCount: Record<Channel, number>
  channelRevenue: Record<Channel, number>
  direct: number
  agent: number
  ota: number
  cancellation: number
}

export function kpis(bookings: Booking[], roomTypes: RoomType[], p: Period): Kpis {
  const rtIds = new Set(roomTypes.map(r => r.room_type_id))
  const channelCount: Record<Channel, number> = { website: 0, offline: 0, agent: 0, ota: 0 }
  const channelRevenue: Record<Channel, number> = { website: 0, offline: 0, agent: 0, ota: 0 }
  let count = 0, cancelled = 0, rn = 0, revenue = 0
  for (const b of bookings) {
    if (!b.booking_rooms.some(r => rtIds.has(r.room_type_id))) continue
    if (inPeriod(b.checkin_date, p)) {
      count++
      if (b.status === 'cancelled') cancelled++
      else channelCount[b.channel]++
    }
    if (b.status === 'cancelled' || b.checkout_date <= p.from || b.checkin_date > p.to) continue
    const f = nightRevenueFactor(b)
    for (const room of b.booking_rooms) for (const d of room.days_breakdown) {
      if (!inPeriod(d.day, p)) continue
      rn++
      revenue += d.price * f
      channelRevenue[b.channel] += d.price * f
    }
  }
  const availableRN = roomTypes.reduce((s, r) => s + r.quantity, 0) * periodDays(p)
  const active = count - cancelled || 1
  return {
    bookings: count, cancelled, roomNights: rn, revenue, availableRN,
    occupancy: availableRN ? rn / availableRN : 0, adr: rn ? revenue / rn : 0,
    channelCount, channelRevenue,
    direct: (channelCount.website + channelCount.offline) / active,
    agent: channelCount.agent / active,
    ota: channelCount.ota / active,
    cancellation: count ? cancelled / count : 0,
  }
}

export function dailyRevenue(bookings: Booking[], roomTypes: RoomType[], p: Period) {
  const rtIds = new Set(roomTypes.map(r => r.room_type_id))
  const days = nightsBetween(p.from, addDays(p.to, 1))
  const map = new Map(days.map(d => [d, { day: d, website: 0, offline: 0, agent: 0, ota: 0, rn: 0 }]))
  for (const b of bookings) {
    if (b.status === 'cancelled' || b.checkout_date <= p.from || b.checkin_date > p.to) continue
    const f = nightRevenueFactor(b)
    for (const room of b.booking_rooms) {
      if (!rtIds.has(room.room_type_id)) continue
      for (const d of room.days_breakdown) {
        const row = map.get(d.day)
        if (row) { row[b.channel] += d.price * f; row.rn++ }
      }
    }
  }
  return [...map.values()]
}

export function byRoomType(bookings: Booking[], roomTypes: RoomType[], p: Period) {
  const rows = new Map(roomTypes.map(r => [r.room_type_id, { rt: r, rn: 0, revenue: 0 }]))
  for (const b of bookings) {
    if (b.status === 'cancelled' || b.checkout_date <= p.from || b.checkin_date > p.to) continue
    const f = nightRevenueFactor(b)
    for (const room of b.booking_rooms) {
      const row = rows.get(room.room_type_id)
      if (!row) continue
      for (const d of room.days_breakdown) if (inPeriod(d.day, p)) { row.rn++; row.revenue += d.price * f }
    }
  }
  const days = periodDays(p)
  return [...rows.values()].map(r => ({ ...r, occupancy: r.rn / (r.rt.quantity * days), adr: r.rn ? r.revenue / r.rn : 0 }))
}

export function byHotel(bookings: Booking[], hotels: Hotel[], roomTypes: RoomType[], p: Period) {
  return hotels.map(h => {
    const rts = roomTypes.filter(r => r.hotel_id === h.id)
    return { hotel: h, ...kpis(bookings.filter(b => b.hotel_id === h.id), rts, p) }
  })
}

export function byAgent(bookings: Booking[], agents: Agent[], p: Period) {
  return agents.map(a => {
    const list = bookings.filter(b => b.agent_id === a.id && inPeriod(b.checkin_date, p) && b.status !== 'cancelled')
    const revenue = list.reduce((s, b) => s + b.room_total - b.discount, 0)
    // Công nợ = đã phát sinh (khách đã nhận phòng, chưa đối soát). Booking tương lai ghi nợ chỉ chiếm hạn mức.
    const credit = bookings.filter(b => b.agent_id === a.id && b.payment_status === 'credit' && b.status !== 'cancelled')
    const debt = credit.filter(b => b.checkin_date <= TODAY).reduce((s, b) => s + b.total, 0)
    const exposure = credit.reduce((s, b) => s + b.total, 0)
    const rn = list.reduce((s, b) => s + b.booking_rooms.length * diffDays(b.checkin_date, b.checkout_date), 0)
    return { agent: a, bookings: list.length, rn, revenue, debt, exposure, commission: (revenue * a.commission_pct) / 100 }
  })
}

/** Khách quay lại: booking trong kỳ của khách đã có booking trước đó. */
export function returning(bookings: Booking[], p: Period) {
  const firstStay = new Map<string, string>()
  for (const b of bookings) {
    if (!b.customer_id || b.status === 'cancelled') continue
    const prev = firstStay.get(b.customer_id)
    if (!prev || b.checkin_date < prev) firstStay.set(b.customer_id, b.checkin_date)
  }
  const inP = bookings.filter(b => b.customer_id && b.status !== 'cancelled' && inPeriod(b.checkin_date, p))
  const ret = inP.filter(b => firstStay.get(b.customer_id!)! < b.checkin_date)
  return { identified: inP.length, returning: ret.length, customers: new Set(ret.map(b => b.customer_id)).size }
}

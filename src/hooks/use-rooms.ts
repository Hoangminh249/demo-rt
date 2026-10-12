// Website — phòng trống + giá từng đêm của một khách sạn (GET /api/hotels/{slug}/rooms, server mới gọi Gohost).
// Khoá theo (khách sạn, ngày nhận, ngày trả): đổi số khách không gọi lại, quay lại ngày cũ thì lấy ngay từ cache.
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/http'
import type { DayPrice, RoomAvailability } from '@/types/hotel'

export const roomKeys = {
  availability: (slug: string, checkin: string, checkout: string) => ['rooms', slug, checkin, checkout] as const,
  calendar: (slug: string) => ['calendar', slug] as const,
}

/** Giá thấp nhất từng đêm, 90 ngày (GET /api/hotels/{slug}/calendar). Chỉ bật khi KS có lịch giá (nguồn db). Lỗi → không hiện giá. */
export function useHotelCalendar(slug: string, enabled: boolean) {
  return useQuery({
    queryKey: roomKeys.calendar(slug),
    queryFn: () => api.get<DayPrice[]>(`/hotels/${slug}/calendar`).then(r => new Map(r.data.map(d => [d.day, d.price]))),
    enabled,
    staleTime: 60_000,
  })
}

export function useRoomAvailability(slug: string, checkin: string, checkout: string, enabled: boolean) {
  return useQuery({
    queryKey: roomKeys.availability(slug, checkin, checkout),
    queryFn: () => api.get<RoomAvailability[]>(`/hotels/${slug}/rooms`, { params: { in: checkin, out: checkout } }).then(r => r.data),
    enabled,
    staleTime: 3 * 60_000, // bằng cache phía server (src/lib/gohost.ts)
  })
}

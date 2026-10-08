// Website — phòng trống + giá từng đêm của một khách sạn (GET /api/hotels/{slug}/rooms, server mới gọi Gohost).
// Khoá theo (khách sạn, ngày nhận, ngày trả): đổi số khách không gọi lại, quay lại ngày cũ thì lấy ngay từ cache.
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/http'
import type { RoomAvailability } from '@/types/hotel'

export const roomKeys = {
  availability: (slug: string, checkin: string, checkout: string) => ['rooms', slug, checkin, checkout] as const,
}

export function useRoomAvailability(slug: string, checkin: string, checkout: string, enabled: boolean) {
  return useQuery({
    queryKey: roomKeys.availability(slug, checkin, checkout),
    queryFn: () => api.get<RoomAvailability[]>(`/hotels/${slug}/rooms`, { params: { in: checkin, out: checkout } }).then(r => r.data),
    enabled,
    staleTime: 3 * 60_000, // bằng cache phía server (src/lib/gohost.ts)
  })
}

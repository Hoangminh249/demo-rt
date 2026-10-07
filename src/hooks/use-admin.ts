// Admin — mọi dữ liệu đọc qua /api/admin/* (route handler kiểm phiên rồi mới gọi Gohost ở server).
// Component admin chỉ gọi các hook dưới đây; khoá cache tập trung ở adminKeys để làm mới đúng chỗ.
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/http'
import type { availabilityCheck, bookingDetail, bookingList, contentRows, gohostProperties, hotelCheck, overview } from '@/lib/repo/admin'

export type AdminOverview = Awaited<ReturnType<typeof overview>>
export type AdminHotel = NonNullable<Awaited<ReturnType<typeof hotelCheck>>> & { rows: ReturnType<typeof contentRows> }
export type AdminAvailability = Awaited<ReturnType<typeof availabilityCheck>>
export type AdminProperties = Awaited<ReturnType<typeof gohostProperties>>
export type AdminBookings = Awaited<ReturnType<typeof bookingList>>
export type AdminBooking = Awaited<ReturnType<typeof bookingDetail>>
export interface BookingQuery { property: string; in: string; out: string; status: string; page: number }

export const adminKeys = {
  all: ['admin'] as const,
  overview: () => [...adminKeys.all, 'overview'] as const,
  hotel: (slug: string) => [...adminKeys.all, 'hotel', slug] as const,
  availability: (slug: string, checkin: string, checkout: string) => [...adminKeys.hotel(slug), 'availability', checkin, checkout] as const,
  properties: () => [...adminKeys.all, 'properties'] as const,
  bookings: (q: BookingQuery) => [...adminKeys.all, 'bookings', q] as const,
  booking: (property: string, code: string) => [...adminKeys.all, 'booking', property, code] as const,
}

const get = <T>(url: string, params?: object) => api.get<T>(url, { params }).then(r => r.data)

/** Tổng quan: dùng chung cho trang Tổng quan và số việc cần xử lý trên sidebar (một lần gọi). */
export const useAdminOverview = () => useQuery({ queryKey: adminKeys.overview(), queryFn: () => get<AdminOverview>('/admin/overview') })

export const useAdminHotel = (slug: string) => useQuery({ queryKey: adminKeys.hotel(slug), queryFn: () => get<AdminHotel>(`/admin/hotels/${slug}`) })

/** Giá & phòng trống cho tab "Giá": chỉ gọi khi đã có khoảng ngày (null = chưa bấm "Xem giá"). */
export const useAdminAvailability = (slug: string, stay: { checkin: string; checkout: string } | null) => useQuery({
  queryKey: adminKeys.availability(slug, stay?.checkin ?? '', stay?.checkout ?? ''),
  queryFn: () => get<AdminAvailability>(`/admin/hotels/${slug}/availability`, { in: stay!.checkin, out: stay!.checkout }),
  enabled: !!stay,
  staleTime: 3 * 60_000,
})

/** Property Gohost mà key đọc được (danh mục, server cache 1 giờ). */
export const useGohostProperties = () => useQuery({ queryKey: adminKeys.properties(), queryFn: () => get<AdminProperties>('/admin/properties'), staleTime: 10 * 60_000 })

/** Danh sách booking: giữ trang cũ trên màn trong lúc tải trang mới (không nháy về khung chờ khi bấm phân trang). */
export const useAdminBookings = (q: BookingQuery | null) => useQuery({
  queryKey: adminKeys.bookings(q ?? { property: '', in: '', out: '', status: '', page: 1 }),
  queryFn: () => get<AdminBookings>('/admin/bookings', { ...q, status: q!.status === 'all' ? undefined : q!.status }),
  enabled: !!q,
  placeholderData: keepPreviousData,
  staleTime: 30_000,
})

export const useAdminBooking = (property: string | null, code: string) => useQuery({
  queryKey: adminKeys.booking(property ?? '', code),
  queryFn: () => get<AdminBooking>(`/admin/bookings/${encodeURIComponent(code)}`, { property }),
  enabled: !!property,
})

export const useLogin = () => useMutation({
  mutationFn: (v: { user: string; password: string }) => api.post('/admin/session', v),
})

export function useLogout() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: () => api.delete('/admin/session'),
    onSuccess: () => {
      client.removeQueries({ queryKey: adminKeys.all })
      // Tải lại hẳn trang đăng nhập: không còn trạng thái hay dữ liệu admin nào trong bộ nhớ trình duyệt.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign('/admin/login')
    },
  })
}

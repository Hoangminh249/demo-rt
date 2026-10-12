// Admin — mọi dữ liệu đọc qua /api/admin/* (route handler kiểm phiên rồi mới gọi Gohost ở server).
// Component admin chỉ gọi các hook dưới đây; khoá cache tập trung ở adminKeys để làm mới đúng chỗ.
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/http'
import type { Command } from '@/lib/admin-commands'
import type { AdminAvailability, AdminBooking, AdminBookings, AdminHotel, AdminOverview, AdminPlans, AdminProperties, AdminRates, AdminWriteResult } from '@/types/admin'

/** Query của GET /api/admin/bookings (phía trình duyệt). */
export interface BookingQuery { property: string; in: string; out: string; status: string; page: number }

export const adminKeys = {
  all: ['admin'] as const,
  overview: () => [...adminKeys.all, 'overview'] as const,
  hotel: (slug: string) => [...adminKeys.all, 'hotel', slug] as const,
  availability: (slug: string, checkin: string, checkout: string) => [...adminKeys.hotel(slug), 'availability', checkin, checkout] as const,
  properties: () => [...adminKeys.all, 'properties'] as const,
  bookings: (q: BookingQuery) => [...adminKeys.all, 'bookings', q] as const,
  booking: (property: string, code: string) => [...adminKeys.all, 'booking', property, code] as const,
  rates: (slug: string, from: string, to: string) => [...adminKeys.hotel(slug), 'rates', from, to] as const,
  plans: (slug: string) => [...adminKeys.hotel(slug), 'plans'] as const,
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

// ---------- Postgres của Rooty: lịch giá & tồn, gói giá, chính sách ----------

/** Lịch giá + tồn web một khoảng ngày (≤ 62 ngày). Giữ tháng cũ trên màn khi chuyển tháng. */
export const useAdminRates = (slug: string, from: string, to: string) => useQuery({
  queryKey: adminKeys.rates(slug, from, to),
  queryFn: () => get<AdminRates>(`/admin/hotels/${slug}/rates`, { from, to }),
  placeholderData: keepPreviousData,
})

export const useAdminPlans = (slug: string) => useQuery({ queryKey: adminKeys.plans(slug), queryFn: () => get<AdminPlans>(`/admin/hotels/${slug}/plans`) })

/** Mọi lệnh ghi (POST /api/admin/db). Xong thì làm mới mọi dữ liệu của khách sạn (lịch, gói, chính sách). */
export function useAdminWrite(slug: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (c: Command) => api.post<AdminWriteResult>('/admin/db', c).then(r => r.data),
    onSuccess: () => client.invalidateQueries({ queryKey: adminKeys.hotel(slug) }),
  })
}

/** Câu báo lỗi từ /api/admin (message tiếng Việt của server), không có thì câu chung. */
export function adminErrorText(e: unknown): string {
  const res = (e as { response?: { status?: number; data?: { error?: string; message?: string } } })?.response
  if (res?.data?.message) return res.data.message
  if (res?.data?.error === 'DB_UNAVAILABLE') return 'Chưa có Postgres: đặt DATABASE_URL rồi chạy lại.'
  if (res?.data?.error === 'DB_ERROR') return 'Không kết nối được Postgres (service đang tắt?). Bật lại rồi thử lại.'
  return 'Không lưu được. Kiểm tra mạng rồi thử lại.'
}

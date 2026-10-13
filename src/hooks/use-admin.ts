// Admin — mọi dữ liệu đọc qua /api/admin/* (route handler kiểm phiên ở server).
// Component admin chỉ gọi các hook dưới đây; khoá cache tập trung ở adminKeys để làm mới đúng chỗ.
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/http'
import type { Command } from '@/lib/admin-commands'
import type { CatalogCommand } from '@/lib/catalog-commands'
import type { OrderCommand } from '@/lib/order-commands'
import type { AdminAmenity, AdminHotel, AdminHotelEdit, AdminMediaLibrary, AdminOrder, AdminOrders, AdminPlans, AdminPromotions, AdminRates, AdminUser, AdminWriteResult } from '@/types/admin'

export const adminKeys = {
  all: ['admin'] as const,
  hotel: (slug: string) => [...adminKeys.all, 'hotel', slug] as const,
  rates: (slug: string, from: string, to: string) => [...adminKeys.hotel(slug), 'rates', from, to] as const,
  plans: (slug: string) => [...adminKeys.hotel(slug), 'plans'] as const,
  edit: (slug: string) => [...adminKeys.hotel(slug), 'edit'] as const,
  amenities: () => [...adminKeys.all, 'amenities'] as const,
  media: () => [...adminKeys.all, 'media'] as const,
  promotions: () => [...adminKeys.all, 'promotions'] as const,
  users: () => [...adminKeys.all, 'users'] as const,
  orders: (q: OrdersFilter) => [...adminKeys.all, 'orders', q] as const,
  order: (code: string) => [...adminKeys.all, 'order', code] as const,
}

/** Bộ lọc danh sách booking web (trên URL của trang /admin/orders). */
export interface OrdersFilter { status?: string; hotel?: string; from?: string; to?: string; refund?: string; q?: string; page?: string }

const get = <T>(url: string, params?: object) => api.get<T>(url, { params }).then(r => r.data)

/** Thông tin khách sạn + trạng thái nối Gohost (tab Cài đặt → Kết nối Gohost). */
export const useAdminHotel = (slug: string) => useQuery({ queryKey: adminKeys.hotel(slug), queryFn: () => get<AdminHotel>(`/admin/hotels/${slug}`) })

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

/** Mọi lệnh ghi (POST /api/admin/db): giá/tồn/gói/chính sách và sản phẩm. Xong thì làm mới mọi dữ liệu admin đang mở
 * (một lệnh có thể đổi nhiều màn: vd thêm hạng phòng → lịch, gói, khuyến mãi). */
export function useAdminWrite() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (c: Command | CatalogCommand) => api.post<AdminWriteResult>('/admin/db', c).then(r => r.data),
    onSuccess: () => client.invalidateQueries({ queryKey: adminKeys.all }),
  })
}

// ---------- Sản phẩm ----------

export const useAdminHotelEdit = (slug: string) => useQuery({ queryKey: adminKeys.edit(slug), queryFn: () => get<AdminHotelEdit>(`/admin/catalog/${slug}`) })
export const useAdminAmenities = () => useQuery({ queryKey: adminKeys.amenities(), queryFn: () => get<AdminAmenity[]>('/admin/amenities') })
export const useAdminMedia = () => useQuery({ queryKey: adminKeys.media(), queryFn: () => get<AdminMediaLibrary>('/admin/media') })
export const useAdminPromotions = () => useQuery({ queryKey: adminKeys.promotions(), queryFn: () => get<AdminPromotions>('/admin/promotions') })
export const useAdminUsers = () => useQuery({ queryKey: adminKeys.users(), queryFn: () => get<AdminUser[]>('/admin/users') })

/** Tải ảnh lên (multipart). Chỉ chạy khi server có UPLOAD_DIR. */
export function useUploadMedia() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (files: File[]) => {
      const fd = new FormData()
      files.forEach(f => fd.append('file', f))
      return api.post<{ ok: true; message: string; paths: string[] }>('/admin/media', fd).then(r => r.data)
    },
    onSuccess: () => client.invalidateQueries({ queryKey: adminKeys.media() }),
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

// ---------- Booking web ----------

export const useAdminOrders = (q: OrdersFilter) => useQuery({
  queryKey: adminKeys.orders(q),
  queryFn: () => get<AdminOrders>('/admin/orders', q),
  placeholderData: keepPreviousData,
  staleTime: 15_000,
})

export const useAdminOrder = (code: string) => useQuery({ queryKey: adminKeys.order(code), queryFn: () => get<AdminOrder>(`/admin/orders/${encodeURIComponent(code)}`) })

/** Thao tác trên một booking (thu tiền, nhận / trả phòng, huỷ, gửi lại email, hoàn tiền). Xong làm mới mọi dữ liệu admin. */
export function useOrderAction(code: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (c: OrderCommand) => api.post<{ ok: true; message: string }>(`/admin/orders/${encodeURIComponent(code)}`, c).then(r => r.data),
    onSuccess: () => client.invalidateQueries({ queryKey: adminKeys.all }),
  })
}

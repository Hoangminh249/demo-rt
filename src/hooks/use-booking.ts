// Đặt phòng — trình duyệt gọi /api/bookings/*. Giá luôn do server tính; trình duyệt chỉ hiển thị.
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/http'
import type { HoldInput, PayInput, SelectionInput } from '@/lib/booking-requests'
import type { HoldResponse, LiveBooking, LiveQuote } from '@/types/booking'

// 4xx có body nghiệp vụ (409 PRICE_CHANGED, SOLD_OUT…) → đọc như kết quả, không ném lỗi. 5xx / mạng mới là lỗi.
const business = { validateStatus: (s: number) => s < 500 }

export const bookingKeys = {
  quote: (s: SelectionInput) => ['booking', 'quote', s] as const,
  booking: (code: string) => ['booking', code] as const,
}

/** Báo giá server cho lựa chọn (null = chưa đủ dữ liệu, không gọi). Đổi mã KM / số khách → gọi lại. */
export const useLiveQuote = (s: SelectionInput | null) => useQuery({
  queryKey: bookingKeys.quote(s ?? ({} as SelectionInput)),
  queryFn: () => api.post<LiveQuote>('/bookings/quote', s).then(r => r.data),
  enabled: !!s,
  placeholderData: keepPreviousData,
  staleTime: 30_000,
})

export const useHold = () => useMutation({
  mutationFn: (b: HoldInput) => api.post<HoldResponse>('/bookings', b, business).then(r => r.data),
})

/** Booking của chính khách. `poll` = hỏi lại mỗi 2 giây (trang kết quả chờ webhook). */
export const useLiveBooking = (code: string, poll: (b: LiveBooking | undefined) => boolean) => useQuery({
  queryKey: bookingKeys.booking(code),
  queryFn: () => api.get<LiveBooking>(`/bookings/${encodeURIComponent(code)}`).then(r => r.data),
  refetchInterval: q => (poll(q.state.data) ? 2000 : false),
})

export const usePay = (code: string) => useMutation({
  mutationFn: (b: PayInput) => api.post<{ ok: true; url: string } | { ok: false; error: string }>(`/bookings/${encodeURIComponent(code)}/pay`, b, business).then(r => r.data),
})

/** Khách tự huỷ. Xong thì làm mới trang (trang chi tiết đơn là server component). */
export const useCancelBooking = (code: string) => useMutation({
  mutationFn: () => api.post<{ ok: true; penalty: number; refund: number } | { ok: false; error: string }>(`/bookings/${encodeURIComponent(code)}/cancel`, {}, business).then(r => r.data),
})

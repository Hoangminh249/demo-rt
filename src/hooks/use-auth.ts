// Đăng nhập toàn dự án — trình duyệt đọc phiên từ /api/auth/session (Auth.js), không làm trang tĩnh thành động.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/http'

export interface AuthUser { id: string; name?: string | null; email?: string | null; image?: string | null; role: 'CUSTOMER' | 'STAFF' | 'ADMIN' }

export const authKeys = { session: ['auth', 'session'] as const, providers: ['auth', 'providers'] as const }

/** Người đang đăng nhập; null = chưa đăng nhập (hoặc đăng nhập chưa cấu hình / DB lỗi). */
export const useAuthSession = () => useQuery({
  queryKey: authKeys.session,
  queryFn: () => api.get<{ user?: AuthUser } | null>('/auth/session').then(r => r.data?.user ?? null).catch(() => null),
  staleTime: 60_000,
})

/** Cách đăng nhập đang bật (Google chỉ có khi đã cấu hình OAuth). */
export const useAuthProviders = () => useQuery({
  queryKey: authKeys.providers,
  queryFn: (): Promise<Record<string, { id: string }>> => api.get<Record<string, { id: string }> | null>('/auth/providers').then(r => r.data ?? {}).catch(() => ({})),
  staleTime: Infinity,
})

// 4xx có body nghiệp vụ (mã sai, gửi quá nhanh) → đọc như kết quả.
const business = { validateStatus: (s: number) => s < 500 }

export const useSendCode = () => useMutation({
  mutationFn: (b: { email: string; callbackUrl: string }) => api.post<{ ok?: true; error?: string }>('/auth/otp/send', b, business).then(r => r.data),
})

export function useVerifyCode() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (b: { email: string; code: string; callbackUrl: string }) =>
      api.post<{ ok?: true; redirect?: string; error?: string; left?: number }>('/auth/otp/verify', b, business).then(r => r.data),
    onSuccess: r => { if (r.ok) client.invalidateQueries({ queryKey: authKeys.session }) },
  })
}

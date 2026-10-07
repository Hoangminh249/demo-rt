// Instance axios cho trình duyệt: chỉ gọi /api của Rooty (không bao giờ gọi thẳng Gohost — key nằm ở server, src/lib/gohost.ts).
// Hết phiên admin (401 từ /api/admin) thì đưa về trang đăng nhập, quay lại đúng trang đang xem sau khi đăng nhập.
import axios from 'axios'

export const api = axios.create({ baseURL: '/api', timeout: 20_000 })

api.interceptors.response.use(undefined, error => {
  if (typeof window !== 'undefined' && error?.response?.status === 401 && String(error.config?.url).startsWith('/admin/') && !String(error.config?.url).startsWith('/admin/session')) {
    // Tải lại hẳn (không router.push): file này nằm ngoài React, và hết phiên thì bỏ hết dữ liệu admin đang giữ.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign(`/admin/login?next=${encodeURIComponent(location.pathname + location.search)}`)
  }
  return Promise.reject(error)
})

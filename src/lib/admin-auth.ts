// Basic Auth cho /admin — dùng chung cho src/proxy.ts và các hàm đọc booking trong gohost.ts
// (Proxy không phải lớp chặn duy nhất: dữ liệu khách tự kiểm lại header). Không 'server-only' vì proxy import file này.
// ponytail: một tài khoản chung trong env; đổi sang Lark SSO khi có nhiều người, cần phân quyền theo khách sạn.
import { timingSafeEqual } from 'node:crypto'

export function isAdmin(authorization: string | null): boolean {
  const user = process.env.ADMIN_USER
  const pass = process.env.ADMIN_PASSWORD
  if (!user || !pass || !authorization) return false // thiếu cấu hình → chặn hết, không mở cửa với "undefined:undefined"
  const got = Buffer.from(authorization)
  const want = Buffer.from(`Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`)
  return got.length === want.length && timingSafeEqual(got, want)
}

export const ADMIN_CHALLENGE = { 'WWW-Authenticate': 'Basic realm="Rooty Hospitality admin", charset="UTF-8"' }

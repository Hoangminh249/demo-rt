// Đăng nhập /admin: một tài khoản trong env (ADMIN_USER / ADMIN_PASSWORD), phiên là cookie httpOnly ký HMAC.
// Dùng chung cho src/proxy.ts (chặn trang + /api/admin), route đăng nhập và các hàm đọc booking (lớp chặn thứ hai).
// Không 'server-only' vì proxy import file này. Thiếu env → không đăng nhập được, không phiên nào hợp lệ (chặn hết).
// ponytail: một tài khoản chung, phiên không thu hồi được từng cái (đổi mật khẩu là mọi phiên hết hạn).
// Có nhiều người dùng, cần phân quyền theo khách sạn → chuyển Lark SSO.
import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

export const SESSION_COOKIE = 'rh_admin'
export const SESSION_MAX_AGE = 7 * 24 * 3600 // giây

const env = () => {
  const user = process.env.ADMIN_USER
  const pass = process.env.ADMIN_PASSWORD
  return user && pass ? { user, pass } : null
}
// So chuỗi không lộ thời gian: băm trước để hai bên luôn cùng độ dài.
const same = (a: string, b: string) => timingSafeEqual(createHash('sha256').update(a).digest(), createHash('sha256').update(b).digest())
// Khoá ký gắn với mật khẩu: đổi ADMIN_PASSWORD là mọi phiên cũ hết hiệu lực.
const sign = (exp: string) => { const e = env(); return e ? createHmac('sha256', `${e.user}:${e.pass}`).update(exp).digest('base64url') : null }

export function checkLogin(user: unknown, pass: unknown): boolean {
  const e = env()
  if (!e || typeof user !== 'string' || typeof pass !== 'string') return false
  return same(user, e.user) && same(pass, e.pass) // chạy đủ cả hai phép so, không dừng sớm
}

/** Giá trị cookie: `<hết hạn unix>.<chữ ký>` */
export function createSession(): string | null {
  const exp = String(Math.floor(Date.now() / 1000) + SESSION_MAX_AGE)
  const sig = sign(exp)
  return sig ? `${exp}.${sig}` : null
}

export function isSession(value: string | null | undefined): boolean {
  if (!value) return false
  const [exp, sig] = value.split('.')
  const want = exp && sign(exp)
  if (!want || !sig || Number(exp) * 1000 < Date.now()) return false
  return same(sig, want)
}

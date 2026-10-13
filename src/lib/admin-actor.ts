// Ai đang dùng /admin. Hai cách vào:
// 1. Tài khoản env (ADMIN_USER / ADMIN_PASSWORD, cookie ký HMAC) — luôn là ADMIN, đường dự phòng khi chưa có Google/DB.
// 2. Đăng nhập Google hoặc email + mã (Auth.js) với User.role = ADMIN hoặc STAFF (chủ dự án sửa role trong DB). CUSTOMER → không vào được.
// Kiểm ở layout /admin VÀ trong từng route handler admin (src/app/api/admin/_lib.ts) — proxy chỉ lọc thô.
import 'server-only'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { currentUser } from '@/auth'
import { isSession, SESSION_COOKIE } from './admin-auth'

export type AdminRole = 'ADMIN' | 'STAFF'
export interface AdminActor { role: AdminRole; userId: string | null; name: string; via: 'env' | 'account' }

export async function adminActor(): Promise<AdminActor | null> {
  if (isSession((await cookies()).get(SESSION_COOKIE)?.value)) return { role: 'ADMIN', userId: null, name: process.env.ADMIN_USER || 'admin', via: 'env' }
  const u = await currentUser()
  if (!u || (u.role !== 'ADMIN' && u.role !== 'STAFF')) return null
  return { role: u.role, userId: u.id, name: u.email ?? u.name ?? u.id, via: 'account' }
}

/** Trang đầu của STAFF (chỉ xem booking, check-in/out). */
export const staffHome = () => '/admin/orders'

/** Dùng ở đầu trang admin (server): chưa đăng nhập → /admin/login; sai role → trang của role đó. */
export async function requireAdmin(roles: AdminRole[] = ['ADMIN']): Promise<AdminActor> {
  const a = await adminActor()
  if (!a) redirect('/admin/login')
  if (!roles.includes(a.role)) redirect(staffHome())
  return a
}

/** Google đã đăng nhập nhưng không có quyền admin (để trang đăng nhập nói rõ thay vì im lặng). */
export async function signedInWithoutAdmin(): Promise<string | null> {
  const u = await currentUser()
  return u && u.role !== 'ADMIN' && u.role !== 'STAFF' ? (u.email ?? u.name ?? 'tài khoản này') : null
}

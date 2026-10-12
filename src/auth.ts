// Đăng nhập khách bằng Google (Auth.js v5 + Prisma adapter, phiên lưu trong bảng Session).
// Khởi tạo LƯỜI (config là hàm): import file này không đụng DB, build không cần DATABASE_URL.
// Env: AUTH_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET; production thêm AUTH_URL (hoặc AUTH_TRUST_HOST=true sau proxy Render).
// Vai trò (User.role) chủ dự án sửa tay trong DB — không có UI đổi role.
import NextAuth, { type DefaultSession } from 'next-auth'
import Google from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { db } from '@/lib/db'

export type Role = 'CUSTOMER' | 'STAFF' | 'ADMIN'

declare module 'next-auth' {
  interface Session { user: { id: string; role: Role } & DefaultSession['user'] }
  interface User { role?: Role }
}

export const { handlers, auth, signIn, signOut } = NextAuth(() => ({
  // Prisma 7 sinh client ở src/generated → kiểu khác '@prisma/client' mà adapter khai báo; API gọi giống nhau.
  adapter: PrismaAdapter(db() as unknown as Parameters<typeof PrismaAdapter>[0]),
  providers: [Google],
  session: { strategy: 'database' },
  trustHost: true,
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id
      session.user.role = user.role ?? 'CUSTOMER'
      return session
    },
  },
}))

/** Người đang đăng nhập, hoặc null (chưa đăng nhập / chưa có DB / Auth chưa cấu hình) — trang không vỡ. */
export async function currentUser() {
  try {
    return (await auth())?.user ?? null
  } catch (e) {
    if (!(e instanceof Error && e.message === 'DB_UNAVAILABLE')) console.error('[auth]', e)
    return null
  }
}

/** Google đã cấu hình chưa (thiếu thì trang đặt phòng báo "chưa mở đăng nhập", không hiện nút hỏng). */
export const authConfigured = () => Boolean(process.env.AUTH_SECRET && process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET)

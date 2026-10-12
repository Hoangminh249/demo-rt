// Đăng nhập toàn dự án (khách + admin) — Auth.js v5 + Prisma adapter, phiên lưu trong bảng Session.
// Hai cách: Google (khi có AUTH_GOOGLE_ID/SECRET) và EMAIL + MÃ 6 SỐ (provider email của Auth.js, gửi mã thay cho link;
// mã băm trong VerificationToken, hết hạn 10 phút; nhập mã qua /api/auth/otp/verify — giới hạn số lần sai).
// Khởi tạo LƯỜI (config là hàm): import file này không đụng DB, build không cần DATABASE_URL.
// Vai trò (User.role) chủ dự án sửa tay trong DB — không có UI đổi role.
import { randomInt } from 'node:crypto'
import NextAuth, { type DefaultSession } from 'next-auth'
import Google from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { db } from '@/lib/db'
import { emailConfigured, sendLoginCode } from '@/lib/email'

export type Role = 'CUSTOMER' | 'STAFF' | 'ADMIN'

declare module 'next-auth' {
  interface Session { user: { id: string; role: Role } & DefaultSession['user'] }
  interface User { role?: Role }
}

/** Mã đăng nhập: 6 chữ số, hiệu lực 10 phút. */
export const LOGIN_CODE_MINUTES = 10
export const EMAIL_PROVIDER = 'email'

/** Chỉ quay lại đường dẫn trong site (chặn chuyển hướng ra ngoài qua callbackUrl). */
export const safeCallback = (u: string | null | undefined) => (u && /^\/(?![/\\])/.test(u) ? u : '/')

const googleConfigured = () => Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET)

export const { handlers, auth, signIn, signOut } = NextAuth(() => ({
  // Prisma 7 sinh client ở src/generated → kiểu khác '@prisma/client' mà adapter khai báo; API gọi giống nhau.
  adapter: PrismaAdapter(db() as unknown as Parameters<typeof PrismaAdapter>[0]),
  providers: [
    ...(googleConfigured() ? [Google] : []),
    // Provider email tự khai (không dùng factory của Auth.js): gửi mã qua src/lib/email.ts, chưa cấu hình SMTP thì in console.
    {
      id: EMAIL_PROVIDER,
      type: 'email',
      name: 'Email',
      maxAge: LOGIN_CODE_MINUTES * 60,
      generateVerificationToken: () => String(randomInt(0, 1_000_000)).padStart(6, '0'),
      sendVerificationRequest: ({ identifier, token }) => sendLoginCode(identifier, token, LOGIN_CODE_MINUTES),
      options: {},
    },
  ],
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

/**
 * Đăng nhập dùng được chưa: cần AUTH_SECRET + DB; production cần thêm cách nhận mã (SMTP_USER/SMTP_PASS) hoặc Google.
 * Máy dev chưa cấu hình SMTP thì mã in ra console của `yarn dev`.
 */
export const authConfigured = () => Boolean(
  process.env.AUTH_SECRET && process.env.DATABASE_URL &&
  (googleConfigured() || emailConfigured() || process.env.NODE_ENV !== 'production'),
)

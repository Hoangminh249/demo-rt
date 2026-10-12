// Đăng nhập (POST) bằng tài khoản env — phiên cookie httpOnly ký HMAC (src/lib/admin-auth.ts).
// Đăng xuất (DELETE): xoá cả phiên env lẫn phiên Auth.js (Google / email + mã).
import { NextResponse, type NextRequest } from 'next/server'
import { signOut } from '@/auth'
import { checkLogin, createSession, SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/admin-auth'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!process.env.ADMIN_USER || !process.env.ADMIN_PASSWORD) return NextResponse.json({ error: 'NOT_CONFIGURED' }, { status: 503 })
  const value = checkLogin(body?.user, body?.password) ? createSession() : null
  if (!value) {
    // ponytail: chỉ làm chậm việc dò mật khẩu; lên production thì chặn theo IP ở hosting / WAF.
    await new Promise(r => setTimeout(r, 800))
    return NextResponse.json({ error: 'INVALID' }, { status: 401 })
  }
  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, value, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: SESSION_MAX_AGE })
  return res
}

export async function DELETE() {
  await signOut({ redirect: false }).catch(() => {}) // không có phiên Auth.js / chưa có DB thì bỏ qua
  const res = NextResponse.json({ ok: true })
  res.cookies.delete(SESSION_COOKIE)
  return res
}

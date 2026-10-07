// Đăng nhập (POST) / đăng xuất (DELETE) admin. Tài khoản trong env, phiên là cookie httpOnly ký HMAC (src/lib/admin-auth.ts).
import { NextResponse, type NextRequest } from 'next/server'
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
  const res = NextResponse.json({ ok: true })
  res.cookies.delete(SESSION_COOKIE)
  return res
}

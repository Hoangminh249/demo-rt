// POST /api/auth/otp/send { email, callbackUrl } — gửi mã đăng nhập 6 số qua email (provider email của Auth.js).
// Giới hạn: mỗi email 1 lần / 60 giây và 5 lần / giờ; mỗi IP 20 lần / giờ. Gửi mã mới thì xoá đếm sai của mã cũ.
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { authConfigured, EMAIL_PROVIDER, safeCallback, signIn } from '@/auth'
import { allow, clientIp, reset } from '@/lib/rate-limit'

const Body = z.object({ email: z.email().max(200).transform(e => e.trim().toLowerCase()), callbackUrl: z.string().max(500).optional() })

export async function POST(req: NextRequest) {
  if (!authConfigured()) return NextResponse.json({ error: 'NOT_CONFIGURED' }, { status: 503 })
  const b = Body.safeParse(await req.json().catch(() => null))
  if (!b.success) return NextResponse.json({ error: 'INVALID_EMAIL' }, { status: 400 })
  const { email } = b.data
  const ip = clientIp(req.headers)
  if (!allow(`otp-ip:${ip}`, 20, 3600_000) || !allow(`otp-hour:${email}`, 5, 3600_000) || !allow(`otp-min:${email}`, 1, 60_000)) {
    return NextResponse.json({ error: 'TOO_SOON' }, { status: 429 })
  }
  try {
    await signIn(EMAIL_PROVIDER, { email, redirect: false, redirectTo: safeCallback(b.data.callbackUrl) })
    reset(`otp-fail:${email}`)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[otp] gửi mã lỗi', e)
    return NextResponse.json({ error: 'SEND_FAILED' }, { status: 502 })
  }
}

// POST /api/auth/otp/verify { email, code, callbackUrl } — nhập mã 6 số.
// Chuyển cho chính callback email của Auth.js (kiểm mã băm, tạo phiên trong DB) rồi chép cookie phiên sang response JSON.
// Chống dò mã: mỗi mã sai tối đa 5 lần → xoá mã, phải gửi mã mới (xác suất đoán trúng ≤ 5 / 1.000.000).
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { EMAIL_PROVIDER, handlers, safeCallback } from '@/auth'
import { db } from '@/lib/db'
import { allow, clientIp, count } from '@/lib/rate-limit'

const MAX_FAILS = 5
const Body = z.object({
  email: z.email().max(200).transform(e => e.trim().toLowerCase()),
  code: z.string().trim().regex(/^\d{6}$/),
  callbackUrl: z.string().max(500).optional(),
})

export async function POST(req: NextRequest) {
  const b = Body.safeParse(await req.json().catch(() => null))
  if (!b.success) return NextResponse.json({ error: 'INVALID' }, { status: 400 })
  const { email, code } = b.data
  if (!allow(`otp-verify-ip:${clientIp(req.headers)}`, 60, 3600_000)) return NextResponse.json({ error: 'TOO_MANY' }, { status: 429 })
  const failKey = `otp-fail:${email}`
  if (count(failKey, 3600_000) >= MAX_FAILS) return NextResponse.json({ error: 'TOO_MANY' }, { status: 429 })

  const callbackUrl = safeCallback(b.data.callbackUrl)
  const url = new URL(`/api/auth/callback/${EMAIL_PROVIDER}`, req.url)
  url.searchParams.set('token', code)
  url.searchParams.set('email', email)
  url.searchParams.set('callbackUrl', callbackUrl)
  const res = await handlers.GET(new NextRequest(url, { headers: req.headers }))
  const location = res.headers.get('location') ?? ''

  if (res.status >= 400 || /[?&]error=/.test(location)) {
    allow(failKey, MAX_FAILS + 1, 3600_000)
    const left = MAX_FAILS - count(failKey, 3600_000)
    if (left <= 0) await db().verificationToken.deleteMany({ where: { identifier: email } }).catch(() => {}) // huỷ mã: phải gửi mã mới
    return NextResponse.json({ error: left <= 0 ? 'TOO_MANY' : 'INVALID', left: Math.max(0, left) }, { status: 400 })
  }

  const out = NextResponse.json({ ok: true, redirect: callbackUrl })
  for (const c of res.headers.getSetCookie()) out.headers.append('set-cookie', c)
  return out
}

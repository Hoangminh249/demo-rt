// POST /api/payments/{provider}/webhook — cổng thanh toán báo kết quả. Kiểm chữ ký; idempotent theo (provider, eventId).
// Đây là chỗ DUY NHẤT xác nhận booking. Trả 200 khi đã ghi nhận (kể cả trùng) để cổng không gửi lại mãi.
import { NextResponse, type NextRequest } from 'next/server'
import { bookingApi } from '@/api/booking'

export async function POST(req: NextRequest, ctx: RouteContext<'/api/payments/[provider]/webhook'>) {
  const body = await req.text()
  try {
    const r = await bookingApi.webhook((await ctx.params).provider, body, req.headers)
    return NextResponse.json(r.status === 200 ? { ok: true } : { error: 'INVALID_SIGNATURE' }, { status: r.status })
  } catch (e) {
    console.error('[webhook]', e)
    return NextResponse.json({ error: 'RETRY' }, { status: 500 }) // cổng thật sẽ gửi lại
  }
}

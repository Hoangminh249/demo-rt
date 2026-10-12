// POST /api/cron/expire-holds — Render Cron Job gọi mỗi phút: booking chờ thanh toán quá hạn → EXPIRED, trả phòng.
// Header: Authorization: Bearer <CRON_SECRET>. Ngoài cron, hết hạn còn được xử lý lười khi đọc booking / giữ phòng.
import { timingSafeEqual } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { bookingApi } from '@/api/booking'

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const got = Buffer.from(req.headers.get('authorization') ?? '')
  const want = Buffer.from(`Bearer ${secret}`)
  if (!secret || got.length !== want.length || !timingSafeEqual(got, want)) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  try {
    return NextResponse.json({ expired: await bookingApi.expire() })
  } catch (e) {
    console.error('[cron] expire-holds', e)
    return NextResponse.json({ error: 'DB_ERROR' }, { status: 503 })
  }
}

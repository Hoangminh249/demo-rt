// POST /api/payments/mock/simulate — nút "Thanh toán thành công / thất bại" của cổng giả lập (form thường).
// Chỉ khi PAYMENT_PROVIDER=mock và payment thuộc khách đang đăng nhập. Đi đúng đường webhook thật rồi đưa khách về trang kết quả.
import { NextResponse, type NextRequest } from 'next/server'
import { bookingApi } from '@/api/booking'
import { currentUser } from '@/auth'
import { paymentProvider } from '@/lib/payment'

export async function POST(req: NextRequest) {
  if (paymentProvider().name !== 'mock') return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const f = await req.formData()
  const ref = String(f.get('ref') ?? '')
  const result = f.get('result') === 'succeeded' ? 'succeeded' : 'failed'
  const prefix = f.get('locale') === 'en' ? '/en' : ''
  const code = await bookingApi.mockResult(user.id, ref, result)
  if (!code) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  const to = result === 'succeeded' ? `${prefix}/dat-phong/xac-nhan?code=${code}` : `${prefix}/dat-phong/thanh-toan?code=${code}&failed=1`
  return NextResponse.redirect(new URL(to, req.url), 303)
}

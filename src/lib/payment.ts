// Cổng thanh toán: interface chung + bản giả lập (PAYMENT_PROVIDER=mock, mặc định). Chưa tích hợp cổng thật.
// Booking CHỈ được xác nhận qua webhook (booking-engine.handleWebhook); trang trở về của trình duyệt chỉ để hiển thị.
// Thêm cổng thật (OnePay, VNPay…) = thêm một object PaymentProvider: tạo link thanh toán + kiểm chữ ký webhook.
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto'
import type { WebhookEvent } from './booking-engine'

export interface PaymentProvider {
  name: string
  /** Link đưa trình duyệt sang trang thanh toán của cổng. */
  checkoutUrl(p: { providerRef: string; amount: number; bookingCode: string; locale: string }): string
  /** Đọc + kiểm chữ ký webhook. null = chữ ký sai / body hỏng → trả 401, không xử lý. */
  parseWebhook(body: string, headers: Headers): WebhookEvent | null
}

export const newPaymentRef = () => `PAY-${randomUUID()}`

// ---------- Giả lập ----------
// Trang /thanh-toan-gia-lap đóng vai cổng: khách bấm "thành công"/"thất bại" → server ký body bằng HMAC rồi đưa vào
// đúng đường xử lý webhook thật (kiểm chữ ký, idempotent). Bí mật: PAYMENT_MOCK_SECRET (không có thì dùng AUTH_SECRET).

const secret = () => {
  const s = process.env.PAYMENT_MOCK_SECRET || process.env.AUTH_SECRET
  if (!s) throw new Error('Thiếu PAYMENT_MOCK_SECRET / AUTH_SECRET')
  return s
}
const sign = (body: string) => createHmac('sha256', secret()).update(body).digest('hex')

export const MOCK_SIGNATURE_HEADER = 'x-mock-signature'

/** Body + chữ ký mà "cổng giả" gửi về webhook. */
export function mockWebhook(providerRef: string, status: 'succeeded' | 'failed', amount: number) {
  const body = JSON.stringify({ eventId: `EVT-${randomUUID()}`, providerRef, status, amount })
  return { body, signature: sign(body) }
}

export const mockProvider: PaymentProvider = {
  name: 'mock',
  checkoutUrl: ({ providerRef, locale }) => `${locale === 'en' ? '/en' : ''}/thanh-toan-gia-lap?ref=${encodeURIComponent(providerRef)}`,
  parseWebhook(body, headers) {
    const got = headers.get(MOCK_SIGNATURE_HEADER) ?? ''
    const want = sign(body)
    if (got.length !== want.length || !timingSafeEqual(Buffer.from(got), Buffer.from(want))) return null
    try {
      const v = JSON.parse(body) as { eventId?: unknown; providerRef?: unknown; status?: unknown; amount?: unknown }
      if (typeof v.eventId !== 'string' || typeof v.providerRef !== 'string' || (v.status !== 'succeeded' && v.status !== 'failed') || !Number.isInteger(v.amount)) return null
      return { eventId: v.eventId, providerRef: v.providerRef, status: v.status, amount: v.amount as number, raw: v }
    } catch {
      return null
    }
  },
}

const PROVIDERS: Record<string, PaymentProvider> = { mock: mockProvider }

/** Cổng đang dùng (env PAYMENT_PROVIDER, mặc định mock). */
export const paymentProvider = (): PaymentProvider => {
  const p = PROVIDERS[process.env.PAYMENT_PROVIDER || 'mock']
  if (!p) throw new Error(`PAYMENT_PROVIDER không hỗ trợ: ${process.env.PAYMENT_PROVIDER}`)
  return p
}
export const providerByName = (name: string): PaymentProvider | undefined => PROVIDERS[name]

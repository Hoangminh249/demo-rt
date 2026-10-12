// Cổng thanh toán: interface chung + bản giả lập. Hai hình thức khách chọn (chốt 12/10/2026): chuyển khoản ngân hàng, OnePay.
// PAYMENT_PROVIDER=mock (mặc định): cả hai đi qua cổng giả lập, ghi Payment.provider = 'mock-bank' / 'mock-onepay'.
// Chưa tích hợp cổng thật: thêm object PaymentProvider tên 'bank' / 'onepay' (tạo link thanh toán + kiểm chữ ký webhook).
// Booking CHỈ được xác nhận qua webhook (booking-engine.handleWebhook); trang trở về của trình duyệt chỉ để hiển thị.
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto'
import type { WebhookEvent } from './booking-engine'
import { PAY_METHODS, type PayMethod } from './booking-requests'

export interface PaymentProvider {
  name: string
  /** Link đưa trình duyệt sang trang thanh toán của cổng. */
  checkoutUrl(p: { providerRef: string; amount: number; bookingCode: string; locale: string }): string
  /** Đọc + kiểm chữ ký webhook. null = chữ ký sai / body hỏng → trả 401, không xử lý. */
  parseWebhook(body: string, headers: Headers): WebhookEvent | null
}

export const newPaymentRef = () => `PAY-${randomUUID()}`

/** Payment.provider → hình thức hiển thị cho khách / email ('mock-bank' → 'bank'). Không rõ → null. */
export const methodOf = (provider: string): PayMethod | null => {
  const m = provider.replace(/^mock-/, '')
  return (PAY_METHODS as readonly string[]).includes(m) ? (m as PayMethod) : null
}

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

const mock = (name: string): PaymentProvider => ({
  name,
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
})

// 'mock' giữ lại cho payment tạo trước khi tách hai hình thức.
const MOCKS: Record<string, PaymentProvider> = { 'mock-bank': mock('mock-bank'), 'mock-onepay': mock('mock-onepay'), mock: mock('mock') }
const REAL: Record<string, PaymentProvider> = {}

export const mockPayments = () => (process.env.PAYMENT_PROVIDER || 'mock') === 'mock'

/** Cổng cho hình thức khách chọn. */
export const paymentProvider = (method: PayMethod): PaymentProvider => {
  const p = mockPayments() ? MOCKS[`mock-${method}`] : REAL[method]
  if (!p) throw new Error(`Chưa tích hợp cổng thanh toán: ${method}`)
  return p
}
/** Cổng theo tên trong URL webhook (/api/payments/{name}/webhook). Cổng giả chỉ nhận khi đang ở chế độ mock. */
export const providerByName = (name: string): PaymentProvider | undefined => (mockPayments() ? MOCKS[name] : undefined) ?? REAL[name]
/** Payment của cổng giả lập (trang /thanh-toan-gia-lap chỉ phục vụ những payment này). */
export const isMockProvider = (name: string) => name in MOCKS

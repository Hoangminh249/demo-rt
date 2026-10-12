// Đếm số lần trong cửa sổ thời gian, theo khoá (email, IP…). Chỉ server.
// ponytail: đếm trong bộ nhớ một tiến trình (Render 1 instance). Chạy nhiều instance → chuyển sang bảng Postgres / Redis.
const g = globalThis as typeof globalThis & { __rateLimit?: Map<string, number[]> }
const hits: Map<string, number[]> = (g.__rateLimit ??= new Map())

/** Ghi một lần cho `key` nếu còn trong hạn mức; trả false khi đã vượt `limit` lần trong `windowMs`. */
export function allow(key: string, limit: number, windowMs: number, now = Date.now()): boolean {
  const recent = (hits.get(key) ?? []).filter(t => now - t < windowMs)
  if (recent.length >= limit) { hits.set(key, recent); return false }
  recent.push(now)
  hits.set(key, recent)
  return true
}

/** Số lần đã ghi trong cửa sổ (không ghi thêm). */
export const count = (key: string, windowMs: number, now = Date.now()) => (hits.get(key) ?? []).filter(t => now - t < windowMs).length

export const reset = (key: string) => { hits.delete(key) }

/** IP người gọi (sau proxy Render: x-forwarded-for). */
export const clientIp = (h: Headers) => h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'local'

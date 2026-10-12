// Dùng chung cho /api/bookings/*: chỉ mở khi DATA_SOURCE=db, JSON no-store, lỗi DB → 503 (không lộ chi tiết).
import 'server-only'
import { NextResponse } from 'next/server'
import type { z } from 'zod'
import { isDbSource } from '@/lib/db'

const NO_STORE = { 'Cache-Control': 'no-store' }
export const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: NO_STORE })

/** Đọc + kiểm body JSON. Sai → Response 400/415 để route trả thẳng. */
export async function parse<T extends z.ZodType>(req: Request, schema: T): Promise<z.output<T> | Response> {
  if (!req.headers.get('content-type')?.startsWith('application/json')) return json({ error: 'BAD_REQUEST' }, 415)
  const r = schema.safeParse(await req.json().catch(() => null))
  return r.success ? r.data : json({ error: 'BAD_REQUEST', message: r.error.issues[0]?.message }, 400)
}

/** Bọc handler: đặt phòng chưa mở (nguồn gohost) → 503 BOOKING_CLOSED; lỗi DB → 503. */
export function bookingRoute<A extends unknown[]>(fn: (...a: A) => Promise<Response>) {
  return async (...a: A) => {
    if (!isDbSource()) return json({ error: 'BOOKING_CLOSED' }, 503)
    try {
      return await fn(...a)
    } catch (e) {
      console.error('[booking]', e)
      return json({ error: 'UPSTREAM' }, 503)
    }
  }
}

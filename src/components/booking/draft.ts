'use client'
// Bản nháp đặt phòng trong sessionStorage (đóng tab là mất) — thông tin cá nhân không lên URL, không gửi server.
// ponytail: chưa có backend; khi nối Gohost POST /bookings thì bước thanh toán gửi bản nháp này lên server rồi xoá.
import { useMemo, useSyncExternalStore } from 'react'
import type { GuestDraft, PaymentDraft } from '@/lib/booking'

const KEY = 'rooty-booking'
export interface Draft { guest?: GuestDraft; payment?: PaymentDraft }

const parse = (raw: string | null): Draft => { try { return JSON.parse(raw || '{}') as Draft } catch { return {} } }
const raw = () => { try { return sessionStorage.getItem(KEY) ?? '' } catch { return '' } }

export const readDraft = () => parse(raw())

export function saveDraft(d: Draft) {
  try { sessionStorage.setItem(KEY, JSON.stringify({ ...readDraft(), ...d })) } catch { /* chế độ riêng tư chặn storage: bước sau báo thiếu thông tin */ }
}

/** null khi render ở server / lúc hydrate (không có sessionStorage) — component hiện khung chờ rồi mới vẽ form. */
export function useDraft(): Draft | null {
  const s = useSyncExternalStore(() => () => {}, raw, () => null)
  return useMemo(() => (s === null ? null : parse(s)), [s])
}

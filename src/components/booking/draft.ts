'use client'
// Bản nháp thông tin khách trong sessionStorage (đóng tab là mất) — quay lại bước 2 thì form điền sẵn. Không lên URL, không gửi server.
import { useMemo, useSyncExternalStore } from 'react'
import type { GuestDraft } from '@/types/booking'

const KEY = 'rooty-booking'
export interface Draft { guest?: GuestDraft }

const parse = (raw: string | null): Draft => { try { return JSON.parse(raw || '{}') as Draft } catch { return {} } }
const raw = () => { try { return sessionStorage.getItem(KEY) ?? '' } catch { return '' } }

const readDraft = () => parse(raw())

export function saveDraft(d: Draft) {
  try { sessionStorage.setItem(KEY, JSON.stringify({ ...readDraft(), ...d })) } catch { /* chế độ riêng tư chặn storage: lần sau form trống */ }
}

/** null khi render ở server / lúc hydrate (không có sessionStorage) — component hiện khung chờ rồi mới vẽ form. */
export function useDraft(): Draft | null {
  const s = useSyncExternalStore(() => () => {}, raw, () => null)
  return useMemo(() => (s === null ? null : parse(s)), [s])
}

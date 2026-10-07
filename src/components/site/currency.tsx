'use client'
// Tiền tệ hiển thị (kiểu Klook): khách chọn ở header, nhớ trong trình duyệt. Giá gốc luôn là VND (Gohost tính và
// thu bằng VND); ngoại tệ chỉ là quy đổi tham khảo. Trang dựng tĩnh nên lần tải đầu hiện VND rồi đổi ngay sau khi chạy.
import { useSyncExternalStore } from 'react'
import { fmtPrice } from '@/lib/format'

// ponytail: tỷ giá cố định cho demo — bản thật lấy tỷ giá ngày từ backend Rooty.
export const CURRENCIES = [
  { code: 'VND', symbol: 'đ', vndPer: 1 },
  { code: 'USD', symbol: 'US$', vndPer: 26_000 },
  { code: 'EUR', symbol: '€', vndPer: 30_000 },
  { code: 'KRW', symbol: '₩', vndPer: 18.5 },
] as const
export type Currency = (typeof CURRENCIES)[number]['code']

const KEY = 'rooty-currency'
const listeners = new Set<() => void>()

function read(): Currency {
  try {
    const v = localStorage.getItem(KEY)
    return CURRENCIES.some(c => c.code === v) ? (v as Currency) : 'VND'
  } catch { return 'VND' }
}

export function setCurrency(c: Currency) {
  try { localStorage.setItem(KEY, c) } catch {}
  listeners.forEach(f => f())
}

function subscribe(f: () => void) {
  listeners.add(f)
  const onStorage = (e: StorageEvent) => { if (e.key === KEY) f() }
  window.addEventListener('storage', onStorage)
  return () => { listeners.delete(f); window.removeEventListener('storage', onStorage) }
}

export const useCurrency = () => useSyncExternalStore(subscribe, read, () => 'VND' as Currency)

export function fmtMoney(vnd: number, code: Currency) {
  if (code === 'VND') return fmtPrice(vnd)
  const c = CURRENCIES.find(x => x.code === code)!
  const step = code === 'KRW' ? 100 : 1
  return `${c.symbol} ${(Math.round(vnd / c.vndPer / step) * step).toLocaleString('en-US')}`
}

/** Giá theo tiền tệ khách chọn. `vnd` luôn là số tiền VND. */
export function Price({ vnd }: { vnd: number }) {
  return <>{fmtMoney(vnd, useCurrency())}</>
}

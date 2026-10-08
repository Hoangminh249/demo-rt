'use client'
// Ngày ở + số khách của trang khách sạn nằm trên URL: thẻ giá và danh sách phòng cùng đọc một nguồn.
import { useCallback } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { parseStay, stayQuery } from '@/lib/stay'
import type { Stay } from '@/types/hotel'

/** `opening`: ngày khai trương — khách sạn chưa mở thì ngày ở không được sớm hơn. */
export function useStay(opening?: string | null) {
  const sp = useSearchParams()
  const router = useRouter()
  const path = usePathname()
  const stay = parseStay(sp, opening)
  // Giữ các tham số khác trên URL (trang phòng có `plan`, luồng đặt phòng có `hotel`, `room`).
  const setParams = useCallback((q: string) => {
    const next = new URLSearchParams(window.location.search)
    new URLSearchParams(q).forEach((v, k) => next.set(k, v))
    router.replace(`${path}?${next}`, { scroll: false })
  }, [router, path])
  const setStay = useCallback((s: Stay) => setParams(stayQuery(s)), [setParams])
  return [stay, setStay, setParams] as const
}

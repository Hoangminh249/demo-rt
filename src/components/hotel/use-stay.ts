'use client'
// Ngày ở + số khách của trang khách sạn nằm trên URL: thẻ giá và danh sách phòng cùng đọc một nguồn.
import { useCallback } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { parseStay, stayQuery } from '@/lib/stay'
import type { Stay } from '@/lib/types'

export function useStay() {
  const sp = useSearchParams()
  const router = useRouter()
  const path = usePathname()
  const stay = parseStay(sp)
  const setStay = useCallback((s: Stay) => router.replace(`${path}?${stayQuery(s)}`, { scroll: false }), [router, path])
  return [stay, setStay] as const
}

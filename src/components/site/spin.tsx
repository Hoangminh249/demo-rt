'use client'
// Vòng quay trên nút đang chờ: `Spin` cho nút gọi API (isPending), `LinkSpin` đặt TRONG <Link> để hiện khi đang chuyển trang.
import { useLinkStatus } from 'next/link'
import { Loader2 } from 'lucide-react'

export const Spin = ({ on }: { on: boolean }) => (on ? <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden /> : null)

export function LinkSpin() {
  return <Spin on={useLinkStatus().pending} />
}

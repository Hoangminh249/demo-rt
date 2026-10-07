// Trạng thái kết nối Gohost: dải trạng thái API (Tổng quan) và badge nối Gohost của từng khách sạn.
import { PlugZap } from 'lucide-react'
import type { ConnectState, GohostErrorCode } from '@/lib/repo/admin'
import { Badge, CARD, GohostError, hhmm } from './ui'

type Status = { budget: number; budgetLeft: number; last: { at: number; path: string; status: number | 'network' } | null }
// Chỉ ghi loại lời gọi: bỏ ID tenant và mã booking (dài, và mã booking không nên nằm ở màn tổng quan).
const endpoint = (path: string) => path.replace(/\/properties\/[^/]+/, '/properties/…').replace(/\/bookings\/[^/]+/, '/bookings/…')

export function ApiStatus({ status, error }: { status: Status; error: GohostErrorCode | null }) {
  if (error) return <GohostError code={error} note="Danh sách dưới chỉ kiểm phần nội dung; giá, phòng trống, ánh xạ phòng chưa kiểm được." />
  return (
    <div className={`${CARD} flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 text-sm`}>
      <span className="inline-flex items-center gap-2 font-medium"><PlugZap className="size-4 text-muted-foreground" aria-hidden />Gohost</span>
      <Badge tone="ok">Kết nối được</Badge>
      <span className="text-muted-foreground">{status.last ? `Lần gọi cuối ${hhmm(status.last.at)} · ${endpoint(status.last.path)} · ${status.last.status}` : 'Đang dùng dữ liệu lưu đệm'}</span>
      <span className="ml-auto text-muted-foreground tabular-nums">Còn {status.budgetLeft}/{status.budget} lượt trong 5 phút</span>
    </div>
  )
}

export function ConnectBadge({ state }: { state: ConnectState }) {
  if (state === 'ok') return <Badge tone="ok">Đã nối Gohost</Badge>
  if (state === 'unknown') return <Badge tone="neutral">Không đọc được</Badge>
  if (state === 'missing') return <Badge tone="err">Không thấy trên Gohost</Badge>
  return <Badge tone="err">Chưa nối Gohost</Badge>
}

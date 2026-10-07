// Trạng thái booking Gohost → nhãn tiếng Việt + tông (M7). Hai trạng thái cùng tông thì khác icon.
import { Circle, CircleCheck, CircleDot, CircleEllipsis, CircleHelp, CircleX, Merge, UserX, type LucideIcon } from 'lucide-react'
import { Badge, type Tone } from './ui'

const STATUS: Record<string, [label: string, tone: Tone, icon: LucideIcon]> = {
  new: ['Mới', 'warn', CircleEllipsis], // chờ khách sạn xác nhận
  confirmed: ['Đã xác nhận', 'neutral', Circle],
  in_progress: ['Đang ở', 'neutral', CircleDot],
  finished: ['Đã trả phòng', 'ok', CircleCheck],
  no_show: ['Không đến', 'err', UserX],
  cancelled: ['Đã huỷ', 'err', CircleX],
  merged: ['Đã gộp', 'neutral', Merge],
}

export const BOOKING_STATUSES = Object.entries(STATUS).map(([value, [label]]) => ({ value, label }))

export function BookingStatus({ status }: { status: string }) {
  const [label, tone, Icon] = STATUS[status] ?? [status, 'neutral', CircleHelp]
  return <Badge tone={tone} icon={<Icon className="size-3.5" aria-hidden />}>{label}</Badge>
}

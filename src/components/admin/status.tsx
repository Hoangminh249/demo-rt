// Badge nối Gohost của từng khách sạn (Cài đặt → Kết nối Gohost).
import type { ConnectState } from '@/types/admin'
import { Badge } from './ui'


export function ConnectBadge({ state }: { state: ConnectState }) {
  if (state === 'ok') return <Badge tone="ok">Đã nối Gohost</Badge>
  if (state === 'unknown') return <Badge tone="neutral">Không đọc được</Badge>
  if (state === 'missing') return <Badge tone="err">Không thấy trên Gohost</Badge>
  return <Badge tone="err">Chưa nối Gohost</Badge>
}

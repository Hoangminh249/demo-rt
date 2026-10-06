'use client'
import Link from 'next/link'
import { useState } from 'react'
import { repo } from '@/lib/repo'
import { useAsync, useDemo } from '@/store/provider'
import { fmtRange, fmtVND } from '@/lib/format'
import { PAYMENT, STATUS } from '@/lib/labels'
import type { BookingStatus } from '@/lib/types'
import { Badge, Empty, Input, PageTitle, Select, SkeletonList, Table } from '@/components/ui'

export default function AgentBookings() {
  const { overlay } = useDemo()
  const st = useAsync(() => repo.getAgent(overlay.session.agentId!), [overlay.session.agentId])
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<BookingStatus | ''>('')
  const [limit, setLimit] = useState(30)
  if (!st.data) return <SkeletonList />
  const rows = st.data.bookings.filter(b => (!status || b.status === status) && (!q || b.code.toLowerCase().includes(q.toLowerCase()) || b.guest.name.toLowerCase().includes(q.toLowerCase())))
  return (
    <>
      <PageTitle title="Booking của tôi" sub={`${rows.length} booking`}>
        <div className="flex gap-2">
          <Input placeholder="Mã / tên khách" value={q} onChange={e => setQ(e.target.value)} className="w-44" aria-label="Tìm booking" />
          <Select value={status} onChange={e => setStatus(e.target.value as BookingStatus | '')} className="w-40" aria-label="Lọc trạng thái">
            <option value="">Mọi trạng thái</option>{Object.entries(STATUS).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}
          </Select>
        </div>
      </PageTitle>
      {rows.length === 0 ? <Empty title="Không có booking" /> : (
        <Table>
          <thead><tr><th>Mã</th><th>Khách sạn / phòng</th><th>Ngày</th><th>Khách</th><th>Trạng thái</th><th>Thanh toán</th><th className="text-right">Net</th><th /></tr></thead>
          <tbody>
            {rows.slice(0, limit).map(b => (
              <tr key={b.code}>
                <td><Link href={`/agent/booking/${b.code}`} className="font-mono text-primary hover:underline">{b.code}</Link></td>
                <td>{b.hotel.name}<div className="text-xs text-muted">{b.booking_rooms.length} × {b.rt.name}</div></td>
                <td className="whitespace-nowrap">{fmtRange(b.checkin_date, b.checkout_date)}</td>
                <td>{b.guest.name}</td>
                <td><Badge tone={STATUS[b.status][1]}>{STATUS[b.status][0]}</Badge></td>
                <td><Badge tone={PAYMENT[b.payment_status][1]}>{PAYMENT[b.payment_status][0]}</Badge></td>
                <td className="text-right">{fmtVND(b.total)}</td>
                <td><Link href={`/voucher/${b.code}`} target="_blank" className="text-xs text-primary hover:underline">Voucher</Link></td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      {rows.length > limit && <button type="button" onClick={() => setLimit(limit + 30)} className="mt-3 text-sm font-medium text-primary hover:underline">Xem thêm</button>}
    </>
  )
}

'use client'
import Link from 'next/link'
import { use, useState } from 'react'
import { repo } from '@/lib/repo'
import { useAsync } from '@/store/provider'
import { useAdmin } from '@/components/admin/use-admin'
import { agentNet } from '@/lib/pricing'
import { fmtMonth, fmtRange, fmtVND } from '@/lib/format'
import { PAYMENT, STATUS } from '@/lib/labels'
import { Badge, Breadcrumb, Button, Card, Empty, Field, Input, PageTitle, SkeletonList, Stat, Table } from '@/components/ui'
import { toast } from '@/components/ui/overlay'

export default function AgentAdminDetail({ params }: PageProps<'/admin/agents/[id]'>) {
  const { id } = use(params)
  const a = useAdmin()
  const st = useAsync(() => repo.getAgent(id), [id])
  const rooms = useAsync(() => repo.listRoomTypes(), [])
  const [limit, setLimit] = useState('')
  if (st.loading && !st.data) return <SkeletonList />
  if (!st.data || !rooms.data) return st.data === null ? <Empty title="Không tìm thấy đại lý" /> : <SkeletonList />
  const { agent, debt, months, bookings } = st.data
  const hotels = repo.hotelsSync()
  async function saveLimit() {
    const v = Number(limit.replace(/\D/g, ''))
    if (!v) return
    await repo.updateAgent(id, { credit_limit: v })
    toast(`Đã đổi hạn mức ${agent.name}: ${fmtVND(v)}`)
    setLimit('')
  }
  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Agents / B2B', href: '/admin/agents' }, { label: agent.name }]} />
      <PageTitle title={agent.name} sub={`${agent.contact} · ${agent.phone} · ${agent.email} · MST ${agent.tax_code}`} />
      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Công nợ" value={fmtVND(debt)} sub={`${st.data.debtBookings} booking ghi nợ`} />
        <Stat label="Hạn mức" value={fmtVND(agent.credit_limit)} />
        <Stat label="Booking (tất cả)" value={bookings.length} />
        <Stat label="Chiết khấu / hoa hồng" value={`${Math.round(agent.discount * 100)}% / ${agent.commission_pct}%`} />
      </div>
      {a.can('agents', 'full') && (
        <Card className="flex flex-wrap items-end gap-3 p-4">
          <Field label="Hạn mức công nợ mới (đ)"><Input inputMode="numeric" value={limit} onChange={e => setLimit(e.target.value)} placeholder={String(agent.credit_limit)} /></Field>
          <Button onClick={saveLimit}>Lưu hạn mức</Button>
        </Card>
      )}
      <section>
        <h2 className="mb-2 font-semibold">Bảng giá net theo hạng phòng</h2>
        <Table>
          <thead><tr><th>Khách sạn</th><th>Hạng phòng</th><th className="text-right">Public rate</th><th className="text-right">Agent net rate</th><th className="text-right">Chênh lệch</th></tr></thead>
          <tbody>{rooms.data.map(r => {
            const net = agentNet(agent, r)
            return <tr key={r.room_type_id}><td>{hotels.find(h => h.id === r.hotel_id)?.name}</td><td>{r.name}{agent.net_overrides[r.room_type_id] && <Badge tone="info" className="ml-2">Giá riêng</Badge>}</td><td className="text-right">{fmtVND(r.public_rate)}</td><td className="text-right font-semibold">{fmtVND(net)}</td><td className="text-right text-muted">{fmtVND(r.public_rate - net)}</td></tr>
          })}</tbody>
        </Table>
      </section>
      <section>
        <h2 className="mb-2 font-semibold">Báo cáo theo tháng</h2>
        <Table>
          <thead><tr><th>Tháng</th><th className="text-right">Booking</th><th className="text-right">Room nights</th><th className="text-right">Doanh thu net</th><th className="text-right">Hoa hồng</th></tr></thead>
          <tbody>{months.map(m => <tr key={m.month}><td>{fmtMonth(m.month)}</td><td className="text-right">{m.bookings}</td><td className="text-right">{m.rn}</td><td className="text-right">{fmtVND(m.revenue)}</td><td className="text-right">{fmtVND(m.commission)}</td></tr>)}</tbody>
        </Table>
      </section>
      <section>
        <h2 className="mb-2 font-semibold">Booking gần đây</h2>
        <Table>
          <thead><tr><th>Mã</th><th>Khách sạn</th><th>Ngày</th><th>Trạng thái</th><th>Thanh toán</th><th className="text-right">Tổng</th></tr></thead>
          <tbody>{bookings.slice(0, 15).map(b => <tr key={b.code}><td><Link href={`/admin/bookings/${b.code}`} className="font-mono text-primary hover:underline">{b.code}</Link></td><td>{b.hotel.name}</td><td>{fmtRange(b.checkin_date, b.checkout_date)}</td><td><Badge tone={STATUS[b.status][1]}>{STATUS[b.status][0]}</Badge></td><td><Badge tone={PAYMENT[b.payment_status][1]}>{PAYMENT[b.payment_status][0]}</Badge></td><td className="text-right">{fmtVND(b.total)}</td></tr>)}</tbody>
        </Table>
      </section>
    </div>
  )
}

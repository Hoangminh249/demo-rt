'use client'
import Link from 'next/link'
import { repo } from '@/lib/repo'
import { useAsync, useDemo } from '@/store/provider'
import { fmtDateTime, fmtPct, fmtRange, fmtVND } from '@/lib/format'
import { METHOD } from '@/lib/labels'
import { Card, PageTitle, SkeletonList, Stat, Table, cn } from '@/components/ui'

export default function AgentDebt() {
  const { overlay } = useDemo()
  const st = useAsync(() => repo.getAgent(overlay.session.agentId!), [overlay.session.agentId])
  if (!st.data) return <SkeletonList />
  const { agent, debt, exposure, bookings, payments } = st.data
  const used = exposure / agent.credit_limit
  const open = bookings.filter(b => b.payment_status === 'credit' && b.status !== 'cancelled')
  return (
    <>
      <PageTitle title="Công nợ & lịch sử thanh toán" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Công nợ đã phát sinh" value={fmtVND(debt)} sub={`Ghi nợ chưa phát sinh: ${fmtVND(exposure - debt)} · ${open.length} booking`} />
        <Stat label="Hạn mức" value={fmtVND(agent.credit_limit)} sub={`Còn ${fmtVND(Math.max(0, agent.credit_limit - exposure))}`} />
        <Stat label="Đã dùng" value={fmtPct(used, 0)} tone={used > 0.8 ? 'down' : undefined} sub={used > 0.8 ? 'Sắp chạm hạn mức' : 'Trong hạn mức'} />
      </div>
      <Card className="mt-4 p-4">
        <div className="h-3 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={Math.round(used * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Mức dùng hạn mức">
          <div className={cn('h-full', used > 0.8 ? 'bg-danger' : 'bg-primary')} style={{ width: `${Math.min(100, used * 100)}%` }} />
        </div>
      </Card>
      <h2 className="mb-3 mt-8 text-lg font-bold">Booking đang ghi nợ</h2>
      <Table>
        <thead><tr><th>Mã</th><th>Khách sạn</th><th>Ngày</th><th className="text-right">Số tiền</th></tr></thead>
        <tbody>{open.slice(0, 50).map(b => <tr key={b.code}><td><Link href={`/agent/booking/${b.code}`} className="font-mono text-primary hover:underline">{b.code}</Link></td><td>{b.hotel.name}</td><td>{fmtRange(b.checkin_date, b.checkout_date)}</td><td className="text-right">{fmtVND(b.total)}</td></tr>)}</tbody>
      </Table>
      <h2 className="mb-3 mt-8 text-lg font-bold">Lịch sử thanh toán</h2>
      <Table>
        <thead><tr><th>Thời gian</th><th>Booking</th><th>Phương thức</th><th>Ghi chú</th><th className="text-right">Số tiền</th></tr></thead>
        <tbody>{payments.slice(0, 50).map(p => <tr key={p.id}><td>{fmtDateTime(p.at)}</td><td className="font-mono">{p.booking}</td><td>{METHOD[p.method]}</td><td className="text-muted-foreground">{p.note}</td><td className="text-right">{fmtVND(p.amount)}</td></tr>)}</tbody>
      </Table>
    </>
  )
}

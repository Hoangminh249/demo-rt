'use client'
import { repo } from '@/lib/repo'
import { useAsync, useDemo } from '@/store/provider'
import { fmtMonth, fmtVND } from '@/lib/format'
import { PageTitle, SkeletonList, Stat, Table } from '@/components/ui'

export default function AgentCommission() {
  const { overlay } = useDemo()
  const st = useAsync(() => repo.getAgent(overlay.session.agentId!), [overlay.session.agentId])
  if (!st.data) return <SkeletonList />
  const { agent, months } = st.data
  const sum = (k: 'commission' | 'margin') => months.reduce((s, m) => s + m[k], 0)
  return (
    <>
      <PageTitle title="Hoa hồng & net rate" sub={`Net = Public × (1 − ${Math.round(agent.discount * 100)}%) · thưởng doanh số ${agent.commission_pct}% trên doanh thu net`} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Stat label="Chênh lệch Public − Net (lợi nhuận đại lý)" value={fmtVND(sum('margin'))} />
        <Stat label="Thưởng doanh số tích luỹ" value={fmtVND(sum('commission'))} />
      </div>
      <Table className="mt-6">
        <thead><tr><th>Tháng</th><th className="text-right">Booking</th><th className="text-right">Room nights</th><th className="text-right">Doanh thu net</th><th className="text-right">Chênh lệch</th><th className="text-right">Thưởng {agent.commission_pct}%</th></tr></thead>
        <tbody>{months.map(m => <tr key={m.month}><td>{fmtMonth(m.month)}</td><td className="text-right">{m.bookings}</td><td className="text-right">{m.rn}</td><td className="text-right">{fmtVND(m.revenue)}</td><td className="text-right">{fmtVND(m.margin)}</td><td className="text-right">{fmtVND(m.commission)}</td></tr>)}</tbody>
      </Table>
    </>
  )
}

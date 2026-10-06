'use client'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { FileSpreadsheet } from 'lucide-react'
import { repo } from '@/lib/repo'
import { useAsync, useDemo } from '@/store/provider'
import { fmtMonth, fmtVND, fmtAxis } from '@/lib/format'
import { downloadCsv } from '@/lib/csv'
import { Button, Card, PageTitle, SkeletonList, Table } from '@/components/ui'

export default function AgentReport() {
  const { overlay } = useDemo()
  const st = useAsync(() => repo.getAgent(overlay.session.agentId!), [overlay.session.agentId])
  if (!st.data) return <SkeletonList />
  const { agent, months } = st.data
  const data = months.map(m => ({ ...m, label: fmtMonth(m.month) }))
  return (
    <>
      <PageTitle title="Báo cáo tháng" sub={agent.name}>
        <Button variant="secondary" onClick={() => downloadCsv(`bao-cao-${agent.id}.csv`, [['Tháng', 'Booking', 'Room nights', 'Doanh thu net', 'Hoa hồng'], ...months.map(m => [m.month, m.bookings, m.rn, m.revenue, Math.round(m.commission)])])}>
          <FileSpreadsheet className="size-4" /> Xuất Excel
        </Button>
      </PageTitle>
      <Card className="h-72 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
            <YAxis tickFormatter={v => fmtAxis(v)} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} width={70} />
            <Tooltip formatter={v => fmtVND(Number(v))} contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }} />
            <Bar isAnimationActive={false} dataKey="revenue" name="Doanh thu net" fill="var(--primary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
      <Table className="mt-6">
        <thead><tr><th>Tháng</th><th className="text-right">Booking</th><th className="text-right">Room nights</th><th className="text-right">Doanh thu net</th></tr></thead>
        <tbody>{months.map(m => <tr key={m.month}><td>{fmtMonth(m.month)}</td><td className="text-right">{m.bookings}</td><td className="text-right">{m.rn}</td><td className="text-right">{fmtVND(m.revenue)}</td></tr>)}</tbody>
      </Table>
    </>
  )
}

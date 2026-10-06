'use client'
import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { FileSpreadsheet } from 'lucide-react'
import { repo } from '@/lib/repo'
import { useAsync } from '@/store/provider'
import { useAdmin } from '@/components/admin/use-admin'
import { downloadCsv } from '@/lib/csv'
import { fmtDayMonth, fmtMonth, fmtNumber, fmtPct, fmtRange, fmtVND, fmtAxis } from '@/lib/format'
import { Button, Card, PageTitle, Segmented, SkeletonList, Table } from '@/components/ui'

type G = 'day' | 'month' | 'year' | 'hotel' | 'channel' | 'agent'
const H2 = { from: '2026-07-01', to: '2026-12-31' }

export default function ReportsAdmin() {
  const a = useAdmin()
  const [g, setG] = useState<G>('month')
  const p = g === 'month' || g === 'year' ? H2 : a.period
  const rows = useAsync(() => repo.report({ p, hotelId: a.hotelId, groupBy: g }), [g, p, a.hotelId])
  const label = (k: string) => (g === 'day' ? fmtDayMonth(k) : g === 'month' ? fmtMonth(k) : k)
  const data = rows.data?.map(r => ({ ...r, label: label(r.label) }))
  return (
    <div className="space-y-4">
      <PageTitle title="Reports" sub={`${fmtRange(p.from, p.to)} · ${a.hotelId === 'all' ? 'Tất cả khách sạn' : a.hotels.find(h => h.id === a.hotelId)?.name}`}>
        <Button variant="secondary" disabled={!rows.data} onClick={() => downloadCsv(`bao-cao-${g}-${p.from}.csv`, [['Nhóm', 'Booking', 'Huỷ', 'Room nights', 'Doanh thu phòng', 'Occupancy', 'ADR'], ...(rows.data ?? []).map(r => [r.label, r.bookings, r.cancelled, r.roomNights, Math.round(r.revenue), (r.occupancy * 100).toFixed(1) + '%', Math.round(r.adr)])])}>
          <FileSpreadsheet className="size-4" /> Xuất Excel
        </Button>
      </PageTitle>
      <Segmented label="Nhóm theo" value={g} onChange={setG} options={[{ value: 'day', label: 'Ngày' }, { value: 'month', label: 'Tháng' }, { value: 'year', label: 'Năm' }, { value: 'hotel', label: 'Khách sạn' }, { value: 'channel', label: 'Kênh' }, { value: 'agent', label: 'Đại lý' }]} />
      {(g === 'month' || g === 'year') && <p className="text-xs text-muted">Theo tháng/năm dùng toàn bộ dữ liệu 07–12/2026; các nhóm khác dùng kỳ ở thanh trên.</p>}
      {!data ? <SkeletonList rows={5} /> : (
        <>
          <Card className="h-72 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--muted)' }} interval={g === 'day' ? 2 : 0} />
                <YAxis tickFormatter={v => fmtAxis(v)} tick={{ fontSize: 11, fill: 'var(--muted)' }} width={70} />
                <Tooltip formatter={v => fmtVND(Number(v))} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--fg)' }} />
                <Bar isAnimationActive={false} dataKey="revenue" name="Doanh thu phòng" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Table>
            <thead><tr><th>Nhóm</th><th className="text-right">Booking</th><th className="text-right">Huỷ</th><th className="text-right">Room nights</th><th className="text-right">Doanh thu phòng</th><th className="text-right">Occupancy</th><th className="text-right">ADR</th></tr></thead>
            <tbody>{data.map(r => <tr key={r.key}><td className="font-medium">{r.label}</td><td className="text-right">{fmtNumber(r.bookings)}</td><td className="text-right">{fmtNumber(r.cancelled)}</td><td className="text-right">{fmtNumber(r.roomNights)}</td><td className="text-right">{fmtVND(r.revenue)}</td><td className="text-right">{r.occupancy ? fmtPct(r.occupancy, 1) : '—'}</td><td className="text-right">{fmtVND(r.adr)}</td></tr>)}</tbody>
          </Table>
        </>
      )}
    </div>
  )
}

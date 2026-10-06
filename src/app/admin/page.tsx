'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowDownRight, ArrowUpRight, Info } from 'lucide-react'
import { repo } from '@/lib/repo'
import { useAsync } from '@/store/provider'
import { useAdmin } from '@/components/admin/use-admin'
import { CHANNEL, CHANNEL_COLOR } from '@/lib/labels'
import { fmtDayMonth, fmtMoneyShort, fmtNumber, fmtPct, fmtRange, fmtVND, fmtAxis } from '@/lib/format'
import type { Channel } from '@/lib/types'
import { previousPeriod, type Kpis } from '@/lib/metrics'
import { Card, PageTitle, Skeleton, Table, cn } from '@/components/ui'

const TT = { contentStyle: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--foreground)' } }
const AX = { tick: { fontSize: 11, fill: 'var(--muted-foreground)' } }

function Kpi({ label, value, cur, prev, pct, invert }: { label: string; value: string; cur: number; prev: number; pct?: boolean; invert?: boolean }) {
  const diff = pct ? (cur - prev) * 100 : prev ? ((cur - prev) / prev) * 100 : 0
  const good = invert ? diff < 0 : diff > 0
  return (
    <Card className="p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      <p className={cn('mt-1 flex items-center gap-0.5 text-xs', Math.abs(diff) < 0.05 ? 'text-muted-foreground' : good ? 'text-ok' : 'text-danger')}>
        {Math.abs(diff) < 0.05 ? 'Không đổi so với kỳ trước' : <>{diff > 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}{diff > 0 ? '+' : ''}{diff.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}{pct ? ' điểm %' : '%'} so với kỳ trước</>}
      </p>
    </Card>
  )
}

function KpiGrid({ c, p }: { c: Kpis; p: Kpis }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      <Kpi label="Tổng booking" value={fmtNumber(c.bookings)} cur={c.bookings} prev={p.bookings} />
      <Kpi label="Room nights" value={fmtNumber(c.roomNights)} cur={c.roomNights} prev={p.roomNights} />
      <Kpi label="Doanh thu phòng" value={fmtMoneyShort(c.revenue)} cur={c.revenue} prev={p.revenue} />
      <Kpi label="Occupancy" value={fmtPct(c.occupancy, 0)} cur={c.occupancy} prev={p.occupancy} pct />
      <Kpi label="ADR" value={fmtMoneyShort(c.adr)} cur={c.adr} prev={p.adr} />
      <Kpi label="Direct booking" value={fmtPct(c.direct, 0)} cur={c.direct} prev={p.direct} pct />
      <Kpi label="Agent" value={fmtPct(c.agent, 0)} cur={c.agent} prev={p.agent} pct />
      <Kpi label="OTA" value={fmtPct(c.ota, 0)} cur={c.ota} prev={p.ota} pct invert />
      <Kpi label="Cancellation" value={fmtPct(c.cancellation, 1)} cur={c.cancellation} prev={p.cancellation} pct invert />
    </div>
  )
}

export default function Dashboard() {
  const a = useAdmin()
  const router = useRouter()
  const d = useAsync(() => repo.dashboard(a.period, a.hotelId), [a.period, a.hotelId])
  const q = (extra: Record<string, string>) => `/admin/bookings?${new URLSearchParams({ hotel: a.hotelId, from: a.period.from, to: a.period.to, ...extra })}`
  const scope = a.hotelId === 'all' ? 'Tất cả khách sạn' : a.hotels.find(h => h.id === a.hotelId)?.name

  if (!d.data) return <><PageTitle title="Dashboard lãnh đạo" /><div className="grid gap-3 md:grid-cols-5">{Array.from({ length: 10 }, (_, i) => <Skeleton key={i} className="h-24" />)}</div><Skeleton className="mt-6 h-72" /></>
  const { current: c, previous: p, daily, hotels, rooms, agents, returning } = d.data
  const mix = (['website', 'offline', 'agent', 'ota'] as Channel[]).map(ch => ({ ch, name: CHANNEL[ch][0], value: c.channelCount[ch], revenue: c.channelRevenue[ch] }))
  const best = [...hotels].sort((x, y) => y.revenue - x.revenue)

  return (
    <div className={cn('space-y-6', d.loading && 'opacity-70 transition-opacity')}>
      <PageTitle title="Dashboard lãnh đạo" sub={`${scope} · ${fmtRange(a.period.from, a.period.to)} · so với ${fmtRange(previousPeriod(a.period).from, previousPeriod(a.period).to)}`} />
      <KpiGrid c={c} p={p} />
      <p className="flex items-center gap-1 text-xs text-muted-foreground"><Info className="size-3.5" />Mọi chỉ số tính từ dữ liệu booking (không nhập tay). Booking/huỷ/kênh theo ngày nhận phòng; room nights, doanh thu, occupancy, ADR theo đêm lưu trú trong kỳ. Bấm vào biểu đồ để lọc danh sách booking.</p>

      <div className="grid gap-4 xl:grid-cols-3 [&>*]:min-w-0">
        <Card className="p-4 xl:col-span-2">
          <h2 className="mb-2 font-semibold">Doanh thu phòng theo ngày & kênh</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daily} onClick={e => { const day = (e?.activeLabel as string | undefined); if (day) router.push(`/admin/bookings?${new URLSearchParams({ hotel: a.hotelId, stay: day })}`) }} className="cursor-pointer">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tickFormatter={fmtDayMonth} {...AX} minTickGap={12} />
                <YAxis tickFormatter={v => fmtAxis(v)} {...AX} width={70} />
                <Tooltip labelFormatter={l => `Đêm ${fmtDayMonth(String(l))}`} formatter={(v, n) => [fmtVND(Number(v)), n]} {...TT} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {(['website', 'offline', 'agent', 'ota'] as Channel[]).map(ch => <Bar isAnimationActive={false} key={ch} dataKey={ch} name={CHANNEL[ch][0]} stackId="a" fill={CHANNEL_COLOR[ch]} />)}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-4">
          <h2 className="mb-2 font-semibold">Cơ cấu kênh (số booking)</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie isAnimationActive={false} data={mix} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={2} onClick={x => router.push(q({ channel: (x.payload as { ch: string }).ch }))} className="cursor-pointer"
                  label={({ percent }) => fmtPct(Number(percent), 0)}>
                  {mix.map(m => <Cell key={m.ch} fill={CHANNEL_COLOR[m.ch]} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [`${fmtNumber(Number(v))} booking`, n]} {...TT} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <h2 className="mb-2 font-semibold">Occupancy theo khách sạn</h2>
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hotels.map(h => ({ name: h.hotel.name, id: h.hotel.id, occ: Math.round(h.occupancy * 1000) / 10 }))} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} unit="%" {...AX} />
              <YAxis type="category" dataKey="name" width={170} {...AX} />
              <Tooltip formatter={v => `${v}%`} {...TT} />
              <Bar isAnimationActive={false} dataKey="occ" name="Occupancy" fill="var(--primary)" radius={[0, 4, 4, 0]} className="cursor-pointer" onClick={x => router.push(q({ hotel: (x as unknown as { id: string }).id }))} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <h2 className="pt-2 text-lg font-bold">Xem sâu</h2>
      <div className="grid gap-4 xl:grid-cols-2 [&>*]:min-w-0">
        <section>
          <h3 className="mb-2 text-sm font-semibold">1. Khách sạn nào bán tốt nhất?</h3>
          <Table>
            <thead><tr><th>Khách sạn</th><th className="text-right">Doanh thu</th><th className="text-right">RN</th><th className="text-right">Occ.</th><th className="text-right">ADR</th></tr></thead>
            <tbody>{best.map((h, i) => (
              <tr key={h.hotel.id} className="cursor-pointer hover:bg-muted" onClick={() => router.push(q({ hotel: h.hotel.id }))}>
                <td>{i === 0 && '🏆 '}<span className="font-medium">{h.hotel.name}</span></td><td className="text-right">{fmtMoneyShort(h.revenue)}</td><td className="text-right">{fmtNumber(h.roomNights)}</td><td className="text-right">{fmtPct(h.occupancy, 0)}</td><td className="text-right">{fmtMoneyShort(h.adr)}</td>
              </tr>
            ))}</tbody>
          </Table>
        </section>
        <section>
          <h3 className="mb-2 text-sm font-semibold">2. Phòng nào bán tốt nhất / đang yếu?</h3>
          <Table>
            <thead><tr><th>Hạng phòng</th><th className="text-right">Occ.</th><th className="text-right">RN</th><th className="text-right">Doanh thu</th></tr></thead>
            <tbody>
              {[...rooms.slice(0, 4), ...rooms.slice(Math.max(4, rooms.length - 4))].map((r, i) => (
                <tr key={r.rt.room_type_id} className="cursor-pointer hover:bg-muted" onClick={() => router.push(q({ room: r.rt.room_type_id, hotel: r.rt.hotel_id }))}>
                  <td><span className={cn('mr-1 inline-block size-2 rounded-full', i < 4 ? 'bg-ok' : 'bg-danger')} />{r.rt.name}<div className="text-xs text-muted-foreground">{r.hotel.name}</div></td>
                  <td className="text-right">{fmtPct(r.occupancy, 0)}</td><td className="text-right">{r.rn}</td><td className="text-right">{fmtMoneyShort(r.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </section>
        <section>
          <h3 className="mb-2 text-sm font-semibold">3. Đại lý nào bán nhiều nhất?</h3>
          <Table>
            <thead><tr><th>Đại lý</th><th className="text-right">Booking</th><th className="text-right">Doanh thu net</th><th className="text-right">Công nợ</th></tr></thead>
            <tbody>{agents.slice(0, 6).map(g => (
              <tr key={g.agent.id} className="cursor-pointer hover:bg-muted" onClick={() => router.push(`/admin/agents/${g.agent.id}`)}>
                <td className="font-medium">{g.agent.name}</td><td className="text-right">{g.bookings}</td><td className="text-right">{fmtMoneyShort(g.revenue)}</td><td className="text-right">{fmtMoneyShort(g.debt)}</td>
              </tr>
            ))}</tbody>
          </Table>
        </section>
        <section>
          <h3 className="mb-2 text-sm font-semibold">4. Website trực tiếp vs OTA mang về bao nhiêu?</h3>
          <Card className="space-y-3 p-4">
            {mix.map(m => {
              const share = m.revenue / (c.revenue || 1)
              return (
                <Link key={m.ch} href={q({ channel: m.ch })} className="block">
                  <div className="flex justify-between text-sm"><span>{m.name}</span><span className="font-semibold">{fmtMoneyShort(m.revenue)} · {fmtPct(share, 0)}</span></div>
                  <div className="mt-1 h-2 rounded-full bg-muted"><div className="h-2 rounded-full" style={{ width: `${share * 100}%`, background: CHANNEL_COLOR[m.ch] }} /></div>
                </Link>
              )
            })}
            <p className="text-xs text-muted-foreground">Hoa hồng OTA ước tính (15–18%): <b className="text-danger">{fmtMoneyShort(c.channelRevenue.ota * 0.165)}</b> — mỗi điểm % chuyển từ OTA sang direct tiết kiệm ~{fmtMoneyShort(c.revenue * 0.01 * 0.165)}/kỳ.</p>
          </Card>
        </section>
        <section className="xl:col-span-2">
          <h3 className="mb-2 text-sm font-semibold">5. Khách cũ quay lại bao nhiêu?</h3>
          <Card className="flex flex-wrap items-center gap-6 p-4">
            <div><p className="text-3xl font-bold">{returning.returning}</p><p className="text-xs text-muted-foreground">booking của khách quay lại</p></div>
            <div><p className="text-3xl font-bold">{fmtPct(returning.identified ? returning.returning / returning.identified : 0, 0)}</p><p className="text-xs text-muted-foreground">trên {returning.identified} booking đã định danh khách</p></div>
            <div><p className="text-3xl font-bold">{returning.customers}</p><p className="text-xs text-muted-foreground">khách quay lại</p></div>
            <p className="max-w-md text-sm text-muted-foreground">Booking OTA/đại lý thường không có hồ sơ khách → chỉ đo được trên kênh trực tiếp. Đây là lý do cần đẩy direct booking và CRM chung.</p>
            <Link href="/admin/customers?segment=returning" className="ml-auto text-sm font-medium text-primary hover:underline">Xem phân khúc khách quay lại →</Link>
          </Card>
        </section>
      </div>
    </div>
  )
}


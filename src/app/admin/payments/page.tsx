'use client'
import Link from 'next/link'
import { useState } from 'react'
import { repo } from '@/lib/repo'
import { useAsync } from '@/store/provider'
import { useAdmin } from '@/components/admin/use-admin'
import { CHANNEL, METHOD } from '@/lib/labels'
import { fmtDateTime, fmtMoneyShort, fmtNumber, fmtVND, fmtPct } from '@/lib/format'
import type { PaymentMethod } from '@/lib/types'
import { Badge, Card, PageTitle, Select, SkeletonList, Stat, Table } from '@/components/ui'

export default function PaymentsAdmin() {
  const a = useAdmin()
  const [method, setMethod] = useState<PaymentMethod | ''>('')
  const tx = useAsync(() => repo.transactions({ hotelId: a.hotelId, method: method || undefined, from: a.period.from, to: a.period.to }), [a.hotelId, method, a.period])
  const agents = useAsync(() => repo.listAgents(), [])
  if (!tx.data) return <SkeletonList rows={6} />
  const d = tx.data
  return (
    <div className="space-y-6">
      <PageTitle title="Payments" sub="Giao dịch theo ngày thanh toán trong kỳ đã chọn · ngoài đời: lõi thanh toán & công nợ TourWell" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Tổng tiền thu" value={fmtMoneyShort(d.total)} sub={`${fmtNumber(d.count)} giao dịch`} />
        <Stat label="Phải thu (chưa trả / đặt cọc)" value={fmtMoneyShort(d.receivable)} sub={`${d.receivableCount} booking`} />
        <Stat label="Công nợ đại lý" value={fmtMoneyShort(agents.data?.reduce((s, x) => s + x.debt, 0) ?? 0)} />
      </div>
      <section>
        <h2 className="mb-2 font-semibold">Đối soát theo phương thức</h2>
        <Table>
          <thead><tr><th>Phương thức</th><th className="text-right">Số GD</th><th className="text-right">Số tiền</th><th className="text-right">Đã đối soát</th><th className="text-right">Chênh</th><th>Tình trạng</th></tr></thead>
          <tbody>{d.byMethod.map(m => (
            <tr key={m.method}><td>{METHOD[m.method]}</td><td className="text-right">{fmtNumber(m.count)}</td><td className="text-right">{fmtVND(m.amount)}</td><td className="text-right">{fmtVND(m.reconciled)}</td><td className="text-right">{fmtVND(m.amount - m.reconciled)}</td>
              <td>{m.amount - m.reconciled > 0 ? <Badge tone="warn">Chờ đối soát {fmtPct((m.amount - m.reconciled) / m.amount, 0)}</Badge> : <Badge tone="ok">Khớp</Badge>}</td></tr>
          ))}</tbody>
        </Table>
        <p className="mt-1 text-xs text-muted-foreground">OTA thu hộ đối soát theo kỳ thanh toán của OTA (giả lập 82% đã về). Cổng thanh toán & merchant đứng tên ai: UNKNOWN.</p>
      </section>
      <section>
        <h2 className="mb-2 font-semibold">Công nợ đại lý</h2>
        <Table>
          <thead><tr><th>Đại lý</th><th className="text-right">Công nợ phát sinh</th><th className="text-right">Hạn mức</th><th className="text-right">Hạn mức đã dùng</th></tr></thead>
          <tbody>{(agents.data ?? []).map(g => <tr key={g.agent.id}><td><Link href={`/admin/agents/${g.agent.id}`} className="text-primary hover:underline">{g.agent.name}</Link></td><td className="text-right">{fmtVND(g.debt)}</td><td className="text-right">{fmtVND(g.agent.credit_limit)}</td><td className="text-right">{fmtPct(g.limitUsed, 0)}</td></tr>)}</tbody>
        </Table>
      </section>
      <section>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="font-semibold">Giao dịch gần nhất</h2>
          <Select value={method} onChange={e => setMethod(e.target.value as PaymentMethod | '')} className="w-48" aria-label="Lọc phương thức">
            <option value="">Mọi phương thức</option>{Object.entries(METHOD).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </Select>
        </div>
        <Card className="overflow-hidden">
          <Table className="rounded-none border-0">
            <thead><tr><th>Thời gian</th><th>Booking</th><th>Khách</th><th>Nguồn</th><th>Phương thức</th><th className="text-right">Số tiền</th></tr></thead>
            <tbody>{d.rows.slice(0, 50).map(t => <tr key={t.id + t.booking}><td className="whitespace-nowrap">{fmtDateTime(t.at)}</td><td><Link href={`/admin/bookings/${t.booking}`} className="font-mono text-primary hover:underline">{t.booking}</Link></td><td>{t.guest}</td><td><Badge tone={CHANNEL[t.channel][1]}>{t.source_name}</Badge></td><td>{METHOD[t.method]}{t.note && <div className="text-xs text-muted-foreground">{t.note}</div>}</td><td className="text-right">{fmtVND(t.amount)}</td></tr>)}</tbody>
          </Table>
        </Card>
      </section>
    </div>
  )
}

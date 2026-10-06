'use client'
import Link from 'next/link'
import { use } from 'react'
import { Cake, Megaphone, ShoppingBag, Ticket, Crown, Send } from 'lucide-react'
import { repo } from '@/lib/repo'
import { useAsync } from '@/store/provider'
import { fmtDate, fmtNumber, fmtRange, fmtVND } from '@/lib/format'
import { CHANNEL, STATUS } from '@/lib/labels'
import { Badge, Breadcrumb, Button, Card, Empty, SkeletonList, Table } from '@/components/ui'
import { toast } from '@/components/ui/overlay'

const ACTION_ICON: Record<string, typeof Cake> = { 'Sinh nhật': Cake, Loyalty: Crown, 'Cross-sell': ShoppingBag, Remarketing: Megaphone, Voucher: Ticket }

export default function CustomerProfile({ params }: PageProps<'/admin/customers/[id]'>) {
  const { id } = use(params)
  const p = useAsync(() => repo.getCustomer(id), [id])
  if (p.loading && !p.data) return <SkeletonList />
  if (!p.data) return <Empty title="Không tìm thấy khách" />
  const { customer: c, stats, bookings, actions } = p.data
  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Customers / CRM', href: '/admin/customers' }, { label: c.name }]} />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div><h1 className="text-2xl font-bold">{c.name}</h1><p className="text-sm text-muted">{c.phone} · {c.email} · {c.nationality} · sinh nhật {fmtDate(c.birthday).slice(0, 5)}</p></div>
            <Badge tone="warn" className="text-sm"><Crown className="size-4" />{c.tier} · {fmtNumber(c.points)} điểm</Badge>
          </div>
          {/* Thẻ hồ sơ đúng ví dụ PDF §7 */}
          <div className="mt-4 rounded-xl border border-border bg-surface-2 p-4 font-mono text-sm leading-relaxed">
            <p className="font-sans text-base font-bold">{c.name}</p>
            <p>{stats.bookings} bookings | {stats.roomNights} room nights | Total spend: {fmtNumber(stats.spend / 1e6)} triệu</p>
            <p>Preferred: {stats.oceanView ? 'Ocean View' : c.preferences[0] ?? '—'}</p>
            <p>{stats.boughtTour ? 'Đã mua tour Rooty Trip' : 'Chưa mua tour'} | {stats.usedTransfer ? 'Đã sử dụng Airport Transfer' : 'Chưa dùng xe sân bay'}</p>
            <p>Last stay: {stats.lastStay ? fmtDate(stats.lastStay) : '—'}</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">{c.preferences.map(x => <Badge key={x} tone="brand">{x}</Badge>)}{c.family && <Badge tone="info">Thường đi gia đình</Badge>}</div>
          {c.note && <p className="mt-3 text-sm text-muted">Ghi chú: {c.note}</p>}
        </Card>
        <Card className="p-5">
          <h2 className="font-semibold">Gợi ý hành động</h2>
          <p className="text-xs text-muted">Loyalty → Member Price → Voucher → Birthday → Remarketing → Cross-sell</p>
          <ul className="mt-3 space-y-2">
            {actions.map((x, i) => {
              const Icon = ACTION_ICON[x.kind] ?? Ticket
              return (
                <li key={i} className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm">
                  <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1"><p className="font-medium">{x.kind}</p><p className="text-muted">{x.text}</p></div>
                  <Button size="sm" variant="secondary" onClick={() => toast(`Đã tạo tác vụ "${x.kind}" cho ${c.name} (giả lập)`)} aria-label={`Thực hiện ${x.kind}`}><Send className="size-3.5" /></Button>
                </li>
              )
            })}
          </ul>
          {c.vouchers.length > 0 && <p className="mt-3 text-xs text-muted">Voucher đang có: {c.vouchers.map(v => v.code).join(', ')}</p>}
        </Card>
      </div>
      <section>
        <h2 className="mb-3 font-semibold">Lịch sử booking</h2>
        <Table>
          <thead><tr><th>Mã</th><th>Khách sạn / phòng</th><th>Ngày</th><th>Nguồn</th><th>Dịch vụ thêm</th><th>Trạng thái</th><th className="text-right">Tổng</th></tr></thead>
          <tbody>{bookings.map(b => (
            <tr key={b.code}>
              <td><Link href={`/admin/bookings/${b.code}`} className="font-mono text-primary hover:underline">{b.code}</Link></td>
              <td>{b.hotel.name}<div className="text-xs text-muted">{b.rt.name}</div></td>
              <td className="whitespace-nowrap">{fmtRange(b.checkin_date, b.checkout_date)}</td>
              <td><Badge tone={CHANNEL[b.channel][1]}>{CHANNEL[b.channel][0]}</Badge></td>
              <td className="text-xs">{b.addons.map(x => x.name).join(', ') || '—'}</td>
              <td><Badge tone={STATUS[b.status][1]}>{STATUS[b.status][0]}</Badge></td>
              <td className="text-right">{fmtVND(b.total)}</td>
            </tr>
          ))}</tbody>
        </Table>
      </section>
    </div>
  )
}

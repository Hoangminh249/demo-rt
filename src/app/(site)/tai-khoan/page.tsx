'use client'
import Link from 'next/link'
import { Crown, Ticket, Heart } from 'lucide-react'
import { repo } from '@/lib/repo'
import { useAsync, useDemo } from '@/store/provider'
import { fmtDate, fmtRange, fmtVND } from '@/lib/format'
import { STATUS } from '@/lib/labels'
import { Badge, ButtonLink, Card, Empty, PageTitle, SkeletonList, Stat, Table } from '@/components/ui'

export default function AccountPage() {
  const { overlay } = useDemo()
  const id = overlay.session.customerId
  const p = useAsync(() => (id ? repo.getCustomer(id) : Promise.resolve(null)), [id])
  if (!id) return <div className="mx-auto max-w-3xl px-4 py-10"><Empty title="Bạn chưa đăng nhập"><ButtonLink href="/thanh-vien" className="mt-3">Đăng nhập (giả lập)</ButtonLink></Empty></div>
  if (!p.data) return <div className="mx-auto max-w-5xl px-4 py-10"><SkeletonList /></div>
  const { customer: c, stats, bookings } = p.data
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <PageTitle title={`Xin chào, ${c.name}`} sub={`${c.email} · ${c.phone}`}>
        <Badge tone="warn" className="text-sm"><Crown className="size-4" /> {c.tier} · {c.points.toLocaleString('vi-VN')} điểm</Badge>
      </PageTitle>
      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Booking" value={stats.bookings} />
        <Stat label="Đêm đã ở" value={stats.roomNights} />
        <Stat label="Tổng chi" value={fmtVND(stats.spend)} />
        <Stat label="Lần ở gần nhất" value={stats.lastStay ? fmtDate(stats.lastStay) : '—'} />
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <h2 className="flex items-center gap-2 font-semibold"><Ticket className="size-4 text-primary" /> Voucher của tôi</h2>
          {c.vouchers.length ? (
            <ul className="mt-3 space-y-2 text-sm">
              {c.vouchers.map(v => <li key={v.code} className="rounded-lg border border-dashed border-primary/40 bg-accent p-3"><b className="font-mono">{v.code}</b><p>{v.desc}</p><p className="text-xs text-muted-foreground">HSD {fmtDate(v.expires)}</p></li>)}
            </ul>
          ) : <p className="mt-2 text-sm text-muted-foreground">Chưa có voucher.</p>}
        </Card>
        <Card className="p-5">
          <h2 className="flex items-center gap-2 font-semibold"><Heart className="size-4 text-primary" /> Sở thích (dùng để cá nhân hoá)</h2>
          <div className="mt-3 flex flex-wrap gap-2">{c.preferences.map(x => <Badge key={x} tone="brand">{x}</Badge>)}</div>
          <p className="mt-3 text-sm text-muted-foreground">{stats.boughtTour ? 'Đã mua tour Rooty Trip' : 'Chưa mua tour'} · {stats.usedTransfer ? 'Đã dùng xe sân bay' : 'Chưa dùng xe sân bay'}</p>
        </Card>
      </div>
      <h2 className="mb-3 mt-8 text-lg font-bold">Lịch sử booking</h2>
      {bookings.length === 0 ? <Empty title="Chưa có booking" /> : (
        <Table>
          <thead><tr><th>Mã</th><th>Khách sạn</th><th>Ngày</th><th>Trạng thái</th><th className="text-right">Tổng</th></tr></thead>
          <tbody>
            {bookings.map(b => (
              <tr key={b.code}>
                <td><Link href={`/my-booking?code=${b.code}`} className="font-mono text-primary hover:underline">{b.code}</Link></td>
                <td>{b.hotel.name}<div className="text-xs text-muted-foreground">{b.rt.name}</div></td>
                <td>{fmtRange(b.checkin_date, b.checkout_date)}</td>
                <td><Badge tone={STATUS[b.status][1]}>{STATUS[b.status][0]}</Badge></td>
                <td className="text-right">{fmtVND(b.total)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  )
}

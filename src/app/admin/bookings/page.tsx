// Booking (bố cục mặc định "Bảng dữ liệu"): lọc khách sạn · khoảng ngày nhận phòng (≤ 30 ngày, giới hạn Gohost) · trạng thái;
// bảng ở màn rộng, danh sách dòng dưới sm; phân trang theo Gohost (50 dòng / trang). Chỉ xem: sửa booking làm trong Gohost.
import { Suspense } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AdminShell } from '@/components/admin/shell'
import { DateRangeInput } from '@/components/admin/date-range'
import { BOOKING_STATUSES, BookingStatus } from '@/components/admin/booking-status'
import { CARD, Empty, GohostError, Skel, vnd } from '@/components/admin/ui'
import { addDays, diffDays, fmtDate, fmtDayMonth, isISODate, today } from '@/lib/format'
import { bookingList, connectedHotels } from '@/lib/repo/admin'
import type { BookingRow } from '@/lib/types'

export const metadata = { title: 'Booking' }
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? null

function Dates({ b, now }: { b: BookingRow; now: string }) {
  if (!b.checkin) return <span className="text-muted-foreground">—</span>
  return (
    <span className="whitespace-nowrap tabular-nums">
      {fmtDayMonth(b.checkin)}{b.checkout ? ` – ${fmtDayMonth(b.checkout)}` : ''}
      {b.checkin === now && <span className="ml-1.5 font-medium text-foreground">· Hôm nay</span>}
    </span>
  )
}

const href = (q: Record<string, string>) => `/admin/bookings?${new URLSearchParams(q)}`

async function Results({ hotel, tenant, start, end, status, page }: { hotel: string; tenant: string; start: string; end: string; status: string; page: number }) {
  const { data, error } = await bookingList(tenant, { start, end, status: status === 'all' ? undefined : status, page })
  if (error || !data) return <GohostError code={error ?? 'UPSTREAM'} />
  const now = today()
  const detail = (code: string) => `/admin/bookings/${encodeURIComponent(code)}?hotel=${hotel}`
  const q = { hotel, in: start, out: end, status }
  if (!data.rows.length) return <section className={CARD}><Empty>Không có booking nào nhận phòng từ {fmtDate(start)} đến {fmtDate(end)}{status !== 'all' ? ' ở trạng thái này' : ''}.</Empty></section>
  return (
    <section className={`${CARD} overflow-hidden`}>
      <ul className="divide-y divide-border sm:hidden">
        {data.rows.map(b => (
          <li key={b.code}>
            <Link href={detail(b.code)} className="block px-4 py-3 hover:bg-muted/60">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><p className="truncate text-sm font-medium">{b.customer ?? '—'}</p><p className="font-mono text-xs text-muted-foreground">{b.code}</p></div>
                <BookingStatus status={b.status} />
              </div>
              <div className="mt-1.5 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <Dates b={b} now={now} />
                <span className="text-sm font-medium text-foreground tabular-nums">{b.amount != null ? vnd(b.amount) : '—'}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-border text-xs text-muted-foreground">
            <tr><th className="px-5 py-2.5 font-medium">Mã</th><th className="px-3 py-2.5 font-medium">Khách</th><th className="px-3 py-2.5 font-medium">Nhận – trả</th><th className="px-3 py-2.5 font-medium">Hạng phòng</th><th className="px-3 py-2.5 font-medium">Nguồn</th><th className="px-3 py-2.5 font-medium">Trạng thái</th><th className="px-5 py-2.5 text-right font-medium">Tổng tiền</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.rows.map(b => (
              <tr key={b.code} className="hover:bg-muted/60">
                <td className="px-5 py-2.5"><Link href={detail(b.code)} className="font-mono text-xs font-medium text-foreground underline-offset-4 hover:underline">{b.code}</Link></td>
                <td className="max-w-56 px-3 py-2.5"><p className="truncate">{b.customer ?? '—'}</p>{b.phone && <p className="text-xs text-muted-foreground tabular-nums">{b.phone}</p>}</td>
                <td className="px-3 py-2.5"><Dates b={b} now={now} /></td>
                <td className="max-w-48 truncate px-3 py-2.5" title={b.rooms ?? undefined}>{b.rooms ?? <span className="text-muted-foreground">—</span>}</td>
                <td className="px-3 py-2.5">{b.source ?? <span className="text-muted-foreground">—</span>}</td>
                <td className="px-3 py-2.5"><BookingStatus status={b.status} /></td>
                <td className="px-5 py-2.5 text-right font-medium whitespace-nowrap tabular-nums">{b.amount != null ? vnd(b.amount) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3 text-sm text-muted-foreground">
        <span className="tabular-nums">{data.total} booking{data.lastPage > 1 ? ` · trang ${data.page}/${data.lastPage}` : ''}</span>
        {data.lastPage > 1 && (
          <div className="flex gap-2">
            {data.page > 1 ? <Link href={href({ ...q, page: String(data.page - 1) })} aria-label="Trang trước" className={buttonVariants({ size: 'icon' })}><ChevronLeft aria-hidden /></Link> : <Button size="icon" disabled aria-label="Trang trước"><ChevronLeft aria-hidden /></Button>}
            {data.page < data.lastPage ? <Link href={href({ ...q, page: String(data.page + 1) })} aria-label="Trang sau" className={buttonVariants({ size: 'icon' })}><ChevronRight aria-hidden /></Link> : <Button size="icon" disabled aria-label="Trang sau"><ChevronRight aria-hidden /></Button>}
          </div>
        )}
      </footer>
    </section>
  )
}

export default async function AdminBookingsPage({ searchParams }: PageProps<'/admin/bookings'>) {
  const sp = await searchParams
  const hotels = connectedHotels()
  const now = today()
  const hotel = hotels.find(h => h.slug === one(sp.hotel)) ?? hotels[0]
  const startParam = one(sp.in)
  const endParam = one(sp.out)
  const custom = isISODate(startParam) && isISODate(endParam)
  const start = custom ? startParam : now
  const end = custom ? endParam! : addDays(now, 29)
  const days = diffDays(start, end) + 1
  const status = BOOKING_STATUSES.some(s => s.value === one(sp.status)) ? one(sp.status)! : 'all'
  const page = Math.max(1, Number(one(sp.page)) || 1)

  return (
    <AdminShell active="bookings" title="Booking">
      <div className="grid max-w-[1200px] grid-cols-1 gap-4">
        {!hotel ? (
          <section className={CARD}><Empty>Chưa có khách sạn nào nối Gohost. Điền gohost_tenant_id trong src/content trước.</Empty></section>
        ) : (
          <>
            <form className="flex flex-wrap items-end gap-3">
              <div className="grid gap-1.5">
                <label htmlFor="bk-hotel" className="text-sm font-medium">Khách sạn</label>
                <Select name="hotel" defaultValue={hotel.slug}>
                  <SelectTrigger id="bk-hotel" className="w-60"><SelectValue /></SelectTrigger>
                  <SelectContent>{hotels.map(h => <SelectItem key={h.slug} value={h.slug}>{h.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <DateRangeInput id="bk-dates" label="Ngày nhận phòng" from={start} to={end} unit="day" />
              <div className="grid gap-1.5">
                <label htmlFor="bk-status" className="text-sm font-medium">Trạng thái</label>
                <Select name="status" defaultValue={status}>
                  <SelectTrigger id="bk-status" className="w-44"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">Tất cả</SelectItem>{BOOKING_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button type="submit" variant="default">Xem</Button>
            </form>
            {days < 1 || days > 30
              ? <section className={CARD}><Empty>Khoảng ngày không hợp lệ: Gohost chỉ cho xem tối đa 30 ngày nhận phòng một lần.</Empty></section>
              : (
                <Suspense key={`${hotel.slug}|${start}|${end}|${status}|${page}`} fallback={<section className={`${CARD} grid gap-3 p-5`} aria-busy>{[0, 1, 2, 3, 4].map(i => <Skel key={i} className="h-10" />)}</section>}>
                  <Results hotel={hotel.slug} tenant={hotel.tenant} start={start} end={end} status={status} page={page} />
                </Suspense>
              )}
          </>
        )}
      </div>
    </AdminShell>
  )
}

'use client'
// Booking (bố cục mặc định "Bảng dữ liệu"): lọc property Gohost · khoảng ngày nhận phòng (≤ 30 ngày, giới hạn Gohost) · trạng thái;
// bảng ở màn rộng, danh sách dòng dưới sm; phân trang theo Gohost (50 dòng / trang). Chỉ xem: sửa booking làm trong Gohost.
// Lọc theo property Gohost (không theo khách sạn Rooty) để xem được booking cả khi khách sạn chưa gắn tenant.
import type { FormEvent } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from 'cn'
import { Button, buttonVariants } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DateRangeInput } from '@/components/admin/date-range'
import { BookingStatus, STATUS_OPTIONS } from '@/components/admin/booking-status'
import { CARD, Empty, GohostError, LoadFailed, Skel, vnd } from '@/components/admin/ui'
import { addDays, diffDays, fmtDate, fmtDayMonth, isISODate, today } from '@/lib/format'
import { useAdminBookings, useGohostProperties, type AdminBookings, type BookingQuery } from '@/hooks/use-admin'
import type { BookingRow } from '@/lib/types'

function Dates({ b, now }: { b: BookingRow; now: string }) {
  if (!b.checkin) return <span className="text-muted-foreground">—</span>
  return (
    <span className="whitespace-nowrap tabular-nums">
      {fmtDayMonth(b.checkin)}{b.checkout ? ` – ${fmtDayMonth(b.checkout)}` : ''}
      {b.checkin === now && <span className="ml-1.5 font-medium text-foreground">· Hôm nay</span>}
    </span>
  )
}

const pageHref = (q: BookingQuery, page: number) => `/admin/bookings?${new URLSearchParams({ property: q.property, in: q.in, out: q.out, status: q.status, page: String(page) })}`

function Results({ q, data, fetching }: { q: BookingQuery; data: NonNullable<AdminBookings['data']>; fetching: boolean }) {
  const now = today()
  const detail = (code: string) => `/admin/bookings/${encodeURIComponent(code)}?property=${encodeURIComponent(q.property)}`
  if (!data.rows.length) return <section className={CARD}><Empty>Không có booking nào nhận phòng từ {fmtDate(q.in)} đến {fmtDate(q.out)}{q.status !== 'all' ? ' ở trạng thái này' : ''}.</Empty></section>
  return (
    <section className={cn(CARD, 'overflow-hidden transition-opacity', fetching && 'opacity-60')} aria-busy={fetching}>
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
                <td className="px-3 py-2.5 capitalize">{b.source ?? <span className="text-muted-foreground">—</span>}</td>
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
            {data.page > 1 ? <Link href={pageHref(q, data.page - 1)} scroll={false} aria-label="Trang trước" className={buttonVariants({ size: 'icon' })}><ChevronLeft aria-hidden /></Link> : <Button size="icon" disabled aria-label="Trang trước"><ChevronLeft aria-hidden /></Button>}
            {data.page < data.lastPage ? <Link href={pageHref(q, data.page + 1)} scroll={false} aria-label="Trang sau" className={buttonVariants({ size: 'icon' })}><ChevronRight aria-hidden /></Link> : <Button size="icon" disabled aria-label="Trang sau"><ChevronRight aria-hidden /></Button>}
          </div>
        )}
      </footer>
    </section>
  )
}

const tableSkeleton = <section className={`${CARD} grid gap-3 p-5`} aria-busy>{[0, 1, 2, 3, 4].map(i => <Skel key={i} className="h-10" />)}</section>

export function BookingsView() {
  const router = useRouter()
  const sp = useSearchParams()
  const props = useGohostProperties()
  const now = today()
  const list = props.data?.properties ?? []
  // Mặc định: property đã gắn khách sạn Rooty, không có thì property đầu tiên.
  const property = list.find(p => p.id === sp.get('property')) ?? list.find(p => p.hotel) ?? list[0]
  const custom = isISODate(sp.get('in')) && isISODate(sp.get('out'))
  const start = custom ? sp.get('in')! : now
  const end = custom ? sp.get('out')! : addDays(now, 29)
  const days = diffDays(start, end) + 1
  const status = STATUS_OPTIONS.some(s => s.value === sp.get('status')) ? sp.get('status')! : 'all'
  const page = Math.max(1, Number(sp.get('page')) || 1)
  const valid = days >= 1 && days <= 30
  const q: BookingQuery | null = property && valid ? { property: property.id, in: start, out: end, status, page } : null
  const bookings = useAdminBookings(q)

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    router.push(`/admin/bookings?${new URLSearchParams({ property: String(f.get('property')), in: String(f.get('in')), out: String(f.get('out')), status: String(f.get('status')) })}`, { scroll: false })
  }

  let body
  if (props.isPending) body = tableSkeleton
  else if (props.isError || !props.data) body = <LoadFailed onRetry={() => props.refetch()} />
  else if (props.data.error || !props.data.properties) body = <GohostError code={props.data.error ?? 'UPSTREAM'} />
  else if (!property) body = <section className={CARD}><Empty>Key Gohost chưa đọc được property nào.</Empty></section>
  else if (!valid) body = <section className={CARD}><Empty>Khoảng ngày không hợp lệ: Gohost chỉ cho xem tối đa 30 ngày nhận phòng một lần.</Empty></section>
  else if (bookings.isError) body = <LoadFailed onRetry={() => bookings.refetch()} />
  else if (!bookings.data) body = tableSkeleton
  else if (bookings.data.error || !bookings.data.data) body = <GohostError code={bookings.data.error ?? 'UPSTREAM'} />
  else body = <Results q={q!} data={bookings.data.data} fetching={bookings.isPlaceholderData} />

  return (
    <div className="grid max-w-[1200px] grid-cols-1 gap-4">
      {property && (
        <form key={`${property.id}|${start}|${end}|${status}`} onSubmit={submit} className="flex flex-wrap items-end gap-3">
          <div className="grid gap-1.5">
            <label htmlFor="bk-property" className="text-sm font-medium">Property Gohost</label>
            <Select name="property" defaultValue={property.id}>
              <SelectTrigger id="bk-property" className="w-72 max-w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{list.map(p => <SelectItem key={p.id} value={p.id}>{p.hotel ?? p.title} · {p.prefix}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <DateRangeInput id="bk-dates" label="Ngày nhận phòng" from={start} to={end} unit="day" />
          <div className="grid gap-1.5">
            <label htmlFor="bk-status" className="text-sm font-medium">Trạng thái</label>
            <Select name="status" defaultValue={status}>
              <SelectTrigger id="bk-status" className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">Tất cả</SelectItem>{STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button type="submit" variant="default">Xem</Button>
        </form>
      )}
      {body}
    </div>
  )
}

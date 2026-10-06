'use client'
import Link from 'next/link'
import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus, FileSpreadsheet, Globe, UserRound, Briefcase, Building2, ArrowRight, X } from 'lucide-react'
import { repo, type BookingFilter } from '@/lib/repo'
import { useAsync } from '@/store/provider'
import { useAdmin } from '@/components/admin/use-admin'
import { CHANNEL, PAYMENT, STATUS } from '@/lib/labels'
import { fmtDate, fmtDateTime, fmtRange, fmtVND, fmtNumber } from '@/lib/format'
import { downloadCsv } from '@/lib/csv'
import type { BookingStatus, Channel, PaymentStatus } from '@/lib/types'
import { Badge, Button, ButtonLink, Empty, Input, PageTitle, Select, SkeletonList, Table, cn } from '@/components/ui'

const SOURCES: { ch: Channel; label: string; Icon: typeof Globe }[] = [
  { ch: 'website', label: 'Khách đặt Website', Icon: Globe }, { ch: 'offline', label: 'Nhân viên tạo', Icon: UserRound },
  { ch: 'agent', label: 'Đại lý đặt', Icon: Briefcase }, { ch: 'ota', label: 'OTA / Channel Manager', Icon: Building2 },
]

function BookingsList() {
  const a = useAdmin()
  const sp = useSearchParams()
  const router = useRouter()
  const get = (k: string) => sp.get(k) ?? undefined
  const f: BookingFilter = {
    hotelId: a.locked ?? get('hotel') ?? a.hotelId, channel: get('channel') as Channel, status: get('status') as BookingStatus, payment: get('payment') as PaymentStatus,
    from: get('from'), to: get('to'), stayDay: get('stay'), roomTypeId: get('room'), agentId: get('agent'), q: get('q'), page: Number(get('page') ?? 1), pageSize: 25,
  }
  const res = useAsync(() => repo.listBookings(f), [sp.toString(), a.hotelId])
  const counts = useAsync(async () => {
    const r = await Promise.all(SOURCES.map(s => repo.listBookings({ ...f, channel: s.ch, page: 1, pageSize: 1 })))
    return Object.fromEntries(SOURCES.map((s, i) => [s.ch, r[i].total])) as Record<Channel, number>
  }, [sp.toString(), a.hotelId, 'counts'])
  const set = (k: string, v?: string) => {
    const p = new URLSearchParams(sp.toString())
    if (v) p.set(k, v); else p.delete(k)
    if (k !== 'page') p.delete('page')
    router.replace(`/admin/bookings?${p}`, { scroll: false })
  }
  const chips = [['from', 'Từ'], ['to', 'Đến'], ['stay', 'Lưu trú đêm'], ['room', 'Hạng phòng'], ['agent', 'Đại lý']].filter(([k]) => sp.get(k))
  const pages = res.data ? Math.ceil(res.data.total / 25) : 1

  async function exportCsv() {
    const all = await repo.listBookings({ ...f, page: 1, pageSize: 5000 })
    downloadCsv('bookings.csv', [['Mã', 'Khách sạn', 'Phòng', 'Check-in', 'Check-out', 'Khách', 'Nguồn', 'Trạng thái', 'Thanh toán', 'Tổng'],
      ...all.rows.map(b => [b.code, b.hotel.name, b.rt.name, b.checkin_date, b.checkout_date, b.guest.name, b.source_name, STATUS[b.status][0], PAYMENT[b.payment_status][0], b.total])])
  }

  return (
    <>
      <PageTitle title="Bookings" sub="Mọi booking từ mọi nguồn trong một hệ thống">
        <div className="flex gap-2">
          <Button variant="secondary" onClick={exportCsv}><FileSpreadsheet className="size-4" /> Xuất Excel</Button>
          {a.can('bookings', 'full') && <ButtonLink href="/admin/bookings/new"><Plus className="size-4" /> Nhân viên tạo booking</ButtonLink>}
        </div>
      </PageTitle>

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3">
        <div className="flex flex-wrap gap-2">
          {SOURCES.map(({ ch, label, Icon }) => (
            <button key={ch} type="button" onClick={() => set('channel', f.channel === ch ? undefined : ch)} aria-pressed={f.channel === ch}
              className={cn('flex items-center gap-2 rounded-lg border px-3 py-2 text-sm', f.channel === ch ? 'border-primary bg-accent text-primary' : 'border-border')}>
              <Icon className="size-4" />{label}<b>{counts.data ? fmtNumber(counts.data[ch]) : '…'}</b>
            </button>
          ))}
        </div>
        <ArrowRight className="hidden size-5 text-muted-foreground md:block" />
        <span className="rounded-lg bg-brand px-3 py-2 text-sm font-bold text-white">BOOKING SYSTEM</span>
        <span className="hidden text-xs text-muted-foreground md:inline">→ Inventory · Customer · Payment · Reporting</span>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <Input placeholder="Mã, tên, SĐT, email" defaultValue={f.q} onKeyDown={e => e.key === 'Enter' && set('q', (e.target as HTMLInputElement).value || undefined)} className="w-56" aria-label="Tìm booking" />
        {!a.locked && (
          <Select value={f.hotelId} onChange={e => set('hotel', e.target.value)} className="w-48" aria-label="Khách sạn">
            <option value="all">Tất cả KS</option>{a.hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
          </Select>
        )}
        <Select value={f.status ?? ''} onChange={e => set('status', e.target.value || undefined)} className="w-40" aria-label="Trạng thái">
          <option value="">Mọi trạng thái</option>{Object.entries(STATUS).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}
        </Select>
        <Select value={f.payment ?? ''} onChange={e => set('payment', e.target.value || undefined)} className="w-40" aria-label="Thanh toán">
          <option value="">Mọi thanh toán</option>{Object.entries(PAYMENT).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}
        </Select>
        <Input type="date" aria-label="Check-in từ" value={f.from ?? ''} onChange={e => set('from', e.target.value || undefined)} className="w-40" />
        <Input type="date" aria-label="Check-in đến" value={f.to ?? ''} onChange={e => set('to', e.target.value || undefined)} className="w-40" />
        {chips.map(([k, l]) => <Badge key={k} tone="info" className="h-10 px-3">{l}: {k === 'from' || k === 'to' || k === 'stay' ? fmtDate(sp.get(k)!) : sp.get(k)}<button type="button" onClick={() => set(k)} aria-label={`Bỏ lọc ${l}`}><X className="size-3" /></button></Badge>)}
        {sp.toString() && <Button variant="ghost" onClick={() => router.replace('/admin/bookings')}>Xoá lọc</Button>}
      </div>

      {!res.data ? <SkeletonList rows={6} /> : res.data.total === 0 ? <Empty title="Không có booking khớp bộ lọc" /> : (
        <div className={cn(res.loading && 'opacity-60')}>
          <p className="mb-2 text-sm text-muted-foreground">{fmtNumber(res.data.total)} booking · tổng giá trị {fmtVND(res.data.sum)}</p>
          <Table>
            <thead><tr><th>Mã</th><th>Khách</th><th>Khách sạn / phòng</th><th>Ngày</th><th>Nguồn</th><th>Trạng thái</th><th>Thanh toán</th><th className="text-right">Tổng</th><th>Tạo lúc</th></tr></thead>
            <tbody>
              {res.data.rows.map(b => (
                <tr key={b.code} className="cursor-pointer hover:bg-muted" onClick={() => router.push(`/admin/bookings/${b.code}`)}>
                  <td><Link href={`/admin/bookings/${b.code}`} className="font-mono text-primary hover:underline" onClick={e => e.stopPropagation()}>{b.code}</Link></td>
                  <td>{b.guest.name}<div className="text-xs text-muted-foreground">{b.adults} NL{b.children ? ` + ${b.children} TE` : ''}</div></td>
                  <td>{b.hotel.name}<div className="text-xs text-muted-foreground">{b.booking_rooms.length} × {b.rt.name}</div></td>
                  <td className="whitespace-nowrap">{fmtRange(b.checkin_date, b.checkout_date)}</td>
                  <td><Badge tone={CHANNEL[b.channel][1]}>{CHANNEL[b.channel][0]}</Badge><div className="text-xs text-muted-foreground">{b.ota ?? b.agentName ?? ''}</div></td>
                  <td><Badge tone={STATUS[b.status][1]}>{STATUS[b.status][0]}</Badge></td>
                  <td><Badge tone={PAYMENT[b.payment_status][1]}>{PAYMENT[b.payment_status][0]}</Badge></td>
                  <td className="text-right font-medium">{fmtVND(b.total)}</td>
                  <td className="whitespace-nowrap text-xs text-muted-foreground">{fmtDateTime(b.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
          <div className="mt-3 flex items-center justify-end gap-2 text-sm">
            <Button variant="secondary" size="sm" disabled={(f.page ?? 1) <= 1} onClick={() => set('page', String((f.page ?? 1) - 1))}>Trước</Button>
            <span>Trang {f.page} / {pages}</span>
            <Button variant="secondary" size="sm" disabled={(f.page ?? 1) >= pages} onClick={() => set('page', String((f.page ?? 1) + 1))}>Sau</Button>
          </div>
        </div>
      )}
    </>
  )
}

export default function Page() { return <Suspense fallback={<SkeletonList rows={6} />}><BookingsList /></Suspense> }

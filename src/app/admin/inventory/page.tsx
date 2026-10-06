'use client'
import Link from 'next/link'
import { useState } from 'react'
import { ChevronLeft, ChevronRight, RefreshCw, Lock, Unlock } from 'lucide-react'
import { repo } from '@/lib/repo'
import { useAsync } from '@/store/provider'
import { useAdmin } from '@/components/admin/use-admin'
import { addDays, fmtDate, fmtDayMonth, fmtWeekday, nightsBetween, TODAY } from '@/lib/format'
import { stockLevel, type InventoryCell } from '@/lib/inventory'
import type { RoomType } from '@/lib/types'
import { Badge, Button, Card, Field, Input, PageTitle, Select, Skeleton, cn } from '@/components/ui'
import { Dialog, toast } from '@/components/ui/overlay'

const DAYS = 14

export default function InventoryPage() {
  const a = useAdmin()
  const hotelId = a.hotelId === 'all' ? 'H01' : a.hotelId
  const [from, setFrom] = useState('2026-10-14')
  const grid = useAsync(() => repo.inventoryGrid(hotelId, from, DAYS), [hotelId, from])
  const [sel, setSel] = useState<{ rt: RoomType; c: InventoryCell } | null>(null)
  const [bulk, setBulk] = useState({ room: '', from: '2026-10-24', to: '2026-10-26' })
  const canEdit = a.can('inventory', 'full')
  const hotel = a.hotels.find(h => h.id === hotelId) ?? repo.hotelsSync().find(h => h.id === hotelId)

  async function toggle(rtId: string, days: string[], close: boolean) {
    await repo.toggleClosure(rtId, days, close)
    toast(close ? `Đã đóng bán ${days.length} ngày — website & đại lý thấy hết phòng` : `Đã mở bán ${days.length} ngày`)
    setSel(null)
  }

  return (
    <>
      <PageTitle title="Inventory — tồn phòng theo ngày" sub={`${hotel?.name}${a.hotelId === 'all' ? ' (chọn KS ở thanh trên để xem KS khác)' : ''}`}>
        <Badge tone="info" className="h-8 px-3"><RefreshCw className="size-3.5" /> OTA đồng bộ từ Channel Manager (giả lập)</Badge>
      </PageTitle>

      <Card className="mb-4 border-primary/30 bg-mint p-4 text-sm">
        <p className="font-semibold text-brand dark:text-accent">Ví dụ PDF §6 · PITO Hòn Thơm (Hotel A) · Deluxe Ocean View 30 phòng · đêm 20/10</p>
        <p className="mt-1 text-muted">Website 7 · Agent 5 · OTA 8 · Offline 3 → <b className="text-fg">còn 7</b>. Vào Agent Portal đặt thêm 2 phòng → ô 20/10 còn 5, website cũng còn 5. Tồn = tổng − đã bán từ mọi kênh − đóng bán; không có nơi nhập tồn thứ hai.</p>
      </Card>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm" onClick={() => setFrom(addDays(from, -7))} aria-label="Lùi 7 ngày"><ChevronLeft className="size-4" /></Button>
        <Input type="date" value={from} onChange={e => e.target.value && setFrom(e.target.value)} className="h-8 w-40" aria-label="Từ ngày" />
        <Button variant="secondary" size="sm" onClick={() => setFrom(addDays(from, 7))} aria-label="Tiến 7 ngày"><ChevronRight className="size-4" /></Button>
        <Button variant="ghost" size="sm" onClick={() => setFrom(TODAY)}>Hôm nay</Button>
        <div className="ml-auto flex flex-wrap items-center gap-3 text-xs text-muted">
          <span className="flex items-center gap-1"><span className="size-3 rounded bg-ok-bg ring-1 ring-ok/40" />Còn nhiều</span>
          <span className="flex items-center gap-1"><span className="size-3 rounded bg-warn-bg ring-1 ring-warn/40" />Sắp hết</span>
          <span className="flex items-center gap-1"><span className="size-3 rounded bg-danger-bg ring-1 ring-danger/40" />Hết / đóng</span>
          <span>W = Website · A = Agent · O = OTA · Off = Offline</span>
        </div>
      </div>

      {!grid.data ? <Skeleton className="h-96" /> : (
        <div className={cn('overflow-x-auto rounded-xl border border-border bg-surface', grid.loading && 'opacity-60')}>
          <table className="w-full min-w-[1100px] border-collapse text-xs">
            <thead>
              <tr className="bg-surface-2">
                <th className="sticky left-0 z-10 bg-surface-2 p-2 text-left font-semibold">Hạng phòng</th>
                {grid.data.dates.map(d => <th key={d} className={cn('p-2 font-semibold', d === '2026-10-20' && 'bg-mint')}>{fmtWeekday(d)}<br />{fmtDayMonth(d)}</th>)}
              </tr>
            </thead>
            <tbody>
              {grid.data.rows.map(({ rt, cells }) => (
                <tr key={rt.room_type_id} className="border-t border-border">
                  <th className="sticky left-0 z-10 bg-surface p-2 text-left align-top font-medium">{rt.name}<div className="font-normal text-muted">Tổng {rt.quantity}</div></th>
                  {cells.map(c => {
                    const lvl = c.closed ? 'out' : stockLevel(c.left, c.total)
                    return (
                      <td key={c.day} className="p-1">
                        <button type="button" onClick={() => setSel({ rt, c })} aria-label={`${rt.name} ${fmtDate(c.day)}: còn ${c.left}`}
                          className={cn('w-full rounded-md p-1.5 text-left ring-1 hover:ring-2', lvl === 'out' ? 'bg-danger-bg ring-danger/30' : lvl === 'low' ? 'bg-warn-bg ring-warn/30' : 'bg-ok-bg ring-ok/30')}>
                          <span className="flex items-center justify-between text-sm font-bold">{c.closed ? <Lock className="size-3.5" /> : c.left}<span className="text-[10px] font-normal text-muted">/{c.total}</span></span>
                          <span className="block leading-tight text-muted">W{c.website} A{c.agent}</span>
                          <span className="block leading-tight text-muted">O{c.ota} Off{c.offline}</span>
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {canEdit && grid.data && (
        <Card className="mt-4 flex flex-wrap items-end gap-3 p-4">
          <p className="w-full text-sm font-semibold">Đóng / mở bán theo khoảng ngày</p>
          <Field label="Hạng phòng"><Select value={bulk.room || grid.data.rows[0].rt.room_type_id} onChange={e => setBulk({ ...bulk, room: e.target.value })}>{grid.data.rows.map(r => <option key={r.rt.room_type_id} value={r.rt.room_type_id}>{r.rt.name}</option>)}</Select></Field>
          <Field label="Từ"><Input type="date" value={bulk.from} onChange={e => setBulk({ ...bulk, from: e.target.value })} /></Field>
          <Field label="Đến"><Input type="date" value={bulk.to} min={bulk.from} onChange={e => setBulk({ ...bulk, to: e.target.value })} /></Field>
          <Button variant="danger" onClick={() => toggle(bulk.room || grid.data!.rows[0].rt.room_type_id, nightsBetween(bulk.from, addDays(bulk.to, 1)), true)}><Lock className="size-4" /> Đóng bán</Button>
          <Button variant="secondary" onClick={() => toggle(bulk.room || grid.data!.rows[0].rt.room_type_id, nightsBetween(bulk.from, addDays(bulk.to, 1)), false)}><Unlock className="size-4" /> Mở bán</Button>
        </Card>
      )}

      <Dialog open={!!sel} onClose={() => setSel(null)} title={sel ? `${sel.rt.name} · ${fmtDate(sel.c.day)}` : ''}>
        {sel && (
          <div className="space-y-3 text-sm">
            <dl className="grid grid-cols-2 gap-2 font-mono">
              {[['Tổng', sel.c.total], ['Website đã bán', sel.c.website], ['Agent đã bán', sel.c.agent], ['OTA đã bán', sel.c.ota], ['Offline', sel.c.offline]].map(([k, v]) => <div key={k} className="contents"><dt>{k}:</dt><dd className="text-right">{v}</dd></div>)}
              <div className="col-span-2 border-t border-dashed border-border" />
              <dt className="font-bold">Còn lại:</dt><dd className="text-right font-bold">{sel.c.closed ? 'Đóng bán' : sel.c.left}</dd>
            </dl>
            <Link href={`/admin/bookings?${new URLSearchParams({ hotel: hotelId, stay: sel.c.day, room: sel.rt.room_type_id })}`} className="block text-primary hover:underline">Xem booking lưu trú đêm này →</Link>
            {canEdit ? (
              <Button variant={sel.c.closed ? 'secondary' : 'danger'} onClick={() => toggle(sel.rt.room_type_id, [sel.c.day], !sel.c.closed)} className="w-full">
                {sel.c.closed ? <><Unlock className="size-4" /> Mở bán ngày này</> : <><Lock className="size-4" /> Đóng bán ngày này</>}
              </Button>
            ) : <p className="text-xs text-muted">Vai trò hiện tại chỉ xem.</p>}
          </div>
        )}
      </Dialog>
    </>
  )
}

'use client'
import { useState } from 'react'
import { ChevronLeft, ChevronRight, Info } from 'lucide-react'
import { repo } from '@/lib/repo'
import { useAsync } from '@/store/provider'
import { useAdmin } from '@/components/admin/use-admin'
import { addDays, fmtDayMonth, fmtWeekday, isWeekendNight } from '@/lib/format'
import { Button, Card, Field, Input, PageTitle, Select, Skeleton, cn } from '@/components/ui'
import { toast } from '@/components/ui/overlay'

const WD = [['1', 'T2'], ['2', 'T3'], ['3', 'T4'], ['4', 'T5'], ['5', 'T6'], ['6', 'T7'], ['0', 'CN']]

export default function RatesPage() {
  const a = useAdmin()
  const hotelId = a.hotelId === 'all' ? 'H01' : a.hotelId
  const [from, setFrom] = useState('2026-10-12')
  const grid = useAsync(() => repo.rateGrid(hotelId, from, 14), [hotelId, from])
  const [plans, setPlans] = useState<string[]>([])
  const [form, setForm] = useState({ from: '2026-12-20', to: '2027-01-02', mode: 'pct' as 'pct' | 'set', value: '15', weekdays: [] as string[] })
  const canEdit = a.can('rates', 'full')

  async function apply() {
    const ids = plans.length ? plans : grid.data?.rows.map(r => r.plan.rate_plan_id) ?? []
    const n = await repo.bulkUpdateRates({ planIds: ids, from: form.from, to: form.to, mode: form.mode, value: Number(form.value), weekdays: form.weekdays.map(Number) })
    toast(`Đã cập nhật ${n} ô giá (giả lập) — website & tìm kiếm dùng giá mới ngay`)
  }

  return (
    <>
      <PageTitle title="Rates — lịch giá" sub={`${a.hotels.find(h => h.id === hotelId)?.name ?? ''} · ngày × hạng phòng × gói giá`} />
      <Card className="mb-4 flex gap-2 p-3 text-sm text-muted"><Info className="size-4 shrink-0 text-info" />Ngoài đời: giá phòng chỉnh trong Gohost (API chỉ đọc). Màn này để lãnh đạo hình dung; sửa ở đây chỉ đổi dữ liệu demo.</Card>
      <div className="mb-3 flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={() => setFrom(addDays(from, -7))} aria-label="Lùi 7 ngày"><ChevronLeft className="size-4" /></Button>
        <Input type="date" value={from} onChange={e => e.target.value && setFrom(e.target.value)} className="h-8 w-40" aria-label="Từ ngày" />
        <Button variant="secondary" size="sm" onClick={() => setFrom(addDays(from, 7))} aria-label="Tiến 7 ngày"><ChevronRight className="size-4" /></Button>
        <span className="text-xs text-muted">Đơn vị: nghìn đồng / đêm · ô viền xanh = đã chỉnh</span>
      </div>
      {!grid.data ? <Skeleton className="h-96" /> : (
        <div className={cn('overflow-x-auto rounded-xl border border-border bg-surface', grid.loading && 'opacity-60')}>
          <table className="w-full min-w-[1000px] text-xs">
            <thead><tr className="bg-surface-2">
              <th className="sticky left-0 bg-surface-2 p-2 text-left">{canEdit && <span className="sr-only">Chọn</span>}Hạng phòng · gói</th>
              {grid.data.dates.map(d => <th key={d} className={cn('p-2', isWeekendNight(d) && 'text-warn')}>{fmtWeekday(d)}<br />{fmtDayMonth(d)}</th>)}
            </tr></thead>
            <tbody>
              {grid.data.rows.map(r => (
                <tr key={r.plan.rate_plan_id} className="border-t border-border">
                  <th className="sticky left-0 bg-surface p-2 text-left font-medium">
                    <label className="flex items-start gap-2">
                      {canEdit && <input type="checkbox" className="mt-0.5 accent-[var(--primary)]" checked={plans.includes(r.plan.rate_plan_id)} onChange={() => setPlans(p => p.includes(r.plan.rate_plan_id) ? p.filter(x => x !== r.plan.rate_plan_id) : [...p, r.plan.rate_plan_id])} />}
                      <span>{r.rt.name}<span className="block font-normal text-muted">{r.plan.has_breakfast ? 'Ăn sáng · Huỷ miễn phí' : 'Room Only'}</span></span>
                    </label>
                  </th>
                  {r.cells.map(c => <td key={c.day} className={cn('p-2 text-right tabular-nums', c.edited && 'rounded bg-mint font-semibold ring-1 ring-primary')}>{(c.price / 1000).toLocaleString('vi-VN')}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {canEdit && (
        <Card className="mt-4 p-4">
          <p className="mb-3 text-sm font-semibold">Sửa giá hàng loạt <span className="font-normal text-muted">({plans.length ? `${plans.length} gói đã chọn` : 'tất cả gói của KS'})</span></p>
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Từ ngày"><Input type="date" value={form.from} onChange={e => setForm({ ...form, from: e.target.value })} /></Field>
            <Field label="Đến ngày"><Input type="date" value={form.to} min={form.from} onChange={e => setForm({ ...form, to: e.target.value })} /></Field>
            <Field label="Cách sửa"><Select value={form.mode} onChange={e => setForm({ ...form, mode: e.target.value as 'pct' | 'set' })}><option value="pct">Tăng/giảm %</option><option value="set">Đặt giá cố định (đ)</option></Select></Field>
            <Field label={form.mode === 'pct' ? 'Giá trị (%)' : 'Giá (đ)'}><Input type="number" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} className="w-32" /></Field>
            <fieldset className="flex gap-1"><legend className="mb-1 text-sm font-medium">Thứ áp dụng</legend>
              {WD.map(([v, l]) => <button key={v} type="button" aria-pressed={form.weekdays.includes(v)} onClick={() => setForm({ ...form, weekdays: form.weekdays.includes(v) ? form.weekdays.filter(x => x !== v) : [...form.weekdays, v] })} className={cn('h-10 rounded-md border px-2 text-xs', form.weekdays.includes(v) ? 'border-primary bg-mint text-primary' : 'border-border')}>{l}</button>)}
            </fieldset>
            <Button onClick={apply}>Áp dụng</Button>
          </div>
        </Card>
      )}
    </>
  )
}

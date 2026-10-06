'use client'
import { useState } from 'react'
import { CalendarRange } from 'lucide-react'
import { monthRange, fmtMonth } from '@/lib/format'
import { useAdmin } from './use-admin'

const MONTHS = ['2026-07', '2026-08', '2026-09', '2026-10', '2026-11', '2026-12']

export function PeriodPicker() {
  const { period, setPeriod } = useAdmin()
  const [custom, setCustom] = useState(false)
  const computed = MONTHS.find(m => { const r = monthRange(m); return r.from === period.from && r.to === period.to }) ?? (period.from === '2026-07-01' && period.to === '2026-12-31' ? 'h2' : 'custom')
  const preset = custom ? 'custom' : computed
  return (
    <div className="flex flex-wrap items-center gap-1">
      <CalendarRange className="size-4 text-muted-foreground" aria-hidden />
      <label className="sr-only" htmlFor="period">Khoảng thời gian</label>
      <select id="period" value={preset} onChange={e => {
        const v = e.target.value
        setCustom(v === 'custom')
        if (v === 'h2') setPeriod({ from: '2026-07-01', to: '2026-12-31' })
        else if (v !== 'custom') setPeriod(monthRange(v))
      }} className="h-9 rounded-lg border border-border bg-card px-2 text-sm">
        {MONTHS.map(m => <option key={m} value={m}>Tháng {fmtMonth(m)}</option>)}
        <option value="h2">6 tháng cuối 2026</option>
        <option value="custom">Tuỳ chọn…</option>
      </select>
      {preset === 'custom' && (
        <>
          <input type="date" aria-label="Từ ngày" value={period.from} onChange={e => e.target.value && setPeriod({ ...period, from: e.target.value })} className="h-9 rounded-lg border border-border bg-card px-2 text-sm" />
          <input type="date" aria-label="Đến ngày" value={period.to} min={period.from} onChange={e => e.target.value && setPeriod({ ...period, to: e.target.value })} className="h-9 rounded-lg border border-border bg-card px-2 text-sm" />
        </>
      )}
    </div>
  )
}

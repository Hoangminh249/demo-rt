'use client'
// Ô chọn khoảng ngày cho form GET của admin: lịch nổi (Popover + Calendar của dự án), ghi vào hai input ẩn `in`, `out`.
// unit 'night': ngày trả > ngày nhận (ở 1–30 đêm). unit 'day': khoảng ngày nhận phòng, tính cả hai đầu (1–30 ngày, theo Gohost).
import { useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { vi } from 'react-day-picker/locale'
import type { DateRange } from 'react-day-picker'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { addDays, diffDays, fmtDate, fmtRange } from '@/lib/format'

const toDate = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d) }
const toISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export function DateRangeInput({ id, label, from, to, min, unit = 'night' }: { id: string; label: string; from: string; to: string; min?: string; unit?: 'night' | 'day' }) {
  const [value, setValue] = useState({ from, to })
  const [draft, setDraft] = useState<Date>()
  const [open, setOpen] = useState(false)
  const span = unit === 'night' ? diffDays(value.from, value.to) : diffDays(value.from, value.to) + 1
  const limit = draft ? addDays(toISO(draft), unit === 'night' ? 30 : 29) : undefined
  const selected: DateRange = draft ? { from: draft, to: undefined } : { from: toDate(value.from), to: toDate(value.to) }

  // Bấm lần 1 = đầu khoảng, lần 2 = cuối khoảng; đủ hai đầu thì lưu và đóng.
  function pick(day: Date) {
    const lowerOk = unit === 'night' ? draft && day > draft : draft && day >= draft
    if (!draft || !lowerOk) { setDraft(day); return }
    setValue({ from: toISO(draft), to: toISO(day) })
    setDraft(undefined)
    setOpen(false)
  }

  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      <input type="hidden" name="in" value={value.from} />
      <input type="hidden" name="out" value={value.to} />
      <Popover open={open} onOpenChange={o => { setOpen(o); if (!o) setDraft(undefined) }}>
        <PopoverTrigger id={id} className="flex h-10 min-w-[220px] cursor-pointer items-center gap-2 rounded-xl border border-border-strong bg-card px-3 text-left text-sm outline-none focus-visible:border-focus data-[state=open]:border-focus data-[state=open]:ring-2 data-[state=open]:ring-focus">
          <CalendarDays className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="tabular-nums">{value.from === value.to ? fmtDate(value.from) : fmtRange(value.from, value.to)}</span>
          <span className="ml-auto pl-2 text-xs whitespace-nowrap text-muted-foreground">{span} {unit === 'night' ? 'đêm' : 'ngày'}</span>
        </PopoverTrigger>
        <PopoverContent align="start" collisionPadding={16} className="w-auto max-w-[calc(100vw-2rem)] p-3">
          <Calendar
            mode="range"
            locale={vi}
            weekStartsOn={1}
            numberOfMonths={typeof window !== 'undefined' && window.innerWidth >= 768 ? 2 : 1}
            showOutsideDays={false}
            defaultMonth={selected.from}
            selected={selected}
            onSelect={(_, day) => pick(day)}
            disabled={[...(min ? [{ before: toDate(min) }] : []), ...(limit ? [{ after: toDate(limit) }] : [])]}
          />
          <p className="border-t border-border px-1 pt-3 text-sm text-muted-foreground" aria-live="polite">
            {draft ? (unit === 'night' ? 'Chọn ngày trả phòng' : 'Chọn ngày cuối') : (unit === 'night' ? 'Chọn ngày nhận phòng' : 'Chọn ngày đầu')}
          </p>
        </PopoverContent>
      </Popover>
    </div>
  )
}

'use client'
// Ô chọn ngày (khoảng), ô khách & phòng, ô điểm đến — dùng chung cho trang chủ, tìm kiếm, trang KS, đặt phòng.
// Dáng theo skill evon (choice-controls.md): nút mở trông như ô nhập, lịch hai tháng từ md, tuần bắt đầu T2.
import { useState } from 'react'
import { CalendarDays, ChevronDown, Minus, Plus, Users, MapPin } from 'lucide-react'
import { vi } from 'react-day-picker/locale'
import type { DateRange } from 'react-day-picker'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select'
import { repo } from '@/lib/repo'
import { AREA_LABEL } from '@/lib/labels'
import { TODAY, diffDays, fmtDate, fmtDayMonth, fmtRange, guestsLabel } from '@/lib/format'

const toDate = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d) }
const toISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** Nút mở trông như ô nhập; đang mở thì viền + ring như ô focus. */
export const TRIGGER = 'group flex h-11 w-full cursor-pointer items-center gap-2.5 rounded-xl border border-border-strong bg-card px-4 text-left text-base text-foreground outline-none transition-colors md:h-10 md:text-sm data-[state=open]:border-focus data-[state=open]:ring-2 data-[state=open]:ring-focus'

export function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-foreground">{children}</label>
}

export function DateRangeField({ checkin, checkout, onChange, id, label = 'Nhận phòng – Trả phòng', compact }: {
  checkin: string; checkout: string; onChange: (r: { checkin: string; checkout: string }) => void; id?: string; label?: string; compact?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<DateRange | undefined>()
  const nights = diffDays(checkin, checkout)
  const range = draft ?? { from: toDate(checkin), to: toDate(checkout) }
  const step = !draft ? 'Chọn ngày nhận phòng' : !draft.to ? 'Chọn ngày trả phòng' : `${diffDays(toISO(draft.from!), toISO(draft.to))} đêm · ${fmtRange(toISO(draft.from!), toISO(draft.to))}`

  // Bấm lần 1 = ngày nhận (luôn bắt đầu khoảng mới), lần 2 = ngày trả; đủ hai đầu thì lưu và đóng.
  function pick(day: Date) {
    if (!draft?.from || day <= draft.from) { setDraft({ from: day, to: undefined }); return }
    onChange({ checkin: toISO(draft.from), checkout: toISO(day) })
    setDraft(undefined)
    setOpen(false)
  }

  return (
    <div>
      {!compact && <FieldLabel htmlFor={id}>{label}</FieldLabel>}
      <Popover open={open} onOpenChange={o => { setOpen(o); if (!o) setDraft(undefined) }}>
        <PopoverTrigger id={id} className={TRIGGER} aria-label={compact ? label : undefined}>
          <CalendarDays className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="min-w-0 flex-1 truncate tabular-nums">{fmtDayMonth(checkin)} – {fmtDate(checkout)}</span>
          <span className="shrink-0 text-xs text-muted-foreground">{nights} đêm</span>
        </PopoverTrigger>
        <PopoverContent align="start" collisionPadding={16} className="w-auto max-w-[calc(100vw-2rem)] p-3">
          <Calendar
            mode="range"
            locale={vi}
            weekStartsOn={1}
            numberOfMonths={typeof window !== 'undefined' && window.innerWidth >= 768 ? 2 : 1}
            showOutsideDays={false}
            defaultMonth={range.from}
            selected={range}
            onSelect={(_, day) => pick(day)}
            disabled={{ before: toDate(TODAY) }}
            startMonth={toDate(TODAY)}
          />
          <p className="border-t border-border px-1 pt-3 text-sm text-muted-foreground" aria-live="polite">{step}</p>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export interface Party { adults: number; children: number; ages: number[]; rooms: number }

function Counter({ label, sub, value, min, max, onChange }: { label: string; sub?: string; value: number; min: number; max: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div><p className="text-sm font-medium">{label}</p>{sub && <p className="text-xs text-muted-foreground">{sub}</p>}</div>
      {/* Ô số lượng: nút − + thụt trong khung (quantity-input.md) */}
      <div className="flex h-10 items-center rounded-xl border border-border-strong bg-card">
        <button type="button" aria-label={`Bớt ${label.toLowerCase()}`} disabled={value <= min} onClick={() => onChange(value - 1)}
          className="m-1 grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-foreground/5 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"><Minus className="size-4" /></button>
        <span className="w-6 text-center text-sm font-semibold tabular-nums" aria-live="polite">{value}</span>
        <button type="button" aria-label={`Thêm ${label.toLowerCase()}`} disabled={value >= max} onClick={() => onChange(value + 1)}
          className="m-1 grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-foreground/5 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"><Plus className="size-4" /></button>
      </div>
    </div>
  )
}

export function PartyEditor({ party, onChange }: { party: Party; onChange: (p: Party) => void }) {
  const set = (p: Partial<Party>) => onChange({ ...party, ...p })
  return (
    <div className="divide-y divide-border">
      <Counter label="Người lớn" value={party.adults} min={1} max={12} onChange={adults => set({ adults })} />
      <Counter label="Trẻ em" sub="0–17 tuổi" value={party.children} min={0} max={6} onChange={children => set({ children, ages: Array.from({ length: children }, (_, i) => party.ages[i] ?? 6) })} />
      {party.children > 0 && (
        <div className="grid grid-cols-2 gap-2 py-2.5 sm:grid-cols-3">
          {party.ages.map((age, i) => (
            <div key={i}>
              <p className="mb-1 text-xs text-muted-foreground">Tuổi bé {i + 1}</p>
              <Select value={String(age)} onValueChange={v => set({ ages: party.ages.map((a, k) => (k === i ? Number(v) : a)) })}>
                <SelectTrigger aria-label={`Tuổi bé ${i + 1}`} className="h-10 px-3 md:h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{Array.from({ length: 18 }, (_, n) => <SelectItem key={n} value={String(n)}>{n} tuổi</SelectItem>)}</SelectContent>
              </Select>
            </div>
          ))}
        </div>
      )}
      <Counter label="Số phòng" value={party.rooms} min={1} max={6} onChange={rooms => set({ rooms })} />
    </div>
  )
}

export function GuestsField({ party, onChange, id, compact }: { party: Party; onChange: (p: Party) => void; id?: string; compact?: boolean }) {
  return (
    <div>
      {!compact && <FieldLabel htmlFor={id}>Khách & phòng</FieldLabel>}
      <Popover>
        <PopoverTrigger id={id} className={TRIGGER} aria-label={compact ? 'Khách và phòng' : undefined}>
          <Users className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="min-w-0 flex-1 truncate">{guestsLabel(party.adults, party.children)} · {party.rooms} phòng</span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" aria-hidden />
        </PopoverTrigger>
        <PopoverContent align="start" collisionPadding={16} className="w-80 max-w-[calc(100vw-2rem)] px-4 py-2">
          <PartyEditor party={party} onChange={onChange} />
        </PopoverContent>
      </Popover>
    </div>
  )
}

export function DestinationField({ value, onChange, id, compact }: { value: string; onChange: (v: string) => void; id?: string; compact?: boolean }) {
  const hotels = repo.hotelsSync()
  return (
    <div>
      {!compact && <FieldLabel htmlFor={id}>Điểm đến / khách sạn</FieldLabel>}
      <Select value={value || 'phu-quoc'} onValueChange={v => onChange(v === 'phu-quoc' ? '' : v)}>
        <SelectTrigger id={id} aria-label={compact ? 'Điểm đến hoặc khách sạn' : undefined} className="justify-start">
          <MapPin className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="min-w-0 flex-1 truncate text-left"><SelectValue /></span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="phu-quoc">Phú Quốc – tất cả khách sạn</SelectItem>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel className="px-3 pt-1 text-xs text-muted-foreground">Khu vực</SelectLabel>
            {(['bac-dao', 'trung-tam', 'nam-dao'] as const).map(a => <SelectItem key={a} value={a}>{AREA_LABEL[a]}</SelectItem>)}
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel className="px-3 pt-1 text-xs text-muted-foreground">Khách sạn</SelectLabel>
            {hotels.map(h => <SelectItem key={h.slug} value={h.slug}>{h.name}</SelectItem>)}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}


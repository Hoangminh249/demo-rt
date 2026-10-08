'use client'
// Ô chọn khách sạn, khoảng ngày, số khách — dáng ô nhập của wireframe (cao 48px, viền, icon xanh, nhãn cam in hoa).
import { useState, type ReactNode } from 'react'
import { CalendarDays, ChevronDown, Hotel as HotelIcon, Minus, Plus, Users } from 'lucide-react'
import { enUS, vi } from 'react-day-picker/locale'
import { useLocale, useTranslations } from 'next-intl'
import type { DateRange } from 'react-day-picker'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { addDays, diffDays, fmtDayMonth, fmtRange, fmtWeekday, today } from '@/lib/format'
import { MAX_NIGHTS } from '@/lib/stay'
import type { Stay } from '@/types/hotel'
import { EYEBROW } from './kit'

const toDate = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d) }
const toISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const FIELD = 'group flex h-12 w-full min-w-0 cursor-pointer items-center gap-3 rounded-lg border border-border-strong bg-white px-3.5 text-left text-[15px] text-foreground outline-none transition-colors hover:bg-item-hover focus-visible:border-focus focus-visible:ring-4 focus-visible:ring-focus data-[state=open]:border-focus data-[state=open]:ring-4 data-[state=open]:ring-focus'

// Ô nằm trong một khung chung (thẻ đặt phòng trang phòng): không viền riêng, nhãn nhỏ nằm trong ô.
const BOXED = 'block w-full cursor-pointer bg-white text-left text-foreground outline-none transition-colors hover:bg-item-hover focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus data-[state=open]:bg-item-hover'
const BOXED_LABEL = 'text-[12px] font-semibold tracking-[0.12em] text-muted-foreground uppercase'

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="grid min-w-0 gap-1.5">
      <label htmlFor={id} className={EYEBROW}>{label}</label>
      {children}
    </div>
  )
}

export function HotelField({ id, value, hotels, onChange }: { id: string; value: string; hotels: { slug: string; name: string }[]; onChange: (slug: string) => void }) {
  const t = useTranslations('Fields')
  return (
    <Field id={id} label={t('hotel')}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className={`${FIELD} !h-12 justify-start`}>
          <HotelIcon className="size-5 shrink-0 text-brand" aria-hidden />
          <span className="min-w-0 flex-1 truncate text-left"><SelectValue /></span>
        </SelectTrigger>
        <SelectContent>{hotels.map(h => <SelectItem key={h.slug} value={h.slug}>{h.name}</SelectItem>)}</SelectContent>
      </Select>
    </Field>
  )
}

/** `min`: ngày nhận sớm nhất (mặc định hôm nay; khách sạn chưa khai trương thì là ngày khai trương). */
/** `boxed`: không nhãn ngoài, ô chia đôi Nhận phòng | Trả phòng — ghép trong khung của thẻ đặt phòng (trang phòng). */
export function DateRangeField({ id, label, stay, min, onChange, boxed }: { id: string; label?: string; stay: Stay; min?: string; onChange: (s: Stay) => void; boxed?: boolean }) {
  const t = useTranslations()
  const locale = useLocale()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<DateRange | undefined>()
  const range = draft ?? { from: toDate(stay.checkin), to: toDate(stay.checkout) }
  const step = !draft ? t('Fields.pickCheckin') : t('Fields.pickCheckout')
  const first = min ?? today()
  const last = addDays(today(), 365)
  // Đã chọn ngày nhận thì chỉ cho ngày trả trong 30 đêm (giới hạn của Gohost).
  const until = draft?.from ? [addDays(toISO(draft.from), MAX_NIGHTS), last].sort()[0] : last

  // Bấm lần 1 = ngày nhận (luôn bắt đầu khoảng mới), lần 2 = ngày trả; đủ hai đầu thì lưu và đóng.
  function pick(day: Date) {
    if (!draft?.from || day <= draft.from) { setDraft({ from: day, to: undefined }); return }
    onChange({ ...stay, checkin: toISO(draft.from), checkout: toISO(day) })
    setDraft(undefined)
    setOpen(false)
  }

  const day = (iso: string) => `${fmtWeekday(iso, locale)}, ${fmtDayMonth(iso, locale)}`
  const field = (
      <Popover open={open} onOpenChange={o => { setOpen(o); if (!o) setDraft(undefined) }}>
        {boxed ? (
          <PopoverTrigger id={id} aria-label={label ?? t('Fields.dates')} className={BOXED}>
            <span className="grid grid-cols-2">
              <span className="flex min-w-0 flex-col gap-0.5 border-r border-border-strong px-3.5 py-3"><span className={BOXED_LABEL}>{t('Booking.checkin')}</span><span className="truncate text-[16px] font-semibold tabular-nums">{day(stay.checkin)}</span></span>
              <span className="flex min-w-0 flex-col gap-0.5 px-3.5 py-3"><span className={BOXED_LABEL}>{t('Booking.checkout')}</span><span className="truncate text-[16px] font-semibold tabular-nums">{day(stay.checkout)}</span></span>
            </span>
          </PopoverTrigger>
        ) : (
          <PopoverTrigger id={id} className={FIELD}>
            <CalendarDays className="size-5 shrink-0 text-brand" aria-hidden />
            <span className="min-w-0 flex-1 truncate tabular-nums">{fmtRange(stay.checkin, stay.checkout, locale)}</span>
            <span className="shrink-0 text-[13px] text-muted-foreground">{t('Common.nights', { n: diffDays(stay.checkin, stay.checkout) })}</span>
          </PopoverTrigger>
        )}
        <PopoverContent align="start" collisionPadding={16} className="w-auto max-w-[calc(100vw-2rem)] p-3">
          <Calendar
            mode="range"
            locale={locale === 'en' ? enUS : vi}
            weekStartsOn={1}
            numberOfMonths={typeof window !== 'undefined' && window.innerWidth >= 768 ? 2 : 1}
            showOutsideDays={false}
            defaultMonth={range.from}
            selected={range}
            onSelect={(_, day) => pick(day)}
            disabled={[{ before: toDate(first) }, { after: toDate(until) }]}
            startMonth={toDate(first)}
            endMonth={toDate(last)}
          />
          <p className="border-t border-border px-1 pt-3 text-sm text-muted-foreground" aria-live="polite">{step}</p>
        </PopoverContent>
      </Popover>
  )
  return boxed ? field : <Field id={id} label={label ?? t('Fields.dates')}>{field}</Field>
}

function Counter({ label, sub, value, min, max, onChange }: { label: string; sub?: string; value: number; min: number; max: number; onChange: (n: number) => void }) {
  const t = useTranslations('Fields')
  const btn = 'm-1 grid size-8 place-items-center rounded-md text-brand hover:bg-mint disabled:cursor-not-allowed disabled:text-muted-foreground disabled:opacity-40'
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div><p className="text-[15px] font-medium">{label}</p>{sub && <p className="text-[13px] text-muted-foreground">{sub}</p>}</div>
      <div className="flex h-10 items-center rounded-lg border border-border-strong bg-white">
        <button type="button" aria-label={t('less', { label: label.toLowerCase() })} disabled={value <= min} onClick={() => onChange(value - 1)} className={btn}><Minus className="size-4" /></button>
        <span className="w-6 text-center text-[15px] font-semibold tabular-nums" aria-live="polite">{value}</span>
        <button type="button" aria-label={t('more', { label: label.toLowerCase() })} disabled={value >= max} onClick={() => onChange(value + 1)} className={btn}><Plus className="size-4" /></button>
      </div>
    </div>
  )
}

export function GuestsField({ id, stay, onChange, boxed }: { id: string; stay: Stay; onChange: (s: Stay) => void; boxed?: boolean }) {
  const t = useTranslations()
  const party = t('Common.guests', { adults: stay.adults, children: stay.children })
  const field = (
      <Popover>
        {boxed ? (
          <PopoverTrigger id={id} aria-label={t('Fields.guests')} className={`${BOXED} group flex items-center justify-between gap-3 px-3.5 py-3`}>
            <span className="flex min-w-0 flex-col gap-0.5"><span className={BOXED_LABEL}>{t('Fields.guests')}</span><span className="truncate text-[16px] font-semibold">{party}</span></span>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" aria-hidden />
          </PopoverTrigger>
        ) : (
          <PopoverTrigger id={id} className={FIELD}>
            <Users className="size-5 shrink-0 text-brand" aria-hidden />
            <span className="min-w-0 flex-1 truncate">{party}</span>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" aria-hidden />
          </PopoverTrigger>
        )}
        <PopoverContent align="start" collisionPadding={16} className="w-72 max-w-[calc(100vw-2rem)] divide-y divide-border px-4 py-1">
          <Counter label={t('Fields.adults')} value={stay.adults} min={1} max={6} onChange={adults => onChange({ ...stay, adults })} />
          <Counter label={t('Fields.children')} sub={t('Fields.under12')} value={stay.children} min={0} max={4} onChange={children => onChange({ ...stay, children })} />
        </PopoverContent>
      </Popover>
  )
  return boxed ? field : <Field id={id} label={t('Fields.guests')}>{field}</Field>
}

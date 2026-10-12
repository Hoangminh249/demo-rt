'use client'
// Ô chọn khách sạn, khoảng ngày, số khách — dáng ô nhập của wireframe (cao 48px, viền, icon xanh, nhãn cam in hoa).
import { useMemo, useState, type ComponentProps, type ReactNode } from 'react'
import { cn } from 'cn'
import { CalendarDays, ChevronDown, Hotel as HotelIcon, Minus, Plus, Users } from 'lucide-react'
import { enUS, vi } from 'react-day-picker/locale'
import { useLocale, useTranslations } from 'next-intl'
import type { DateRange } from 'react-day-picker'
import { Calendar, CalendarDayButton } from '@/components/ui/calendar'
import { useHotelCalendar } from '@/hooks/use-rooms'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { addDays, diffDays, fmtDayMonth, fmtPrice, fmtRange, fmtWeekday, today } from '@/lib/format'
import { fitAges, MAX_NIGHTS } from '@/lib/stay'
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

export function HotelField({ id, value, hotels, onChange, boxed }: { id: string; value: string; hotels: { slug: string; name: string }[]; onChange: (slug: string) => void; boxed?: boolean }) {
  const t = useTranslations('Fields')
  if (boxed) return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} aria-label={t('hotel')} className={`${BOXED} flex h-auto items-center gap-3 rounded-none border-0 px-3.5 py-3 text-[16px] md:h-auto md:text-[16px] data-[state=open]:ring-0`}>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5"><span className={BOXED_LABEL}>{t('hotel')}</span><span className="truncate font-semibold"><SelectValue /></span></span>
      </SelectTrigger>
      <SelectContent>{hotels.map(h => <SelectItem key={h.slug} value={h.slug}>{h.name}</SelectItem>)}</SelectContent>
    </Select>
  )
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
/** `prices`: slug khách sạn → hiện giá thấp nhất từng đêm dưới mỗi ngày (lịch giá 90 ngày, chỉ khi KS có `calendar`). */
export function DateRangeField({ id, label, stay, min, onChange, boxed, prices }: { id: string; label?: string; stay: Stay; min?: string; onChange: (s: Stay) => void; boxed?: boolean; prices?: string }) {
  const t = useTranslations()
  const locale = useLocale()
  const [open, setOpen] = useState(false)
  const cal = useHotelCalendar(prices ?? '', !!prices && open)
  const DayButton = useMemo(() => {
    const data = cal.data
    if (!data) return undefined
    const short = new Intl.NumberFormat(locale === 'en' ? 'en' : 'vi', { notation: 'compact', maximumFractionDigits: 2 })
    return function PricedDay(props: ComponentProps<typeof CalendarDayButton>) {
      const price = data.get(toISO(props.day.date))
      return (
        <CalendarDayButton {...props}>
          {props.children}
          {price != null && !props.modifiers.disabled && <span className="!text-[10px] tabular-nums" title={fmtPrice(price)}>{short.format(price)}</span>}
        </CalendarDayButton>
      )
    }
  }, [cal.data, locale])
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
            components={DayButton && { DayButton }}
          />
          <p className="border-t border-border px-1 pt-3 text-sm text-muted-foreground" aria-live="polite">{step}</p>
        </PopoverContent>
      </Popover>
  )
  return boxed ? field : <Field id={id} label={label ?? t('Fields.dates')}>{field}</Field>
}

/** Tuổi từng trẻ lúc nhận phòng (1 = "≤ 1 tuổi" … 11). Chưa chọn thì ô viền nét đứt, ghi "Chọn tuổi". */
function ChildAges({ stay, onChange }: { stay: Stay; onChange: (s: Stay) => void }) {
  const t = useTranslations('Fields')
  const ages = fitAges(stay.ages, stay.children)
  return (
    <div className="mt-1 grid gap-3 rounded-xl bg-muted p-3.5">
      <div>
        <p className="text-[14px] font-semibold text-brand">{t('agesTitle')}</p>
        <p className="text-[12px] text-muted-foreground">{t('agesHint')}</p>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {ages.map((age, i) => (
          <div key={i} className="grid min-w-0 gap-1">
            <label htmlFor={`child-age-${i}`} className="text-[12px] text-muted-foreground">{t('child', { n: i + 1 })}</label>
            <Select value={age ? String(age) : ''} onValueChange={v => onChange({ ...stay, ages: ages.map((a, j) => (j === i ? Number(v) : a)) })}>
              <SelectTrigger id={`child-age-${i}`} className={cn('!h-11 w-full rounded-lg bg-white text-[15px]', age ? 'border-border-strong' : 'border-dashed border-primary')}>
                <SelectValue placeholder={t('agePick')} />
              </SelectTrigger>
              <SelectContent>{CHILD_AGE_OPTIONS.map(n => <SelectItem key={n} value={String(n)}>{n === 1 ? t('ageMax1') : t('age', { n })}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </div>
  )
}
const CHILD_AGE_OPTIONS = Array.from({ length: 11 }, (_, i) => i + 1)

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
        <PopoverContent align="start" collisionPadding={16} className="w-80 max-w-[calc(100vw-2rem)] px-4 pt-1 pb-4">
          <div className="divide-y divide-border">
            <Counter label={t('Fields.adults')} value={stay.adults} min={1} max={6} onChange={adults => onChange({ ...stay, adults })} />
            <Counter label={t('Fields.children')} sub={t('Fields.under12')} value={stay.children} min={0} max={4} onChange={children => onChange({ ...stay, children, ages: fitAges(stay.ages, children) })} />
          </div>
          {stay.children > 0 && <ChildAges stay={stay} onChange={onChange} />}
        </PopoverContent>
      </Popover>
  )
  return boxed ? field : <Field id={id} label={t('Fields.guests')}>{field}</Field>
}

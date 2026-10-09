// Mảnh dùng chung của website, theo nhận diện rootytrip.com (chép từ wireframe phương án A).
import Image from 'next/image'
import type { ReactNode } from 'react'
import { Bus, CableCar, Check, ChevronDown, Clock, Coffee, DoorOpen, FerrisWheel, ImageOff, MapPin, Plane, Receipt, Shirt, WashingMachine, Wifi, type LucideIcon } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { cn } from 'cn'
import { fmtDayMonth, fmtPrice, fmtWeekday } from '@/lib/format'
import type { IconKey } from '@/types/global'

/** Khung nội dung — độ rộng khai báo một lần ở globals.css (--site-width). */
export const CONTAINER = 'container-site'
export const BTN = 'inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-5 text-[15px] font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50'
export const BTN_OUT = 'inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg border border-primary bg-white px-5 text-[15px] font-semibold text-primary transition-colors hover:bg-mint'
/** Nhãn nhỏ in hoa màu cam kiểu rootytrip ("ĐẶT TOUR / COMBO") */
export const EYEBROW = 'text-[13px] font-semibold uppercase tracking-wide text-orange'
export const TEXT_LINK = 'inline-flex min-h-8 items-center gap-1 text-[15px] font-semibold text-primary underline-offset-4 hover:underline'

export const ICONS: Record<IconKey, LucideIcon> = {
  'map-pin': MapPin, clock: Clock, 'cable-car': CableCar, 'door-open': DoorOpen, plane: Plane, bus: Bus, 'ferris-wheel': FerrisWheel,
  coffee: Coffee, wifi: Wifi, shirt: Shirt, receipt: Receipt, 'washing-machine': WashingMachine,
}

/** Tiêu đề section kiểu rootytrip: xanh rêu đậm, chữ cuối xanh ngọc. */
export function SectionTitle({ lead, accent, className }: { lead: string; accent: string; className?: string }) {
  return <h2 className={cn('text-[28px] leading-tight font-bold text-brand sm:text-[36px]', className)}>{lead} <span className="text-brand-accent">{accent}</span></h2>
}

export const CheckItem = ({ children }: { children: ReactNode }) => (
  <li className="flex gap-2.5 text-[15px] text-foreground italic"><Check className="mt-1 size-4 shrink-0 text-brand" aria-hidden /><span>{children}</span></li>
)

/** Thẻ kính sáng nổi trên quầng màu lấy từ ảnh (thẻ đặt phòng cột phải). Không có ảnh thì chỉ còn thẻ kính trên nền mint. */
export function GlowCard({ src, className, children }: { src?: string | null; className?: string; children: ReactNode }) {
  return (
    <div className="relative isolate">
      {src
        ? <Image src={src} alt="" aria-hidden fill sizes="400px" className="pointer-events-none top-8! h-[88%]! scale-105 rounded-[48px] object-cover opacity-30 blur-[56px] saturate-150" />
        : <div aria-hidden className="pointer-events-none absolute inset-x-0 top-8 h-[88%] rounded-[48px] bg-mint blur-2xl" />}
      <div className={cn('glass-light relative rounded-[26px] p-5', className)}>{children}</div>
    </div>
  )
}

const SUMMARY = 'inline-flex min-h-8 cursor-pointer list-none items-center gap-1 font-semibold text-primary [&::-webkit-details-marker]:hidden'

/** Giá từng đêm: tới 3 đêm hiện sẵn; từ 4 đêm gập lại (ở dài 29 đêm không đẩy tổng tiền xuống tận đáy), bấm mũi tên để mở. */
export function NightlyPrices({ days, className }: { days: { day: string; price: number }[]; className?: string }) {
  const t = useTranslations('Common')
  const locale = useLocale()
  return (
    <details className={cn('group text-[14px]', className)} open={days.length <= 3}>
      <summary className={cn(SUMMARY, 'w-full justify-between text-[14px]')}>
        <span>{t('nightly')} · {t('nights', { n: days.length })}</span>
        <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <ul className="mt-1.5 grid gap-1.5 tabular-nums">
        {days.map(d => <li key={d.day} className="flex justify-between gap-3"><span className="text-muted-foreground">{fmtWeekday(d.day, locale)}, {fmtDayMonth(d.day, locale)}</span><span>{fmtPrice(d.price)}</span></li>)}
      </ul>
    </details>
  )
}

/** "Đã gồm trong giá phòng" thu gọn: 4 icon đầu, phần còn lại và mô tả mở ra khi bấm. */
export function IncludedGrid({ items, title, more }: { items: { icon: IconKey; label: string; desc?: string }[]; title: string; more: (n: number) => string }) {
  if (!items.length) return null
  const rest = items.slice(4)
  return (
    <div className="rounded-2xl border border-white/90 bg-mint/75 p-3.5">
      <p className="text-[13px] font-bold text-brand">{title}</p>
      <ul className="mt-2.5 grid grid-cols-4 gap-1.5 text-center text-[12px] leading-tight text-brand">
        {items.slice(0, 4).map(a => {
          const Icon = ICONS[a.icon]
          return <li key={a.label} className="flex flex-col items-center gap-1.5" title={a.desc}><span className="grid size-10 place-items-center rounded-xl bg-white"><Icon className="size-[18px]" aria-hidden /></span>{a.label}</li>
        })}
      </ul>
      {rest.length > 0 && (
        <details className="group mt-2 text-[13px]">
          <summary className={SUMMARY}>{more(rest.length)}<ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden /></summary>
          <ul className="mt-1 grid gap-1.5 text-muted-foreground">{items.map(a => <li key={a.label}><b className="font-semibold text-foreground">{a.label}</b>{a.desc && ` — ${a.desc}`}</li>)}</ul>
        </details>
      )}
    </div>
  )
}

/** Ảnh trong /public/images. Không có ảnh thì hiện khung "Chưa có ảnh". */
export function Photo({ src, alt, className, sizes = '100vw', priority }: { src?: string | null; alt: string; className?: string; sizes?: string; priority?: boolean }) {
  const t = useTranslations('Common')
  return (
    <div className={cn('relative overflow-hidden bg-muted', className)}>
      {src
        ? <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
        : <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-sm text-muted-foreground"><ImageOff className="size-6" aria-hidden />{t('noPhoto')}</div>}
    </div>
  )
}

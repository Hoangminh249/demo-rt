'use client'
// Tóm tắt đặt phòng (bước 2, 3): ảnh, phòng, gói, ngày, khách, giá từng đêm, tổng — giá tính lại từ Gohost mỗi bước.
// Máy tính: thẻ dính cột phải. Điện thoại: một dòng gập "Phòng · tổng tiền", mở ra xem đủ.
import type { ReactNode } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { AlertTriangle, ChevronDown, Coffee, PencilLine, ShieldCheck } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { diffDays, fmtDate, fmtPrice, fmtWeekday } from '@/lib/format'
import { roomHref } from '@/lib/booking'
import type { BookingTarget } from '@/types/booking'
import { NightlyPrices, Photo, TEXT_LINK } from '@/components/site/kit'
import { useRoomOffer } from '@/components/room/use-room-offer'

function Body({ target, extra }: { target: BookingTarget; extra?: ReactNode }) {
  const t = useTranslations()
  const locale = useLocale()
  const { hotel, room, times } = target
  const o = useRoomOffer(hotel, room)
  const p = o.plan
  const day = (iso: string) => `${fmtWeekday(iso, locale)}, ${fmtDate(iso, locale)}`
  const rows: [string, ReactNode][] = [
    [t('Booking.checkin'), <>{day(o.stay.checkin)}<span className="block text-[13px] font-normal text-muted-foreground">{times.checkin}</span></>],
    [t('Booking.checkout'), <>{day(o.stay.checkout)}<span className="block text-[13px] font-normal text-muted-foreground">{times.checkout}</span></>],
    [t('Booking.stay'), `${t('Common.nights', { n: diffDays(o.stay.checkin, o.stay.checkout) })} · ${t('Common.guests', { adults: o.stay.adults, children: o.stay.children })}`],
  ]
  return (
    <>
      <div className="flex gap-3">
        <Photo src={room.images[0]} alt={room.name} sizes="96px" className="size-20 shrink-0 rounded-lg" />
        <div className="min-w-0">
          <p className="text-[13px] text-muted-foreground">{hotel.name}</p>
          <p className="font-semibold text-brand">{room.name}</p>
          {p && <p className="mt-0.5 inline-flex flex-wrap items-center gap-x-1.5 text-[13px] text-muted-foreground">{p.title}{p.has_breakfast && <><span aria-hidden>·</span><Coffee className="size-3.5" aria-hidden />{t('Rooms.breakfast')}</>}</p>}
        </div>
      </div>
      <dl className="mt-4 grid gap-2.5 border-y border-border py-4 text-[14px]">
        {rows.map(([k, v]) => <div key={k} className="flex justify-between gap-4"><dt className="text-muted-foreground">{k}</dt><dd className="text-right font-medium">{v}</dd></div>)}
      </dl>
      {o.status === 'loading' ? (
        <div className="mt-4 grid gap-2" role="status" aria-label={t('Rooms.loading')}>{[0, 1, 2].map(i => <div key={i} className="h-5 animate-pulse rounded bg-muted" />)}</div>
      ) : o.status === 'available' && p ? (
        <>
          <NightlyPrices days={p.days_breakdown} className="mt-3" />
          <p className="mt-3 flex items-baseline justify-between gap-3 border-t border-border pt-3">
            <span className="font-semibold">{t('Booking.total')}</span><span className="text-xl font-bold text-brand tabular-nums">{fmtPrice(p.total)}</span>
          </p>
          {extra}
        </>
      ) : (
        <p role="alert" className="mt-4 flex gap-2.5 rounded-xl bg-muted px-4 py-3 text-[14px]"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-orange" aria-hidden />{o.status === 'too_small' ? t('Room.plansEmpty.too_small') : t('Booking.unavailable')}</p>
      )}
      <p className="mt-4 flex gap-2 text-[13px] text-muted-foreground"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />{hotel.cancel_summary}</p>
      <Link href={roomHref(hotel.slug, room.slug, o.stay, p?.rate_plan_id)} className={`${TEXT_LINK} mt-2 text-[14px]`}><PencilLine className="size-4" aria-hidden />{t('Booking.editChoice')}</Link>
    </>
  )
}

export function Summary({ target, extra }: { target: BookingTarget; extra?: ReactNode }) {
  return <div className="rounded-2xl border border-border bg-white p-5 shadow-card"><Body target={target} extra={extra} /></div>
}

export function MobileSummary({ target, extra }: { target: BookingTarget; extra?: ReactNode }) {
  const t = useTranslations('Booking')
  const o = useRoomOffer(target.hotel, target.room)
  return (
    <details className="group mb-6 rounded-2xl border border-border bg-white lg:hidden">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0"><span className="block truncate text-[15px] font-semibold text-brand">{target.room.name}</span><span className="text-[13px] text-muted-foreground">{t('seeDetails')}</span></span>
        <span className="flex shrink-0 items-center gap-2">{o.plan && <span className="font-bold tabular-nums">{fmtPrice(o.plan.total)}</span>}<ChevronDown className="size-5 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden /></span>
      </summary>
      <div className="border-t border-border px-4 pt-4 pb-4"><Body target={target} extra={extra} /></div>
    </details>
  )
}

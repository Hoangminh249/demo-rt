'use client'
// Trang chi tiết phòng: danh sách gói giá (cột trái), thẻ đặt phòng dính (cột phải / ngay dưới tên phòng trên điện thoại), thanh đáy điện thoại.
// Cả ba đọc cùng URL (?in=&out=&a=&c=&plan=) qua useRoomOffer, cùng một truy vấn Gohost (TanStack gộp).
// Chưa có giá trực tuyến → "Liên hệ đặt phòng" (hộp liên hệ của trang khách sạn), không đoán số.
import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { ArrowRight, CalendarX, Check, Coffee, Info, MessageCircle, RotateCw, ShieldCheck, Users, WifiOff } from 'lucide-react'
import { cn } from 'cn'
import { Link } from '@/i18n/navigation'
import { diffDays, fmtDayMonth, fmtPrice, fmtRange, fmtWeekday, today } from '@/lib/format'
import { nightly } from '@/lib/rooms'
import { firstCheckin } from '@/lib/stay'
import { selectionQuery } from '@/lib/booking'
import type { Contact, Room } from '@/lib/types'
import { BTN, BTN_OUT } from '@/components/site/kit'
import { DateRangeField, GuestsField } from '@/components/site/stay-fields'
import { ContactDialog } from '@/components/hotel/rooms'
import { useRoomOffer, type OfferHotel } from './use-room-offer'

type Props = { hotel: OfferHotel; room: Room; contact: Contact }

const bookHref = (hotel: OfferHotel, room: Room, o: ReturnType<typeof useRoomOffer>) =>
  `/dat-phong?${selectionQuery({ hotel: hotel.slug, room: room.slug, plan: o.plan?.rate_plan_id }, o.stay)}`

/** Cột trái: so sánh gói giá — thứ khách dùng để chọn (ăn sáng, huỷ, giá/đêm). */
export function PlanPicker({ hotel, room }: Omit<Props, 'contact'>) {
  const t = useTranslations()
  const locale = useLocale()
  const o = useRoomOffer(hotel, room)
  const nights = diffDays(o.stay.checkin, o.stay.checkout)
  return (
    <section id="goi-gia" className="scroll-mt-28 border-t border-border pt-10">
      <h2 className="text-[26px] font-bold text-brand">{t('Room.plansTitle')}</h2>
      <p className="mt-1 text-[15px] text-muted-foreground">
        {fmtRange(o.stay.checkin, o.stay.checkout, locale)} · {t('Common.nights', { n: nights })} · {t('Common.guests', { adults: o.stay.adults, children: o.stay.children })}
      </p>
      {o.status === 'loading' ? (
        <div className="mt-5 grid gap-3" role="status" aria-label={t('Rooms.loading')}>
          {[0, 1].map(i => <div key={i} className="h-[104px] animate-pulse rounded-2xl bg-muted" />)}
        </div>
      ) : o.status === 'available' ? (
        <div role="radiogroup" aria-label={t('Room.plansTitle')} className="mt-5 grid gap-3">
          {o.plans.map(p => {
            const on = p.rate_plan_id === o.plan?.rate_plan_id
            return (
              <button key={p.rate_plan_id} type="button" role="radio" aria-checked={on} onClick={() => o.setPlan(p.rate_plan_id)}
                className={cn('grid cursor-pointer gap-3 rounded-2xl border bg-white p-4 text-left transition-colors sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-4 sm:p-5',
                  on ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-border-strong hover:bg-item-hover')}>
                <span className={cn('hidden size-5 place-items-center rounded-full border sm:grid', on ? 'border-primary bg-primary text-primary-foreground' : 'border-border-strong')} aria-hidden>
                  {on && <Check className="size-3.5" strokeWidth={3} />}
                </span>
                <span className="min-w-0">
                  <span className="block text-[16px] font-semibold text-brand">{p.title}</span>
                  <span className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[14px] text-muted-foreground">
                    {p.has_breakfast && <span className="inline-flex items-center gap-1.5"><Coffee className="size-3.5" aria-hidden />{t('Rooms.breakfast')}</span>}
                    <span>{hotel.cancel_summary}</span>
                  </span>
                </span>
                <span className="sm:text-right">
                  <span className="text-xl font-semibold">{fmtPrice(nightly(p))}</span><span className="text-[13px] text-muted-foreground"> {t('Common.perNight')}</span>
                  <span className="block text-[13px] whitespace-nowrap text-muted-foreground">{t('Rooms.total', { total: fmtPrice(p.total), nights: t('Common.nights', { n: p.days_breakdown.length }) })}</span>
                </span>
              </button>
            )
          })}
        </div>
      ) : (
        <p className="mt-5 flex gap-2.5 rounded-xl border border-dashed border-border-strong px-4 py-3 text-[15px] text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />{t(`Room.plansEmpty.${o.status}`)}
        </p>
      )}
    </section>
  )
}

/** Thẻ đặt phòng: ngày, khách, gói đang chọn, giá từng đêm, tổng, nút Đặt phòng. */
export function BookingCard({ hotel, room, contact, idPrefix }: Props & { idPrefix: string }) {
  const t = useTranslations()
  const locale = useLocale()
  const o = useRoomOffer(hotel, room)
  const [asking, setAsking] = useState(false)
  const p = o.plan
  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-card">
      {p ? (
        <p><span className="text-[28px] font-semibold">{fmtPrice(nightly(p))}</span><span className="text-[14px] text-muted-foreground"> {t('Common.perNight')}</span></p>
      ) : <p className="text-[17px] font-semibold text-brand">{t('Room.cardTitle')}</p>}

      <div className="mt-4 grid gap-3">
        <DateRangeField id={`${idPrefix}-dates`} label={t('Fields.datesShort')} stay={o.stay} min={firstCheckin(today(), hotel.opening)} onChange={o.setStay} />
        <GuestsField id={`${idPrefix}-guests`} stay={o.stay} onChange={o.setStay} />
      </div>

      <div className="mt-4" aria-live="polite">
        {o.status === 'loading' ? (
          <div className="grid gap-2" role="status" aria-label={t('Rooms.loading')}>
            {[0, 1, 2].map(i => <div key={i} className="h-5 animate-pulse rounded bg-muted" />)}
            <div className="mt-2 h-12 animate-pulse rounded-lg bg-muted" />
          </div>
        ) : o.status === 'available' && p ? (
          <>
            <p className="text-[14px] font-semibold text-brand">{p.title}{p.has_breakfast && <span className="font-normal text-muted-foreground"> · {t('Rooms.breakfast')}</span>}</p>
            <ul className="mt-2 grid gap-1.5 border-b border-border pb-3 text-[14px]">
              {p.days_breakdown.map(d => (
                <li key={d.day} className="flex justify-between gap-3 tabular-nums">
                  <span className="text-muted-foreground">{fmtWeekday(d.day, locale)}, {fmtDayMonth(d.day, locale)}</span><span>{fmtPrice(d.price)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 flex items-baseline justify-between gap-3">
              <span className="text-[15px] font-semibold">{t('Room.totalFor', { nights: t('Common.nights', { n: p.days_breakdown.length }) })}</span>
              <span className="text-xl font-bold text-brand tabular-nums">{fmtPrice(p.total)}</span>
            </p>
            <Link href={bookHref(hotel, room, o)} className={`${BTN} mt-4 h-12 w-full`}>{t('Room.book')}<ArrowRight className="size-4" aria-hidden /></Link>
            <p className="mt-2.5 flex items-center justify-center gap-1.5 text-[13px] text-muted-foreground"><ShieldCheck className="size-4 text-brand" aria-hidden />{t('Room.noChargeYet')}</p>
          </>
        ) : o.status === 'sold_out' ? (
          <p className="flex gap-2.5 rounded-xl bg-muted px-4 py-3 text-[14px]"><CalendarX className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />{t('Room.soldOut')}</p>
        ) : o.status === 'too_small' && o.offer?.occ ? (
          <p className="flex gap-2.5 rounded-xl bg-muted px-4 py-3 text-[14px]"><Users className="mt-0.5 size-4 shrink-0 text-orange" aria-hidden />
            {t('Rooms.roomMax', { max: t('Common.guests', { adults: o.offer.occ.adults, children: o.offer.occ.children }), party: t('Common.guests', { adults: o.stay.adults, children: o.stay.children }) })}
          </p>
        ) : (
          <>
            <p className="flex gap-2.5 rounded-xl bg-muted px-4 py-3 text-[14px]">
              {o.status === 'error' ? <WifiOff className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden /> : <Info className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />}
              {o.status === 'error' ? t('Rooms.errorBody') : t('Room.contactOnly')}
            </p>
            <div className="mt-3 flex gap-2">
              {o.status === 'error' && <button type="button" onClick={o.retry} className={`${BTN_OUT} h-12 px-4`} aria-label={t('Rooms.retry')}><RotateCw className="size-4" aria-hidden /></button>}
              <button type="button" onClick={() => setAsking(true)} className={`${BTN} h-12 flex-1`}>{t('Rooms.book')}</button>
            </div>
          </>
        )}
      </div>

      <a href={contact.zalo} target="_blank" rel="noopener" className="mt-3 flex min-h-10 items-center gap-1.5 text-[14px] text-muted-foreground hover:text-primary">
        <MessageCircle className="size-4 shrink-0 text-orange" aria-hidden />{t('Hotel.bookVia', { phone: contact.phone_display })}
      </a>
      <ContactDialog hotel={hotel} stay={o.stay} picked={asking ? { room } : undefined} contact={contact} onClose={() => setAsking(false)} />
    </div>
  )
}

/** Điện thoại: tổng tiền + Đặt phòng dính đáy. Chưa có giá thì cuộn tới thẻ đặt phòng. */
export function RoomMobileBar({ hotel, room }: Omit<Props, 'contact'>) {
  const t = useTranslations()
  const o = useRoomOffer(hotel, room)
  const p = o.status === 'available' ? o.plan : undefined
  return (
    <div id="mobile-book-bar" className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-white px-4 py-3 lg:hidden">
      <div className="flex items-center justify-between gap-3">
        {p ? (
          <p className="min-w-0"><span className="block text-[13px] text-muted-foreground">{t('Room.totalFor', { nights: t('Common.nights', { n: p.days_breakdown.length }) })}</span><span className="text-lg font-semibold tabular-nums">{fmtPrice(p.total)}</span></p>
        ) : <p className="min-w-0 text-[15px] font-semibold text-brand">{t('Room.cardTitle')}</p>}
        {p ? <Link href={bookHref(hotel, room, o)} className={BTN}>{t('Room.book')}</Link> : <a href="#dat-phong" className={BTN}>{t('Room.seeDates')}</a>}
      </div>
    </div>
  )
}

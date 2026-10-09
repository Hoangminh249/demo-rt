'use client'
// Trang chi tiết phòng (thiết kế canvas "Chi tiết phòng", 08/10/2026): thẻ đặt phòng dính cột phải (điện thoại: ngay dưới tên phòng),
// thanh đáy điện thoại, sức chứa theo Gohost. Cùng đọc URL (?in=&out=&a=&c=&plan=) qua useRoomOffer, chung một truy vấn Gohost.
// Chưa có giá trực tuyến → "Liên hệ đặt phòng" (hộp liên hệ của trang khách sạn), không đoán số.
import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { ArrowRight, CalendarX, Check, Info, MessageCircle, RotateCw, ShieldCheck, Users, WifiOff } from 'lucide-react'
import { cn } from 'cn'
import { Link } from '@/i18n/navigation'
<<<<<<< Updated upstream
import { fmtDayMonth, fmtPrice, fmtWeekday, today } from '@/lib/format'
import { nightly } from '@/lib/rooms'
import { firstCheckin } from '@/lib/stay'
import { selectionQuery } from '@/lib/booking'
import type { Contact, Room } from '@/types/hotel'
import { BTN_OUT } from '@/components/site/kit'
=======
import { diffDays, fmtPrice, fmtRange, today } from '@/lib/format'
import { nightly } from '@/lib/rooms'
import { firstCheckin } from '@/lib/stay'
import { selectionQuery } from '@/lib/booking'
import type { Contact, Hotel, Room } from '@/lib/types'
import { BTN, BTN_OUT, GlowCard, IncludedGrid, NightlyPrices } from '@/components/site/kit'
>>>>>>> Stashed changes
import { DateRangeField, GuestsField } from '@/components/site/stay-fields'
import { ContactDialog } from '@/components/hotel/rooms'
import { useRoomOffer, type OfferHotel } from './use-room-offer'

type Props = { hotel: OfferHotel; room: Room; contact: Contact }
type IncludedItem = Hotel['included'][number]

const bookHref = (hotel: OfferHotel, room: Room, o: ReturnType<typeof useRoomOffer>) =>
  `/dat-phong?${selectionQuery({ hotel: hotel.slug, room: room.slug, plan: o.plan?.rate_plan_id }, o.stay)}`

export const LABEL = 'text-[12px] font-semibold tracking-[0.12em] text-muted-foreground uppercase'
const CTA = 'group/cta flex h-[54px] w-full items-center justify-center gap-2.5 rounded-full bg-brand text-[16px] font-semibold tracking-[0.01em] text-white transition-[background-color,box-shadow] duration-200 hover:bg-[#04443a] hover:shadow-[0_10px_24px_-10px_rgba(6,87,73,0.65)]'
const BAR_BTN = 'inline-flex h-12 shrink-0 items-center gap-1.5 rounded-full bg-brand px-6 text-[16px] font-semibold text-white transition-colors hover:bg-[#04443a]'
const NOTICE ='flex gap-2.5 rounded-2xl bg-muted px-4 py-3 text-[14px] leading-relaxed'

/** Sức chứa theo Gohost (ô thông số đầu trang). Chưa có dữ liệu thì gạch ngang. */
export function RoomCapacity({ hotel, room }: { hotel: OfferHotel; room: Room }) {
  const t = useTranslations()
  const occ = useRoomOffer(hotel, room).offer?.occ
  return <>{occ?.adults ? t('Common.capacity', { adults: occ.adults, children: occ.children }) : '—'}</>
}

<<<<<<< Updated upstream
/** Thẻ đặt phòng: giá mỗi đêm · ngày + khách (một khung) · gói (nhiều gói thì chọn) · giá từng đêm · tổng · Đặt phòng. */
export function BookingCard({ hotel, room, contact, idPrefix, vatIncluded }: Props & { idPrefix: string; vatIncluded: boolean }) {
=======
/** Thẻ đặt phòng: ngày, khách, gói đang chọn, giá từng đêm, tổng, nút Đặt phòng. */
export function BookingCard({ hotel, room, contact, idPrefix, included }: Props & { idPrefix: string; included: IncludedItem[] }) {
>>>>>>> Stashed changes
  const t = useTranslations()
  const o = useRoomOffer(hotel, room)
  const [asking, setAsking] = useState(false)
<<<<<<< Updated upstream
  const p = o.status === 'available' ? o.plan : undefined

  return (
    <>
      <div className="overflow-hidden rounded-3xl bg-white shadow-[0_24px_48px_-28px_rgba(6,40,34,0.5)]">
        <div className="bg-mint px-6 pt-6 pb-5">
          <div className="flex items-center justify-between gap-3">
            <span className={LABEL}>{p ? t('Rooms.perNightLabel') : t('Room.cardTitle')}</span>
            {p && o.plans.length === 1 && <span className="inline-flex h-6 items-center rounded-full bg-white px-2.5 text-[12px] font-medium text-brand">{p.title}</span>}
          </div>
          {p ? (
            <p className="mt-2 flex items-baseline gap-1.5 whitespace-nowrap">
              <span className="text-[32px] leading-none font-bold tracking-[-0.02em] text-brand tabular-nums">{fmtPrice(nightly(p))}</span>
              <span className="text-[14px] text-muted-foreground">{t('Common.perNight')}</span>
            </p>
          ) : o.status === 'loading' ? <div className="mt-2 h-8 w-3/4 animate-pulse rounded-md bg-white/70" /> : null}
        </div>

        <div className="p-5 sm:p-6">
          <div className="overflow-hidden rounded-2xl border border-border-strong">
            <DateRangeField id={`${idPrefix}-dates`} boxed stay={o.stay} min={firstCheckin(today(), hotel.opening)} onChange={o.setStay} />
            <div className="border-t border-border-strong"><GuestsField id={`${idPrefix}-guests`} boxed stay={o.stay} onChange={o.setStay} /></div>
          </div>

          <div className="mt-5" aria-live="polite">
            {o.status === 'loading' ? (
              <div className="grid gap-2.5" role="status" aria-label={t('Rooms.loading')}>
                {[0, 1, 2].map(i => <div key={i} className="h-4 animate-pulse rounded bg-muted" />)}
                <div className="mt-3 h-[54px] animate-pulse rounded-full bg-muted" />
              </div>
            ) : p ? (
              <>
                {o.plans.length > 1 && (
                  <fieldset className="mb-5">
                    <legend className={`${LABEL} mb-2`}>{t('Rooms.plansCount', { n: o.plans.length })}</legend>
                    <div className="grid gap-2">
                      {o.plans.map(x => (
                        <label key={x.rate_plan_id} className={cn('flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-[14px]', x === p ? 'border-brand ring-1 ring-brand' : 'border-border hover:border-border-strong')}>
                          <span className="flex items-center gap-2.5"><input type="radio" name={`${idPrefix}-plan`} checked={x === p} onChange={() => o.setPlan(x.rate_plan_id)} className="accent-brand" />
                            <span className="font-semibold">{x.title}{x.has_breakfast ? ` · ${t('Rooms.breakfast')}` : ''}</span></span>
                          <span className="font-semibold tabular-nums">{fmtPrice(nightly(x))}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                )}
                <dl className="grid gap-2.5 text-[14px] tabular-nums">
                  {p.days_breakdown.map(d => (
                    <div key={d.day} className="flex justify-between gap-3"><dt className="text-muted-foreground">{fmtWeekday(d.day, locale)}, {fmtDayMonth(d.day, locale)}</dt><dd>{fmtPrice(d.price)}</dd></div>
                  ))}
                  <div className="mt-1 flex items-baseline justify-between gap-3 border-t border-dashed border-border-strong pt-3.5">
                    <dt className="font-semibold">{t('Room.totalFor', { nights: t('Common.nights', { n: p.days_breakdown.length }) })}</dt>
                    <dd className="text-[20px] font-bold tracking-[-0.01em]">{fmtPrice(p.total)}</dd>
                  </div>
                </dl>
                <Link href={bookHref(hotel, room, o)} className={`${CTA} mt-6`}>
                  {t('Room.book')}<ArrowRight className="size-[18px] transition-transform duration-200 group-hover/cta:translate-x-[3px]" strokeWidth={2.2} aria-hidden />
                </Link>
                <ul className="mt-4 grid gap-2 text-[14px] text-muted-foreground">
                  <li className="flex items-center gap-2"><ShieldCheck className="size-4 shrink-0 text-brand-accent" aria-hidden />{t('Room.noChargeYet')}</li>
                  {vatIncluded && <li className="flex items-center gap-2"><Check className="size-4 shrink-0 text-brand-accent" aria-hidden />{t('Room.vatIncluded')}</li>}
                </ul>
              </>
            ) : o.status === 'sold_out' ? (
              <p className={NOTICE}><CalendarX className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />{t('Room.soldOut')}</p>
            ) : o.status === 'too_small' && o.offer?.occ ? (
              <p className={NOTICE}><Users className="mt-0.5 size-4 shrink-0 text-orange" aria-hidden />
                {t('Rooms.roomMax', { max: t('Common.guests', { adults: o.offer.occ.adults, children: o.offer.occ.children }), party: t('Common.guests', { adults: o.stay.adults, children: o.stay.children }) })}
              </p>
            ) : (
              <>
                <p className={NOTICE}>
                  {o.status === 'error' ? <WifiOff className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden /> : <Info className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />}
                  {o.status === 'error' ? t('Rooms.errorBody') : t('Room.contactOnly')}
                </p>
                <div className="mt-4 flex gap-2">
                  {o.status === 'error' && <button type="button" onClick={o.retry} className={`${BTN_OUT} h-[54px] rounded-full px-5`} aria-label={t('Rooms.retry')}><RotateCw className="size-4" aria-hidden /></button>}
                  <button type="button" onClick={() => setAsking(true)} className={`${CTA} flex-1 cursor-pointer`}>{t('Rooms.book')}</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <a href={contact.zalo} target="_blank" rel="noopener" className="mt-4 flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5 text-[14px] transition-colors hover:bg-item-hover">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-orange/10 text-orange"><MessageCircle className="size-4" aria-hidden /></span>
        <span className="flex flex-col"><span className="text-muted-foreground">{t('Room.adviceTitle')}</span><span className="font-semibold text-brand">{t('Room.adviceZalo', { phone: contact.phone_display })}</span></span>
      </a>
      <ContactDialog hotel={hotel} stay={o.stay} picked={asking ? { room } : undefined} contact={contact} onClose={() => setAsking(false)} />
    </>
=======
  const p = o.plan
  const left = o.status === 'available' ? o.offer?.left ?? 0 : 0
  return (
    <GlowCard src={room.images[0]}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[12px] font-bold tracking-[0.04em] text-primary uppercase"><ShieldCheck className="size-4" aria-hidden />{t('Room.direct')}</span>
        {left > 0 && left <= 3 && <span className="inline-flex h-6 items-center rounded-full bg-yellow px-2.5 text-[12px] font-semibold text-yellow-foreground">{t('Rooms.lowStock', { n: left })}</span>}
      </div>
      {p ? (
        <p className="mt-1"><span className="text-[30px] font-bold text-brand">{fmtPrice(nightly(p))}</span><span className="text-[14px] text-muted-foreground"> {t('Common.perNight')}</span></p>
      ) : <p className="mt-1 text-[17px] font-semibold text-brand">{t('Room.cardTitle')}</p>}

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
            <NightlyPrices days={p.days_breakdown} className="mt-1 border-b border-border pb-3" />
            <p className="mt-3 flex items-baseline justify-between gap-3">
              <span className="text-[15px] font-semibold">{t('Room.totalFor', { nights: t('Common.nights', { n: p.days_breakdown.length }) })}</span>
              <span className="text-xl font-bold text-brand tabular-nums">{fmtPrice(p.total)}</span>
            </p>
            <Link href={bookHref(hotel, room, o)} className={`${BTN} mt-4 h-13 w-full rounded-xl text-[16px] shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_6px_16px_rgb(35_128_111/0.22)]`}>{t('Room.book')}<ArrowRight className="size-4" aria-hidden /></Link>
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

      <div className="mt-4"><IncludedGrid items={included} title={t('Hotel.included')} more={n => t('Hotel.moreIncluded', { n })} /></div>
      <a href={contact.zalo} target="_blank" rel="noopener" className="mt-2 flex min-h-10 items-center gap-1.5 text-[14px] text-muted-foreground hover:text-primary">
        <MessageCircle className="size-4 shrink-0 text-orange" aria-hidden />{t('Hotel.bookVia', { phone: contact.phone_display })}
      </a>
      <ContactDialog hotel={hotel} stay={o.stay} picked={asking ? { room } : undefined} contact={contact} onClose={() => setAsking(false)} />
    </GlowCard>
>>>>>>> Stashed changes
  )
}

/** Điện thoại: tổng tiền + Đặt phòng dính đáy. Chưa có giá thì cuộn tới thẻ đặt phòng. */
export function RoomMobileBar({ hotel, room }: Omit<Props, 'contact'>) {
  const t = useTranslations()
  const o = useRoomOffer(hotel, room)
  const p = o.status === 'available' ? o.plan : undefined
  return (
    <div id="mobile-book-bar" className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-white px-4 pt-3 pb-4 lg:hidden">
      <div className="flex items-center justify-between gap-3">
        {p ? (
          <p className="min-w-0">
            <span className="block text-[20px] leading-tight font-bold whitespace-nowrap text-brand tabular-nums">{fmtPrice(p.total)}</span>
            <span className="text-[12px] text-muted-foreground">{t('Room.totalFor', { nights: t('Common.nights', { n: p.days_breakdown.length }) })} · {t('Room.notPaid')}</span>
          </p>
        ) : <p className="min-w-0 text-[16px] font-semibold text-brand">{t('Room.cardTitle')}</p>}
        {p
          ? <Link href={bookHref(hotel, room, o)} className={BAR_BTN}>{t('Room.book')}<ArrowRight className="size-4" strokeWidth={2.2} aria-hidden /></Link>
          : <a href="#dat-phong" className={BAR_BTN}>{t('Room.seeDates')}</a>}
      </div>
    </div>
  )
}

'use client'
// Khối "Chọn phòng": nội dung từng hạng phòng (Rooty) + phòng trống, giá từng đêm (Gohost, qua /api/hotels/{slug}/rooms).
// Trạng thái: đang tải · có giá · hết phòng · không đủ chỗ · chưa có giá trực tuyến (chưa nối Gohost, lỗi, hết lượt gọi).
// Phòng có giá: tên phòng + nút "Chọn phòng" dẫn sang trang chi tiết phòng (chọn sẵn gói) → luồng đặt phòng (bản minh hoạ).
// Chưa có giá trực tuyến: nút "Liên hệ đặt phòng" mở hộp tóm tắt + Zalo / gọi / email — không ghi dữ liệu nào.
import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { ArrowRight, CalendarDays, CalendarX, Check, Images, Info, Mail, MessageCircle, Phone, RotateCw, ShieldCheck, Users, WifiOff } from 'lucide-react'
import { cn } from 'cn'
import { diffDays, fmtPrice, fmtRange, today } from '@/lib/format'
import { mergeRooms, nightly, type RoomOffer } from '@/lib/rooms'
import type { Contact, PlanOffer, Room, RoomAvailability, Stay } from '@/types/hotel'
import { useRoomAvailability } from '@/hooks/use-rooms'
import { Dialog } from '@/components/ui/overlay'
import { BTN, BTN_OUT, Photo } from '@/components/site/kit'
import { DateRangeField, GuestsField } from '@/components/site/stay-fields'
import { firstCheckin } from '@/lib/stay'
import { roomHref } from '@/lib/booking'
import { Link } from '@/i18n/navigation'
import { useStay } from './use-stay'

export interface RoomsHotel { slug: string; name: string; online: boolean; opening: string | null; cancel_summary: string }
type Result = { avail?: RoomAvailability[]; error?: boolean }
export type Pick = { room: Room; plan?: PlanOffer }

export function Rooms({ hotel, rooms, contact }: { hotel: RoomsHotel; rooms: Room[]; contact: Contact }) {
  const t = useTranslations()
  const locale = useLocale()
  const [stay, setStay] = useStay(hotel.opening)
  const [editing, setEditing] = useState(false)
  const [picked, setPicked] = useState<Pick>()
  const nights = diffDays(stay.checkin, stay.checkout)
  const party = t('Common.guests', { adults: stay.adults, children: stay.children })
  const range = fmtRange(stay.checkin, stay.checkout, locale)

  // Chỉ gọi lại khi đổi ngày (số khách tính "đủ chỗ" ngay trên trình duyệt, không tốn lượt gọi Gohost).
  const query = useRoomAvailability(hotel.slug, stay.checkin, stay.checkout, hotel.online)
  const ready: Result | undefined = !hotel.online ? { avail: [] } : query.isPending ? undefined : { avail: query.data, error: query.isError }
  const offers = ready?.avail ? mergeRooms(rooms, ready.avail, stay) : []
  const priced = offers.filter(o => o.state !== 'unmapped')
  const soldOut = priced.length > 0 && priced.every(o => o.state === 'sold_out')
  const noneFits = priced.length > 0 && priced.every(o => o.state === 'too_small')
  const offline = !hotel.online || ready?.error || (ready?.avail && priced.length === 0)

  return (
    <section id="phong" className="scroll-mt-36 border-t border-border pt-10">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
        <div>
          <p className="text-[13px] text-muted-foreground">{t('Rooms.typesCount', { n: rooms.length })}</p>
          <h2 className="mt-1 text-[26px] leading-tight font-bold text-brand">{t('Rooms.title')}</h2>
        </div>
        {/* Máy tính đã có ô ngày + khách ở thẻ giá dính cột phải → chỉ hiện nút này khi thẻ đó ẩn (dưới lg). */}
        <button type="button" onClick={() => setEditing(true)} aria-label={t('Rooms.change')}
          className="inline-flex h-11 max-w-full lg:hidden cursor-pointer items-center gap-2.5 rounded-full border border-border-strong bg-white px-4 text-[14px] transition-colors hover:bg-item-hover max-sm:w-full">
          <CalendarDays className="size-4 shrink-0 text-brand" aria-hidden />
          <span className="min-w-0 truncate tabular-nums">{range} · {t('Common.nights', { n: nights })} · {party}</span>
          <span className="ml-auto shrink-0 font-semibold text-brand">{t('Rooms.edit')}</span>
        </button>
      </div>

      <div className="mt-6 grid gap-4" aria-live="polite" aria-busy={!ready}>
        {!ready ? (
          <div className="grid gap-4" role="status" aria-label={t('Rooms.loading')}>
            {[0, 1].map(i => (
              <div key={i} className="grid overflow-hidden rounded-2xl border border-border md:grid-cols-[232px_minmax(0,1fr)_240px]">
                <div className="h-52 animate-pulse bg-muted md:h-auto md:min-h-[232px]" />
                <div className="space-y-3 p-4 md:px-5 md:py-5"><div className="h-6 w-1/2 animate-pulse rounded-md bg-muted" /><div className="h-3 w-2/3 animate-pulse rounded bg-muted" /><div className="h-3 w-11/12 animate-pulse rounded bg-muted" /><div className="h-3 w-3/4 animate-pulse rounded bg-muted" /></div>
                <div className="flex flex-col gap-3 border-t border-border p-4 md:border-t-0 md:border-l md:p-5"><div className="h-3 w-1/3 animate-pulse rounded bg-muted" /><div className="h-7 w-4/5 animate-pulse rounded bg-muted md:mt-auto" /><div className="h-[46px] animate-pulse rounded-full bg-muted" /></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {offline && (
              <div role={ready.error ? 'alert' : 'status'} className="flex flex-wrap items-start gap-3 rounded-xl border border-border px-4 py-3">
                {ready.error ? <WifiOff className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden /> : <Info className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden />}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-brand">{ready.error ? t('Rooms.errorTitle') : t('Rooms.offlineTitle')}</p>
                  <p className="text-[15px] text-muted-foreground">{ready.error ? t('Rooms.errorBody') : t('Rooms.offlineBody', { range })}</p>
                </div>
                {ready.error && <button type="button" onClick={() => query.refetch()} className={`${BTN_OUT} h-10`}><RotateCw className="size-4" aria-hidden />{t('Rooms.retry')}</button>}
              </div>
            )}
            {soldOut && (
              <div className="flex flex-col items-center rounded-2xl border border-border px-6 py-10 text-center">
                <CalendarX className="size-8 text-muted-foreground" aria-hidden />
                <p className="mt-3 text-lg font-semibold text-brand">{t('Rooms.soldOut', { range })}</p>
                <p className="mt-1 max-w-md text-[15px] text-muted-foreground">{t('Rooms.soldOutBody')}</p>
                <button type="button" onClick={() => setEditing(true)} className={`${BTN} mt-4`}>{t('Rooms.otherDates')}</button>
              </div>
            )}
            {noneFits && (
              <p role="status" className="flex gap-2.5 rounded-xl border border-border px-4 py-3 text-[15px]">
                <Users className="mt-0.5 size-4 shrink-0 text-orange" aria-hidden />{t('Rooms.notFit', { party })}
              </p>
            )}
            {(offers.length ? offers : rooms.map(room => ({ room, state: 'unmapped', left: 0, occ: null, plans: [] }) as RoomOffer)).map(o => (
              <RoomCard key={o.room.slug} offer={o} hotel={hotel} stay={stay} onPick={plan => setPicked({ room: o.room, plan })} onOtherDates={() => setEditing(true)} />
            ))}
            <p className="text-[12px] text-muted-foreground">
              {hotel.cancel_summary}. <Link href="/chinh-sach-huy" className="font-semibold text-primary underline-offset-4 hover:underline">{t('Rooms.cancelPolicy')}</Link>
            </p>
          </>
        )}
      </div>

      <Dialog open={editing} onClose={() => setEditing(false)} title={t('Rooms.change')}>
        <div className="grid gap-4">
          <DateRangeField id="rooms-dates" stay={stay} min={firstCheckin(today(), hotel.opening)} onChange={setStay} />
          <GuestsField id="rooms-guests" stay={stay} onChange={setStay} />
        </div>
        <button type="button" onClick={() => setEditing(false)} className={`${BTN} mt-5 w-full`}>{t('Common.seeRooms')}</button>
      </Dialog>

      <ContactDialog hotel={hotel} stay={stay} picked={picked} contact={contact} onClose={() => setPicked(undefined)} />
    </section>
  )
}

// Thẻ phòng (thiết kế canvas "Room list", 08/10/2026): ảnh · thông tin phòng · cột giá. Điện thoại: xếp dọc, cột giá thành hàng dưới.
// Tên phòng là link sang trang chi tiết; mỗi phòng một nút chính. Chính sách huỷ ghi một lần dưới danh sách, không lặp từng thẻ.
const RAIL = 'flex border-t border-border bg-[#fafcfb] p-4 md:flex-col md:border-t-0 md:border-l md:p-5'
const RAIL_OUT = `${BTN_OUT} h-11 rounded-full px-5 text-[14px] font-medium md:w-full`

function RoomCard({ offer, hotel, stay, onPick, onOtherDates }: { offer: RoomOffer; hotel: RoomsHotel; stay: Stay; onPick: (p?: PlanOffer) => void; onOtherDates: () => void }) {
  const t = useTranslations()
  const locale = useLocale()
  const { room, state, left, occ, plans } = offer
  const [planId, setPlanId] = useState<string>()
  const off = state === 'sold_out' || state === 'too_small'
  const href = roomHref(hotel.slug, room.slug, stay)
  // Mặc định gói rẻ nhất; nhiều gói thì khách chọn ngay trong cột giá.
  const plan = plans.find(p => p.rate_plan_id === planId) ?? [...plans].sort((a, b) => a.total - b.total)[0]

  return (
    <article className="group grid overflow-hidden rounded-2xl border border-border bg-white transition-[border-color,box-shadow] duration-200 hover:border-border-strong hover:shadow-[0_8px_24px_-16px_rgba(6,87,73,0.35)] md:grid-cols-[232px_minmax(0,1fr)_240px]">
      <Link href={href} tabIndex={-1} aria-hidden className="relative block overflow-hidden">
        <Photo src={room.images[0]} alt={room.name} sizes="(min-width: 768px) 232px, 100vw"
          className={cn('h-52 w-full transition-transform duration-500 ease-out group-hover:scale-[1.035] md:h-full md:min-h-[232px]', off && 'opacity-60 grayscale-[.6]')} />
        {room.images.length > 0 && (
          <span className="absolute bottom-3 left-3 inline-flex h-7 items-center gap-1.5 rounded-full bg-white/95 px-2.5 text-[12px] font-semibold text-foreground">
            <Images className="size-3.5" aria-hidden />{t('Rooms.photos', { n: room.images.length })}
          </span>
        )}
      </Link>

      <div className="flex min-w-0 flex-col gap-2 p-4 md:px-5 md:py-5">
        <h3 className="text-[20px] leading-tight font-bold md:text-[22px]">
          <Link href={href} className={cn('decoration-1 underline-offset-4 hover:underline', off ? 'text-muted-foreground' : 'text-brand')}>{room.name}</Link>
        </h3>
        <p className="flex flex-wrap gap-x-1.5 text-[13px] leading-relaxed text-muted-foreground">
          {[room.size, room.view, occ?.adults ? t('Common.capacity', { adults: occ.adults, children: occ.children }) : null].filter(Boolean).join(' · ')}
        </p>
        <p className={cn('mt-1 text-[14px] leading-relaxed', off ? 'text-muted-foreground' : 'text-foreground/85')}>{room.description}</p>
        {room.note && <p className="flex gap-2 text-[13px] text-muted-foreground"><Info className="mt-0.5 size-4 shrink-0 text-orange" aria-hidden />{room.note}</p>}
        {room.features.length > 0 && (
          <ul className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-1.5 text-[13px]">
            {room.features.map(f => <li key={f} className="inline-flex items-center gap-1.5"><Check className="size-3.5 text-brand-accent" strokeWidth={2.6} aria-hidden />{f}</li>)}
          </ul>
        )}
      </div>

      {state === 'available' && plan ? (
        <div className={cn(RAIL, plans.length > 1 ? 'flex-wrap' : 'flex-nowrap', 'items-end justify-between gap-x-3 gap-y-3 md:flex-nowrap md:items-stretch md:justify-start md:gap-0')}>
          {plans.length > 1 ? (
            <fieldset className="w-full">
              <legend className="mb-2 text-[12px] text-muted-foreground">{t('Rooms.plansCount', { n: plans.length })}</legend>
              <div className="grid gap-2">
                {plans.map(p => (
                  <label key={p.rate_plan_id} className={cn('flex cursor-pointer items-start gap-2.5 rounded-xl border bg-white px-3 py-2.5', p === plan ? 'border-brand ring-1 ring-brand' : 'border-border hover:border-border-strong')}>
                    <input type="radio" name={`plan-${room.slug}`} checked={p === plan} onChange={() => setPlanId(p.rate_plan_id)} className="mt-1 accent-brand" />
                    <span className="min-w-0"><span className="block text-[13px] font-semibold">{p.title}{p.has_breakfast ? ` · ${t('Rooms.breakfast')}` : ''}</span><span className="text-[14px] font-bold tabular-nums">{fmtPrice(nightly(p))}<span className="text-[12px] font-normal text-muted-foreground"> {t('Common.perNight')}</span></span></span>
                  </label>
                ))}
              </div>
            </fieldset>
          ) : (
            <div className="flex w-full items-center justify-between gap-2 max-md:hidden">
              <span className="inline-flex h-6 items-center rounded-full border border-[#d5e2de] bg-white px-2.5 text-[12px] font-medium">{plan.title}{plan.has_breakfast ? ` · ${t('Rooms.breakfast')}` : ''}</span>
              {left <= 3 && <span className="text-[12px] font-semibold whitespace-nowrap text-orange">{t('Rooms.lowStock', { n: left })}</span>}
            </div>
          )}
          <div className="min-w-0 md:mt-auto md:pt-4">
            <p className="text-[12px] text-muted-foreground max-md:hidden">{t('Rooms.perNightLabel')}</p>
            <p className="text-[20px] leading-tight font-bold tracking-tight whitespace-nowrap text-brand tabular-nums md:mt-0.5 md:text-[26px]">
              {fmtPrice(nightly(plan))}<span className="text-[12px] font-normal tracking-normal text-muted-foreground md:hidden"> {t('Common.perNight')}</span>
            </p>
            <p className="mt-1 text-[12px] whitespace-nowrap text-muted-foreground tabular-nums">
              {t.rich('Rooms.totalLine', { total: fmtPrice(plan.total), nights: t('Common.nights', { n: plan.days_breakdown.length }), b: c => <b className="font-semibold text-foreground">{c}</b> })}
            </p>
            {left <= 3 && <p className="mt-0.5 text-[12px] font-semibold text-orange md:hidden">{t('Rooms.lowStock', { n: left })}</p>}
          </div>
          <div className="shrink-0 md:mt-3.5">
            <Link href={roomHref(hotel.slug, room.slug, stay, plan.rate_plan_id)}
              className="group/cta inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-brand px-4 text-[14px] md:h-[46px] md:px-6 md:text-[15px] font-semibold tracking-[0.01em] text-white transition-[background-color,box-shadow] duration-200 hover:bg-[#04443a] hover:shadow-[0_6px_16px_-8px_rgba(6,87,73,0.6)]">
              {t('Rooms.choose')}<ArrowRight className="size-4 transition-transform duration-200 group-hover/cta:translate-x-[3px]" strokeWidth={2.2} aria-hidden />
            </Link>
            <p className="mt-2.5 hidden items-center justify-center gap-1.5 text-[12px] whitespace-nowrap text-foreground/80 md:flex"><ShieldCheck className="size-3.5 text-brand-accent" aria-hidden />{t('Room.noChargeYet')}</p>
          </div>
        </div>
      ) : state === 'sold_out' || state === 'too_small' ? (
        <div className={cn(RAIL, 'items-center justify-between gap-3 md:items-stretch md:justify-start md:gap-1.5')}>
          <div className="min-w-0">
            <p className="text-[15px] font-semibold">{state === 'sold_out' ? t('Rooms.soldOutShort') : t('Rooms.notFitShort')}</p>
            <p className="text-[13px] text-muted-foreground tabular-nums">
              {state === 'sold_out' ? fmtRange(stay.checkin, stay.checkout, locale) : occ && t('Rooms.roomMaxShort', { max: t('Common.guests', { adults: occ.adults, children: occ.children }) })}
            </p>
          </div>
          <button type="button" onClick={onOtherDates} className={cn(RAIL_OUT, 'md:mt-auto')}>{state === 'sold_out' ? t('Rooms.otherDates') : t('Rooms.changeGuests')}</button>
        </div>
      ) : (
        <div className={cn(RAIL, 'items-center justify-between gap-3 md:items-stretch md:justify-start md:gap-1.5')}>
          <div className="min-w-0">
            <p className="text-[15px] font-semibold">{t('Rooms.byDate')}</p>
            <p className="text-[13px] leading-snug text-muted-foreground">{t('Rooms.byDateBody')}</p>
          </div>
          <button type="button" onClick={() => onPick()} className={cn(RAIL_OUT, 'md:mt-auto')}>{t('Rooms.book')}</button>
        </div>
      )}
    </article>
  )
}

/** Tóm tắt lựa chọn + kênh liên hệ của khách sạn. Không tạo đặt phòng — nhân viên khách sạn xác nhận qua Zalo / email. */
export function ContactDialog({ hotel, stay, picked, contact, onClose }: { hotel: RoomsHotel; stay: Stay; picked?: Pick; contact: Contact; onClose: () => void }) {
  const t = useTranslations()
  const locale = useLocale()
  const rows: [string, string][] = picked ? [
    [t('Rooms.rowHotel'), hotel.name],
    [t('Rooms.rowRoom'), picked.room.name],
    ...(picked.plan ? [[t('Rooms.rowPlan'), picked.plan.has_breakfast ? `${picked.plan.title} · ${t('Rooms.breakfast')}` : picked.plan.title] as [string, string]] : []),
    [t('Rooms.rowDates'), `${fmtRange(stay.checkin, stay.checkout, locale)} · ${t('Common.nights', { n: diffDays(stay.checkin, stay.checkout) })}`],
    [t('Rooms.rowGuests'), t('Common.guests', { adults: stay.adults, children: stay.children })],
    ...(picked.plan ? [[t('Rooms.rowTotal'), fmtPrice(picked.plan.total)] as [string, string]] : []),
  ] : []
  const mail = `mailto:${contact.email}?${new URLSearchParams({ subject: t('Rooms.mailSubject', { hotel: hotel.name }), body: rows.map(([k, v]) => `${k}: ${v}`).join('\n') }).toString().replace(/\+/g, '%20')}`
  return (
    <Dialog open={!!picked} onClose={onClose} title={t('Rooms.contactTitle')}
      footer={<><button type="button" onClick={onClose} className={BTN_OUT}>{t('Rooms.back')}</button><a href={contact.zalo} target="_blank" rel="noopener" className={BTN}><MessageCircle className="size-4" aria-hidden />{t('Rooms.zalo')}</a></>}>
      {picked && (
        <>
          <dl className="divide-y divide-border rounded-xl border border-border">
            {rows.map(([k, v]) => <div key={k} className="grid gap-1 px-4 py-3 sm:grid-cols-[120px_1fr] sm:gap-4"><dt className="text-[14px] text-muted-foreground">{k}</dt><dd className="text-[15px] font-medium">{v}</dd></div>)}
          </dl>
          <p className="mt-4 text-[14px] text-muted-foreground">{t('Rooms.contactNote')}</p>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
            <a href={`tel:${contact.phone}`} className="inline-flex min-h-10 items-center gap-1.5 text-[15px] font-semibold text-primary hover:underline"><Phone className="size-4" aria-hidden />{contact.phone_display}</a>
            <a href={mail} className="inline-flex min-h-10 items-center gap-1.5 text-[15px] font-semibold text-primary hover:underline"><Mail className="size-4" aria-hidden />{contact.email}</a>
          </div>
        </>
      )}
    </Dialog>
  )
}

'use client'
// Khối "Chọn phòng": nội dung từng hạng phòng (Rooty) + phòng trống, giá từng đêm (Gohost, qua /api/hotels/{slug}/rooms).
// Trạng thái: đang tải · có giá · hết phòng · không đủ chỗ · chưa có giá trực tuyến (chưa nối Gohost, lỗi, hết lượt gọi).
// Phòng có giá: chọn gói ngay trên card, "Đặt phòng này" sang luồng đặt phòng (bản minh hoạ); tên/ảnh dẫn sang trang chi tiết phòng.
// Chưa có giá trực tuyến: nút "Liên hệ đặt phòng" mở hộp tóm tắt + Zalo / gọi / email — không ghi dữ liệu nào.
import { useState } from 'react'
import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import { ArrowRight, CalendarDays, CalendarX, Coffee, Flame, Focus, Info, Mail, MessageCircle, Phone, RotateCw, Users, WifiOff } from 'lucide-react'
import { cn } from 'cn'
import { diffDays, fmtPrice, fmtRange, today } from '@/lib/format'
import { mergeRooms, nightly, type RoomOffer } from '@/lib/rooms'
import type { IconKey } from '@/types/global'
import type { Contact, PlanOffer, Room, RoomAvailability, Stay } from '@/types/hotel'
import { useRoomAvailability } from '@/hooks/use-rooms'
import { Dialog } from '@/components/ui/overlay'
import { BTN, BTN_OUT, ICONS, Photo } from '@/components/site/kit'
import { DateRangeField, GuestsField } from '@/components/site/stay-fields'
import { firstCheckin } from '@/lib/stay'
import { roomHref, selectionQuery } from '@/lib/booking'
import { Link } from '@/i18n/navigation'
import { PhotoLightbox } from './gallery'
import { useStay } from './use-stay'

export interface RoomsHotel { slug: string; name: string; online: boolean; opening: string | null; cancel_summary: string; included: { icon: IconKey; label: string }[] }
type Result = { avail?: RoomAvailability[]; error?: boolean }
export type Pick = { room: Room; plan?: PlanOffer }

export function Rooms({ hotel, rooms, contact }: { hotel: RoomsHotel; rooms: Room[]; contact: Contact }) {
  const t = useTranslations()
  const locale = useLocale()
  const [stay, setStay] = useStay(hotel.opening)
  const [editing, setEditing] = useState(false)
  const [picked, setPicked] = useState<Pick>()
  const [photos, setPhotos] = useState<Room>()
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
              <RoomCard key={o.room.slug} offer={o} hotel={hotel} stay={stay} onPick={plan => setPicked({ room: o.room, plan })} onOtherDates={() => setEditing(true)} onPhotos={() => setPhotos(o.room)} />
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
      <PhotoLightbox name={photos?.name ?? ''} images={photos?.images ?? []} index={photos ? 0 : -1} onClose={() => setPhotos(undefined)} />
    </section>
  )
}

/** Card phòng liquid glass: ảnh của chính phòng làm quầng màu nền · ảnh rõ bên trái (nhãn kính, nút xem ảnh) ·
 *  tấm kính sáng bên phải (tên, đã gồm, gói giá chọn một) · thanh kính đậm chốt tổng tiền + "Đặt phòng này". */
function RoomCard({ offer, hotel, stay, onPick, onOtherDates, onPhotos }: { offer: RoomOffer; hotel: RoomsHotel; stay: Stay; onPick: (p?: PlanOffer) => void; onOtherDates: () => void; onPhotos: () => void }) {
  const t = useTranslations()
  const locale = useLocale()
  const { room, state, left, occ } = offer
  const off = state === 'sold_out' || state === 'too_small'
  const range = fmtRange(stay.checkin, stay.checkout, locale)
  const [planId, setPlanId] = useState<string>()
  const plan = offer.plans.find(p => p.rate_plan_id === planId) ?? offer.plans[0]
  const href = roomHref(hotel.slug, room.slug, stay)
  const cover = room.images[0]
  const tags = [room.size, room.view, room.features[0]].filter((x): x is string => !!x)
  const sub = [occ?.adults ? t('Common.capacity', { adults: occ.adults, children: occ.children }) : null, room.beds].filter(Boolean).join(' · ')
  return (
    <article className="relative isolate overflow-hidden rounded-[22px] border border-white/90 bg-mint shadow-[0_18px_40px_rgb(6_87_73/0.12)]">
      {cover && <Image src={cover} alt="" aria-hidden fill sizes="300px" className="pointer-events-none -z-10 scale-125 object-cover opacity-70 blur-[50px] saturate-150" />}
      <div className="absolute inset-0 -z-10 bg-[#f7fbf9]/35" />
      <div className="grid gap-2.5 p-2.5 md:grid-cols-[300px_minmax(0,1fr)]">
        <div className={cn('relative min-h-[240px] overflow-hidden rounded-2xl md:min-h-[340px]', off && 'opacity-60')}>
          <Link href={href} tabIndex={-1} aria-hidden className="absolute inset-0"><Photo src={cover} alt="" sizes="(min-width: 768px) 300px, 100vw" className="h-full w-full" /></Link>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[rgb(10_40_32/0.2)] via-transparent via-40% to-[rgb(10_40_32/0.55)]" />
          {tags.length > 0 && <div className="pointer-events-none absolute right-14 bottom-2.5 left-2.5 flex flex-wrap gap-1.5">{tags.map(x => <span key={x} className="glass-tag text-[10px] tracking-normal normal-case">{x}</span>)}</div>}
          {room.images.length > 0 && (
            <button type="button" onClick={onPhotos} aria-label={t('Rooms.viewPhotos', { name: room.name })} title={t('Rooms.viewPhotos', { name: room.name })}
              className="absolute right-2.5 bottom-2.5 grid size-10 cursor-pointer place-items-center rounded-full bg-white/90 text-brand shadow-[0_2px_8px_rgb(3_28_24/0.25)] transition-colors hover:bg-white">
              <Focus className="size-5" aria-hidden />
            </button>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-2.5">
          <div className="glass-light flex flex-1 flex-col gap-2.5 rounded-2xl p-4 sm:px-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-xl font-bold text-brand"><Link href={href} className="underline-offset-4 hover:underline">{room.name}</Link></h3>
                {sub && <p className="text-[13px] text-muted-foreground">{sub}</p>}
              </div>
              {state === 'available' && left <= 3 && <span className="inline-flex h-7 items-center gap-1 rounded-full bg-yellow px-2.5 text-[12px] font-semibold text-yellow-foreground"><Flame className="size-3.5" aria-hidden />{t('Rooms.lowStock', { n: left })}</span>}
            </div>
            <p className="line-clamp-2 text-[14px]">{room.description}</p>
            {hotel.included.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 text-[12px] text-brand">
                <b className="mr-0.5 font-semibold">{t('Rooms.included')}</b>
                {hotel.included.slice(0, 4).map(a => {
                  const Icon = ICONS[a.icon]
                  return <span key={a.label} className="inline-flex h-7 items-center gap-1.5 rounded-full bg-mint/90 px-2.5"><Icon className="size-3.5" aria-hidden />{a.label}</span>
                })}
              </div>
            )}
            {room.note && <p className="flex gap-2 rounded-lg bg-white/60 px-3 py-2 text-[13px]"><Info className="mt-0.5 size-3.5 shrink-0 text-orange" aria-hidden />{room.note}</p>}

            {state === 'sold_out' ? (
              <div className="mt-auto flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-border-strong bg-white/50 px-4 py-3">
                <p className="text-[14px] font-medium text-muted-foreground">{t('Rooms.soldOut', { range })}</p>
                <button type="button" onClick={onOtherDates} className={`${BTN_OUT} h-10`}>{t('Rooms.otherDates')}</button>
              </div>
            ) : state === 'too_small' && occ ? (
              <p className="mt-auto rounded-xl border border-dashed border-border-strong bg-white/50 px-4 py-3 text-[14px] text-muted-foreground">
                {t('Rooms.roomMax', { max: t('Common.guests', { adults: occ.adults, children: occ.children }), party: t('Common.guests', { adults: stay.adults, children: stay.children }) })}
              </p>
            ) : state === 'available' ? (
              <div role="radiogroup" aria-label={t('Rooms.plansCount', { n: offer.plans.length })} className="mt-auto grid gap-2">
                {offer.plans.map(p => {
                  const on = p === plan
                  return (
                    <button key={p.rate_plan_id} type="button" role="radio" aria-checked={on} onClick={() => setPlanId(p.rate_plan_id)}
                      className={cn('flex w-full cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-[background-color,box-shadow]',
                        on ? 'border-primary bg-white/95 shadow-[0_6px_16px_rgb(35_128_111/0.16)] ring-1 ring-primary' : 'border-border-strong/90 bg-white/50 hover:bg-white/80')}>
                      <span className={cn('grid size-[18px] shrink-0 place-items-center rounded-full border-2', on ? 'border-primary' : 'border-border-strong')} aria-hidden>{on && <span className="size-2 rounded-full bg-primary" />}</span>
                      <span className="min-w-0 flex-1">
                        <b className="block text-[14px] font-semibold">{p.title}</b>
                        {/* Chỉ ghi ăn sáng khi Gohost bật has_breakfast (PITO: Gohost tắt, PDF ghi có) — mục "Đã gồm" ở trên theo tài liệu khách sạn. */}
                        <span className="text-[12px] text-muted-foreground">{p.has_breakfast && <><Coffee className="mr-1 inline size-3" aria-hidden />{t('Rooms.breakfast')} · </>}{hotel.cancel_summary}</span>
                      </span>
                      <span className="text-right whitespace-nowrap"><b className="text-base font-bold text-brand">{fmtPrice(nightly(p))}</b><span className="text-[12px] text-muted-foreground"> {t('Common.perNight')}</span></span>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="mt-auto flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-border-strong bg-white/50 px-4 py-3">
                <p className="text-[14px] text-muted-foreground">{t('Rooms.askPrice')}</p>
                <button type="button" onClick={() => onPick()} className={`${BTN_OUT} h-10`}>{t('Rooms.book')}</button>
              </div>
            )}
          </div>

          {state === 'available' && plan && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/20 bg-[rgb(6_70_59/0.92)] bg-[linear-gradient(160deg,rgb(255_255_255/0.14),rgb(255_255_255/0.02))] py-2.5 pr-2.5 pl-4 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.3),0_10px_24px_rgb(6_70_59/0.28)] backdrop-blur-xl">
              <p className="min-w-0">
                <span className="block text-[12px] text-[#c8e8de]">{t('Common.nights', { n: plan.days_breakdown.length })} · {t('Common.guests', { adults: stay.adults, children: stay.children })}</span>
                <span className="text-[13px]">{t('Rooms.totalLabel')} <b className="ml-1 text-xl tabular-nums">{fmtPrice(plan.total)}</b></span>
              </p>
              <Link href={`/dat-phong?${selectionQuery({ hotel: hotel.slug, room: room.slug, plan: plan.rate_plan_id }, stay)}`}
                className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-[#f8d09c] px-4 text-[14px] font-bold whitespace-nowrap text-[#124b43] shadow-[inset_0_1px_0_rgb(255_255_255/0.7)] transition-colors hover:bg-[#fbe0bb] max-sm:w-full max-sm:justify-center">
                {t('Rooms.bookThis')}<ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

/** Tóm tắt lựa chọn + kênh liên hệ của khách sạn. Không tạo đặt phòng — nhân viên khách sạn xác nhận qua Zalo / email. */
export function ContactDialog({ hotel, stay, picked, contact, onClose }: { hotel: { name: string }; stay: Stay; picked?: Pick; contact: Contact; onClose: () => void }) {
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

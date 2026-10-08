'use client'
// Khối "Chọn phòng": nội dung từng hạng phòng (Rooty) + phòng trống, giá từng đêm (Gohost, qua /api/hotels/{slug}/rooms).
// Trạng thái: đang tải · có giá · hết phòng · không đủ chỗ · chưa có giá trực tuyến (chưa nối Gohost, lỗi, hết lượt gọi).
// Phòng có giá: ảnh, tên, nút "Chọn" dẫn sang trang chi tiết phòng (chọn sẵn gói) → luồng đặt phòng (bản minh hoạ).
// Chưa có giá trực tuyến: nút "Liên hệ đặt phòng" mở hộp tóm tắt + Zalo / gọi / email — không ghi dữ liệu nào.
import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { BedDouble, CalendarDays, CalendarX, Coffee, Eye, Flame, Info, Mail, Maximize2, MessageCircle, Phone, RotateCw, Users, WifiOff } from 'lucide-react'
import { cn } from 'cn'
import { diffDays, fmtPrice, fmtRange, today } from '@/lib/format'
import { mergeRooms, nightly, type RoomOffer } from '@/lib/rooms'
import type { Contact, PlanOffer, Room, RoomAvailability, Stay } from '@/lib/types'
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
      <h2 className="text-[26px] font-bold text-brand">{t('Rooms.title')}</h2>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-mint px-4 py-3">
        <p className="inline-flex flex-wrap items-center gap-x-2 text-[15px]">
          <CalendarDays className="size-4 text-brand" aria-hidden />
          <b className="font-semibold">{range}</b>
          <span className="hidden sm:inline" aria-hidden>·</span>
          <span className="whitespace-nowrap">{t('Common.nights', { n: nights })} · {party}</span>
        </p>
        <button type="button" onClick={() => setEditing(true)} className="inline-flex min-h-8 cursor-pointer items-center text-[15px] font-semibold text-brand underline underline-offset-4">{t('Rooms.change')}</button>
      </div>

      <div className="mt-6 grid gap-5" aria-live="polite" aria-busy={!ready}>
        {!ready ? (
          <div className="grid gap-5" role="status" aria-label={t('Rooms.loading')}>
            {[0, 1].map(i => (
              <div key={i} className="grid gap-5 rounded-2xl border border-border p-4 md:grid-cols-[260px_1fr]">
                <div className="aspect-[4/3] animate-pulse rounded-xl bg-muted" />
                <div className="space-y-3 py-1"><div className="h-6 w-1/2 animate-pulse rounded-md bg-muted" /><div className="h-4 w-2/3 animate-pulse rounded-md bg-muted" /><div className="h-14 animate-pulse rounded-lg bg-muted" /><div className="h-14 animate-pulse rounded-lg bg-muted" /></div>
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

function RoomCard({ offer, hotel, stay, onPick, onOtherDates }: { offer: RoomOffer; hotel: RoomsHotel; stay: Stay; onPick: (p?: PlanOffer) => void; onOtherDates: () => void }) {
  const t = useTranslations()
  const locale = useLocale()
  const { room, state, left, occ } = offer
  const off = state === 'sold_out' || state === 'too_small'
  const range = fmtRange(stay.checkin, stay.checkout, locale)
  return (
    <article className={cn('grid gap-5 rounded-2xl border border-border p-4 md:grid-cols-[260px_1fr]', off ? 'bg-muted/60' : 'bg-white')}>
      <Link href={roomHref(hotel.slug, room.slug, stay)} tabIndex={-1} aria-hidden className="block">
        <Photo src={room.images[0]} alt={room.name} sizes="(min-width: 768px) 260px, 100vw" className={cn('aspect-[4/3] w-full rounded-xl md:aspect-auto md:h-full md:min-h-[220px]', off && 'opacity-60')} />
      </Link>
      <div className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="text-xl font-bold text-brand"><Link href={roomHref(hotel.slug, room.slug, stay)} className="underline-offset-4 hover:underline">{room.name}</Link></h3>
          {state === 'available' && left <= 3 && <span className="inline-flex h-7 items-center gap-1 rounded-md bg-yellow px-2.5 text-[13px] font-semibold text-yellow-foreground"><Flame className="size-3.5" aria-hidden />{t('Rooms.lowStock', { n: left })}</span>}
        </div>
        <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-1.5 text-[14px] text-muted-foreground">
          <li className="inline-flex items-center gap-1.5"><Maximize2 className="size-4 shrink-0" aria-hidden />{room.size}</li>
          {room.beds && <li className="inline-flex items-center gap-1.5"><BedDouble className="size-4 shrink-0" aria-hidden />{room.beds}</li>}
          {room.view && <li className="inline-flex items-center gap-1.5"><Eye className="size-4 shrink-0" aria-hidden />{room.view}</li>}
          {occ?.adults ? <li className="inline-flex items-center gap-1.5"><Users className="size-4 shrink-0" aria-hidden />{t('Common.capacity', { adults: occ.adults, children: occ.children })}</li> : null}
        </ul>
        <p className="mt-2 text-[15px]">{room.description}</p>
        {room.features.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{room.features.map(a => <span key={a} className="inline-flex h-7 items-center rounded-md bg-mint px-2.5 text-[13px] text-brand">{a}</span>)}</div>}
        {room.note && <p className="mt-3 flex gap-2 rounded-lg bg-muted px-3 py-2 text-[14px]"><Info className="mt-0.5 size-4 shrink-0 text-orange" aria-hidden />{room.note}</p>}

        {state === 'sold_out' ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-border-strong px-4 py-3">
            <p className="text-[15px] font-medium text-muted-foreground">{t('Rooms.soldOut', { range })}</p>
            <button type="button" onClick={onOtherDates} className={`${BTN_OUT} h-10`}>{t('Rooms.otherDates')}</button>
          </div>
        ) : state === 'too_small' && occ ? (
          <p className="mt-4 rounded-xl border border-dashed border-border-strong px-4 py-3 text-[15px] text-muted-foreground">
            {t('Rooms.roomMax', { max: t('Common.guests', { adults: occ.adults, children: occ.children }), party: t('Common.guests', { adults: stay.adults, children: stay.children }) })}
          </p>
        ) : state === 'available' ? (
          <div className="mt-4 grid gap-2.5">
            {offer.plans.map(p => (
              <div key={p.rate_plan_id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-xl border border-border px-4 py-3">
                <div className="min-w-[190px] flex-1">
                  <p className="text-[15px] font-medium">{p.title}</p>
                  {/* Chỉ ghi khi Gohost bật has_breakfast. Cờ tắt chưa chắc là không có ăn sáng (PITO: Gohost tắt, PDF ghi có),
                      nên không in "Không gồm ăn sáng" — mục "Đã gồm" của trang đã nói theo tài liệu khách sạn. */}
                  {p.has_breakfast && (
                    <p className="inline-flex items-center gap-1.5 text-[14px] text-muted-foreground">
                      <Coffee className="size-3.5" aria-hidden />{t('Rooms.breakfast')}
                    </p>
                  )}
                  <p className="text-[13px] text-muted-foreground">{hotel.cancel_summary}</p>
                </div>
                <div className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-3 sm:ml-auto sm:w-auto sm:flex-nowrap sm:justify-end">
                  <p className="sm:text-right">
                    <span className="text-xl font-semibold">{fmtPrice(nightly(p))}</span><span className="text-[13px] text-muted-foreground"> {t('Common.perNight')}</span>
                    <span className="block text-[13px] whitespace-nowrap text-muted-foreground">{t('Rooms.total', { total: fmtPrice(p.total), nights: t('Common.nights', { n: p.days_breakdown.length }) })}</span>
                  </p>
                  <Link href={roomHref(hotel.slug, room.slug, stay, p.rate_plan_id)} className={`${BTN} h-10 max-sm:w-full`}>{t('Rooms.choose')}</Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-border-strong px-4 py-3">
            <p className="text-[15px] text-muted-foreground">{t('Rooms.askPrice')}</p>
            <button type="button" onClick={() => onPick()} className={`${BTN_OUT} h-10`}>{t('Rooms.book')}</button>
          </div>
        )}
      </div>
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

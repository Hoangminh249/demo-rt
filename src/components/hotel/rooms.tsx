'use client'
// Khối "Chọn phòng": nội dung từng hạng phòng (Rooty) + phòng trống, giá từng đêm (Gohost, qua /api/hotels/{slug}/rooms).
// Trạng thái: đang tải · có giá · hết phòng · không đủ chỗ · chưa có giá trực tuyến (chưa nối Gohost, lỗi, hết lượt gọi).
// Thẻ phòng ngang (ảnh lật được · tên · từng gói giá kèm "Book now"); bấm ảnh / "Thông tin phòng" mở dialog chi tiết —
// không còn trang chi tiết phòng riêng. `?room=&plan=` trên URL mở sẵn dialog (luồng đặt phòng quay lại).
// Dialog chỉ đóng bằng nút X (không đóng khi bấm nền hay Esc) — chốt với lãnh đạo 12/10/2026.
// Chưa có giá trực tuyến: nút "Liên hệ đặt phòng" mở hộp tóm tắt + Zalo / gọi / email — không ghi dữ liệu nào.
import { useState, type ReactNode } from 'react'
import { useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { CalendarDays, CalendarX, Check, ChevronLeft, ChevronRight, Coffee, Eye, Info, Mail, Maximize2, MessageCircle, Phone, RotateCw, Sparkles, Users, WifiOff, X, type LucideIcon } from 'lucide-react'
import { cn } from 'cn'
import { diffDays, fmtDayMonth, fmtPrice, fmtRange, fmtWeekday, today } from '@/lib/format'
import { mergeRooms, priceRuns, type RoomOffer } from '@/lib/rooms'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { IconKey } from '@/types/global'
import type { Contact, PlanOffer, Room, RoomAvailability, Stay } from '@/types/hotel'
import { useRoomAvailability } from '@/hooks/use-rooms'
import { Dialog } from '@/components/ui/overlay'
import { Dialog as UIDialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { BTN, BTN_OUT, Photo } from '@/components/site/kit'
import { DateRangeField, GuestsField } from '@/components/site/stay-fields'
import { firstCheckin } from '@/lib/stay'
import { selectionQuery } from '@/lib/booking'
import { Link } from '@/i18n/navigation'
import { useStay } from './use-stay'

export interface RoomsHotel {
  slug: string; name: string; online: boolean; opening: string | null; cancel_summary: string
  included: { icon: IconKey; label: string; desc?: string }[]; not_available: string[]
  checkin: string; checkout: string // 2 dòng đầu chính sách khách sạn (src/content luôn mở đầu bằng Nhận phòng, Trả phòng)
}
type Result = { avail?: RoomAvailability[]; error?: boolean }
export type Pick = { room: Room; plan?: PlanOffer }

const BOOK = 'inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-primary px-5 text-[14px] font-semibold whitespace-nowrap text-primary-foreground transition-colors hover:bg-primary-hover'
const UNDERLINE = 'cursor-pointer text-[13px] text-foreground underline decoration-border-strong underline-offset-4 transition-colors hover:text-primary hover:decoration-primary'
const NAV = 'absolute top-1/2 grid size-10 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-black/45 text-white transition-colors hover:bg-black/65'

export function Rooms({ hotel, rooms, contact }: { hotel: RoomsHotel; rooms: Room[]; contact: Contact }) {
  const t = useTranslations()
  const locale = useLocale()
  const sp = useSearchParams()
  const [stay, setStay] = useStay(hotel.opening)
  const [editing, setEditing] = useState(false)
  const [picked, setPicked] = useState<Pick>()
  const [open, setOpen] = useState(() => sp.get('room'))
  const nights = diffDays(stay.checkin, stay.checkout)
  const ages = stay.ages.filter(Boolean).map(a => (a === 1 ? t('Fields.ageMax1') : t('Fields.age', { n: a })))
  const party = t('Common.guests', { adults: stay.adults, children: stay.children }) + (ages.length ? ` (${ages.join(', ')})` : '')
  const range = fmtRange(stay.checkin, stay.checkout, locale)

  // Chỉ gọi lại khi đổi ngày (số khách tính "đủ chỗ" ngay trên trình duyệt, không tốn lượt gọi Gohost).
  const query = useRoomAvailability(hotel.slug, stay.checkin, stay.checkout, hotel.online)
  const ready: Result | undefined = !hotel.online ? { avail: [] } : query.isPending ? undefined : { avail: query.data, error: query.isError }
  const offers = ready?.avail ? mergeRooms(rooms, ready.avail, stay) : []
  const priced = offers.filter(o => o.state !== 'unmapped')
  const soldOut = priced.length > 0 && priced.every(o => o.state === 'sold_out')
  const noneFits = priced.length > 0 && priced.every(o => o.state === 'too_small')
  const offline = !hotel.online || ready?.error || (ready?.avail && priced.length === 0)
  const list = offers.length ? offers : rooms.map(room => ({ room, state: 'unmapped', left: 0, occ: null, plans: [] }) as RoomOffer)
  const current = list.find(o => o.room.slug === open)

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

      <div className="mt-6 grid gap-5" aria-live="polite" aria-busy={!ready}>
        {!ready ? (
          <div className="grid gap-5" role="status" aria-label={t('Rooms.loading')}>
            {[0, 1].map(i => (
              <div key={i} className="grid overflow-hidden rounded-[20px] border border-border md:grid-cols-[300px_minmax(0,1fr)]">
                <div className="h-56 animate-pulse bg-muted md:h-auto md:min-h-[260px]" />
                <div className="space-y-3 p-5"><div className="h-6 w-1/2 animate-pulse rounded-md bg-muted" /><div className="h-3 w-2/3 animate-pulse rounded bg-muted" /><div className="mt-8 h-10 animate-pulse rounded-full bg-muted" /><div className="h-10 animate-pulse rounded-full bg-muted" /></div>
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
            {list.map(o => (
              <RoomCard key={o.room.slug} offer={o} hotel={hotel} stay={stay} onOpen={() => setOpen(o.room.slug)} onPick={plan => setPicked({ room: o.room, plan })} onOtherDates={() => setEditing(true)} />
            ))}
            <p className="text-[12px] text-muted-foreground">
              {hotel.cancel_summary}. <Link href="/chinh-sach-huy" className="font-semibold text-primary underline-offset-4 hover:underline">{t('Rooms.cancelPolicy')}</Link>
            </p>
          </>
        )}
      </div>

      {current && (
        <RoomDialog key={current.room.slug} offer={current} hotel={hotel} stay={stay} party={party} initialPlan={sp.get('plan')}
          onClose={() => setOpen(null)} onEdit={() => setEditing(true)} onPick={plan => setPicked({ room: current.room, plan })} />
      )}

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

/** Ảnh lật được (nút trước/sau + chấm), ảnh đang xem là `i`. Bấm vào ảnh gọi `onOpen`. */
function Slides({ room, i, setI, onOpen, sizes, className, children }: { room: Room; i: number; setI: (i: number) => void; onOpen?: () => void; sizes: string; className?: string; children?: ReactNode }) {
  const t = useTranslations('Rooms')
  const n = room.images.length
  const photo = <Photo src={room.images[i]} alt={n ? `${room.name} — ${i + 1}/${n}` : room.name} sizes={sizes} className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.03]" />
  return (
    <div className={cn('relative overflow-hidden bg-muted', className)}>
      {onOpen ? <button type="button" onClick={onOpen} aria-label={t('roomInfo')} className="absolute inset-0 cursor-pointer">{photo}</button> : photo}
      {children}
      {n > 1 && (
        <>
          <button type="button" onClick={() => setI((i - 1 + n) % n)} aria-label={t('prevPhoto')} className={`${NAV} left-3`}><ChevronLeft className="size-5" aria-hidden /></button>
          <button type="button" onClick={() => setI((i + 1) % n)} aria-label={t('nextPhoto')} className={`${NAV} right-3`}><ChevronRight className="size-5" aria-hidden /></button>
          <span className="pointer-events-none absolute bottom-3.5 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/40 px-2.5 py-[7px]" aria-hidden>
            {room.images.map((_, j) => <span key={j} className={cn('size-1.5 rounded-full', j === i ? 'bg-white' : 'bg-white/50')} />)}
          </span>
        </>
      )}
    </div>
  )
}

/** Giá từng đêm của gói, đêm liền nhau cùng giá gộp một dòng ("12/10 – 13/10 · 2 đêm · đ 3,500,000/đêm").
 *  Giá mỗi đêm có thể khác nhau nên tổng là cộng từng đêm, không phải giá × số đêm. Cao tối đa ~7 dòng, dài hơn thì cuộn. */
function NightPrices({ p, className }: { p: PlanOffer; className?: string }) {
  const t = useTranslations('Common')
  const locale = useLocale()
  return (
    <dl className={cn('grid max-h-64 gap-2.5 overflow-y-auto text-[14px] tabular-nums', className)}>
      {priceRuns(p.days_breakdown).map(r => (
        <div key={r.from} className="flex items-baseline justify-between gap-3">
          <dt className="min-w-0">
            {r.nights > 1 ? `${fmtDayMonth(r.from, locale)} – ${fmtDayMonth(r.to, locale)}` : `${fmtWeekday(r.from, locale)}, ${fmtDayMonth(r.from, locale)}`}
            <span className="text-muted-foreground"> · {t('nights', { n: r.nights })}</span>
          </dt>
          <dd className="whitespace-nowrap">{fmtPrice(r.price)}<span className="text-[12px] text-muted-foreground">{t('perNight')}</span></dd>
        </div>
      ))}
    </dl>
  )
}

/** Một gói giá trên thẻ phòng: tổng tiền cả kỳ ở; "Chi tiết giá" bật ô nổi giá từng đêm (không đẩy dài thẻ). */
function PlanRow({ p, nights, href }: { p: PlanOffer; nights: string; href: string }) {
  const t = useTranslations()
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-5 gap-y-3 border-b border-border/70 px-5 py-4 last:border-b-0 @lg:grid-cols-[minmax(0,1fr)_auto_auto] sm:px-6">
      <p className="min-w-0 text-[15px] font-semibold">
        {p.title}
        {/* Chỉ ghi ăn sáng khi Gohost bật has_breakfast (PITO: Gohost tắt, PDF ghi có) — "Đã gồm" trong dialog theo tài liệu khách sạn. */}
        {p.has_breakfast && <span className="mt-0.5 flex items-center gap-1 text-[12px] font-normal text-muted-foreground"><Coffee className="size-3" aria-hidden />{t('Rooms.breakfast')}</span>}
      </p>
      <div className="text-right tabular-nums">
        <span className="block text-[12px] text-muted-foreground">{t('Rooms.totalFor', { nights })}</span>
        <b className="text-[18px] font-bold whitespace-nowrap">{fmtPrice(p.total)}</b>
        {p.days_breakdown.length > 1 && (
          <Popover>
            <PopoverTrigger className="block min-h-7 w-full cursor-pointer text-right text-[13px] text-primary underline-offset-4 hover:underline">{t('Rooms.priceDetail')}</PopoverTrigger>
            <PopoverContent align="end" collisionPadding={16} className="w-80 max-w-[calc(100vw-2rem)] gap-0 p-0">
              <p className="border-b border-border px-4 py-3 text-[13px] font-semibold">{p.title}</p>
              <NightPrices p={p} className="px-4 py-3" />
              <p className="flex items-baseline justify-between gap-3 border-t border-border px-4 py-3 tabular-nums">
                <span className="text-[13px] text-muted-foreground">{t('Rooms.totalFor', { nights })}</span><b className="text-[15px]">{fmtPrice(p.total)}</b>
              </p>
            </PopoverContent>
          </Popover>
        )}
      </div>
      <Link href={href} className={`${BOOK} col-span-2 @lg:col-span-1`}>{t('Rooms.bookNow')}</Link>
    </div>
  )
}

/** Thẻ phòng ngang: ảnh trái · tên + một câu + "Thông tin phòng" · mỗi gói giá một hàng kèm "Book now". */
function RoomCard({ offer, hotel, stay, onOpen, onPick, onOtherDates }: { offer: RoomOffer; hotel: RoomsHotel; stay: Stay; onOpen: () => void; onPick: (p?: PlanOffer) => void; onOtherDates: () => void }) {
  const t = useTranslations()
  const locale = useLocale()
  const { room, state, left } = offer
  const off = state === 'sold_out' || state === 'too_small'
  const nights = t('Common.nights', { n: diffDays(stay.checkin, stay.checkout) })
  const [img, setImg] = useState(0)
  return (
    <article className="group grid overflow-hidden rounded-[20px] border border-border bg-white shadow-[0_4px_14px_rgb(30_28_24/0.05)] transition-shadow hover:shadow-[0_18px_40px_rgb(30_28_24/0.12)] md:grid-cols-[300px_minmax(0,1fr)]">
      <Slides room={room} i={img} setI={setImg} onOpen={onOpen} sizes="(min-width: 768px) 300px, 100vw" className={cn('min-h-[240px] md:min-h-[260px]', off && 'opacity-60')}>
        {state === 'available' && left <= 3 && <span className="pointer-events-none absolute top-3.5 left-3.5 rounded-md bg-white px-2.5 py-1 text-[12px] font-semibold">{t('Rooms.lowStock', { n: left })}</span>}
      </Slides>

      {/* @container: hàng gói giá chia cột theo bề rộng thẻ (cột phải trang có thẻ giá nên thẻ phòng hẹp hơn màn hình). */}
      <div className="@container flex min-w-0 flex-col">
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h3 className="text-[20px] leading-snug font-semibold text-brand">{room.name}</h3>
            <p className="mt-0.5 line-clamp-2 text-[14px] text-muted-foreground">{room.tagline ?? room.description}</p>
          </div>
          <button type="button" onClick={onOpen} className={`${UNDERLINE} mt-1 shrink-0`}>{t('Rooms.roomInfo')}</button>
        </div>

        {state === 'available' ? (
          offer.plans.map(p => <PlanRow key={p.rate_plan_id} p={p} nights={nights} href={`/dat-phong?${selectionQuery({ hotel: hotel.slug, room: room.slug, plan: p.rate_plan_id }, stay)}`} />)
        ) : (
          <div className="flex flex-1 flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
            <p className="text-[14px] text-muted-foreground">
              {state === 'sold_out' ? t('Rooms.soldOut', { range: fmtRange(stay.checkin, stay.checkout, locale) })
                : state === 'too_small' && offer.occ ? t('Rooms.roomMax', { max: t('Common.guests', { adults: offer.occ.adults, children: offer.occ.children }), party: t('Common.guests', { adults: stay.adults, children: stay.children }) })
                : t('Rooms.askPrice')}
            </p>
            {state === 'sold_out' ? <button type="button" onClick={onOtherDates} className={`${BTN_OUT} h-10 rounded-full`}>{t('Rooms.otherDates')}</button>
              : state !== 'too_small' && <button type="button" onClick={() => onPick()} className={`${BTN_OUT} h-10 rounded-full`}>{t('Rooms.book')}</button>}
          </div>
        )}
      </div>
    </article>
  )
}

/** Chi tiết phòng: ảnh lớn + ảnh nhỏ · mô tả · thông số · đã gồm · khung đặt phòng (ngày, khách, gói, tổng, "Book now"). */
function RoomDialog({ offer, hotel, stay, party, initialPlan, onClose, onEdit, onPick }: {
  offer: RoomOffer; hotel: RoomsHotel; stay: Stay; party: string; initialPlan: string | null
  onClose: () => void; onEdit: () => void; onPick: (p?: PlanOffer) => void
}) {
  const t = useTranslations()
  const locale = useLocale()
  const { room, state, left, occ } = offer
  const [img, setImg] = useState(0)
  const [planId, setPlanId] = useState(initialPlan)
  const plan = offer.plans.find(p => p.rate_plan_id === planId) ?? offer.plans[0]
  const n = room.images.length
  const nights = diffDays(stay.checkin, stay.checkout)
  const vat = hotel.included.some(i => i.icon === 'receipt')
  const facts: [LucideIcon, string, string | undefined][] = [
    [Maximize2, t('Room.statSize'), room.size],
    [Eye, t('Room.statView'), room.view],
    [Users, t('Room.statCapacity'), occ?.adults ? t('Common.capacity', { adults: occ.adults, children: occ.children }) : room.beds],
    [Sparkles, t('Rooms.features'), room.features.join(' · ') || undefined],
  ]
  const block = (e: Event) => e.preventDefault()

  return (
    <UIDialog open onOpenChange={o => { if (!o) onClose() }}>
      <DialogContent showCloseButton={false} onInteractOutside={block} onEscapeKeyDown={block} aria-describedby={undefined}
        className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden rounded-2xl border border-border bg-white p-0 text-foreground ring-0 sm:max-w-6xl">
        <header className="flex items-center gap-4 border-b border-border py-3.5 pr-3.5 pl-5 sm:pl-7">
          <div className="min-w-0 flex-1">
            <p className="text-[13px] text-muted-foreground">{hotel.name}</p>
            <DialogTitle className="mt-0.5 text-[22px] leading-tight font-semibold text-brand">{room.name}</DialogTitle>
          </div>
          {state === 'available' && left <= 3 && <span className="hidden rounded-full bg-yellow px-3 py-1 text-[13px] font-semibold text-yellow-foreground sm:inline">{t('Rooms.lowStock', { n: left })}</span>}
          <DialogClose aria-label={t('Rooms.close')} className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full border border-border-strong bg-white transition-colors hover:bg-item-hover">
            <X className="size-5" aria-hidden />
          </DialogClose>
        </header>

        <div className="grid gap-6 overflow-y-auto p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex min-w-0 flex-col gap-5">
            <div className="grid gap-2">
              <Slides room={room} i={img} setI={setImg} sizes="(min-width: 1024px) 760px, 100vw" className="aspect-[3/2] rounded-2xl" />
              {n > 1 && (
                <div className="flex gap-2.5 overflow-x-auto">
                  {room.images.map((src, i) => (
                    <button key={src} type="button" onClick={() => setImg(i)} aria-label={t('Rooms.photoN', { n: i + 1 })} aria-pressed={i === img}
                      className={cn('relative h-[72px] w-28 shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 transition-opacity', i === img ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100')}>
                      <Photo src={src} alt="" sizes="112px" className="absolute inset-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-2">
              {room.tagline && <p className="text-[19px] leading-snug font-medium text-brand">{room.tagline}</p>}
              <p className="text-[15px] leading-relaxed">{room.description}</p>
            </div>

            <dl className="grid gap-x-8 gap-y-4 border-y border-border py-5 sm:grid-cols-2">
              {facts.filter((f): f is [LucideIcon, string, string] => !!f[2]).map(([Icon, k, v]) => (
                <div key={k} className="flex gap-3">
                  <Icon className="mt-0.5 size-5 shrink-0 text-primary" strokeWidth={1.75} aria-hidden />
                  <div className="min-w-0"><dt className="text-[12px] text-muted-foreground">{k}</dt><dd className="text-[15px] leading-snug font-medium">{v}</dd></div>
                </div>
              ))}
            </dl>

            {room.note && <p className="flex gap-2.5 rounded-xl bg-orange/[0.06] px-4 py-3 text-[14px] leading-relaxed"><Info className="mt-0.5 size-4 shrink-0 text-orange" aria-hidden />{room.note}</p>}

            {hotel.included.length > 0 && (
              <div className="grid gap-3.5 pt-1">
                <h3 className="text-[17px] font-semibold text-brand">{t('Rooms.includedAt', { hotel: hotel.name })}</h3>
                <ul className="grid gap-x-6 gap-y-3.5 sm:grid-cols-2">
                  {hotel.included.map(i => (
                    <li key={i.label} className="flex gap-2.5">
                      <Check className="mt-0.5 size-[18px] shrink-0 text-primary" aria-hidden />
                      <span className="min-w-0"><b className="block text-[14px] font-semibold">{i.label}</b>{i.desc && <span className="text-[13px] leading-snug text-muted-foreground">{i.desc}</span>}</span>
                    </li>
                  ))}
                </ul>
                {hotel.not_available.length > 0 && <p className="text-[13px] text-muted-foreground">{t('Rooms.notAvailable', { list: hotel.not_available.join(' · ') })}</p>}
              </div>
            )}
          </div>

          <aside aria-label={t('Rooms.yourStay')} className="flex flex-col gap-4 self-start">
            <div className="grid gap-4 rounded-2xl border border-border bg-muted/60 p-5">
              <div className="grid gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">{t('Rooms.yourStay')}</span>
                  <button type="button" onClick={onEdit} className="min-h-8 cursor-pointer text-[14px] font-semibold text-primary hover:underline">{t('Rooms.edit')}</button>
                </div>
                <p className="flex items-center gap-2 text-[14px] font-medium tabular-nums"><CalendarDays className="size-4 shrink-0 text-brand" aria-hidden />{fmtRange(stay.checkin, stay.checkout, locale)} · {t('Common.nights', { n: nights })}</p>
                <p className="flex items-center gap-2 text-[14px] font-medium"><Users className="size-4 shrink-0 text-brand" aria-hidden />{party}</p>
                <dl className="mt-1.5 grid grid-cols-2 gap-2">
                  {([[t('Booking.checkin'), hotel.checkin], [t('Booking.checkout'), hotel.checkout]] as const).map(([k, v]) => (
                    <div key={k} className="rounded-lg bg-white px-3 py-2"><dt className="text-[12px] text-muted-foreground">{k}</dt><dd className="text-[14px] font-semibold">{v}</dd></div>
                  ))}
                </dl>
              </div>

              {state === 'available' && plan ? (
                <>
                  <div role="radiogroup" aria-label={t('Rooms.choosePlan')} className="grid gap-2">
                    {offer.plans.map(p => {
                      const on = p === plan
                      return (
                        <button key={p.rate_plan_id} type="button" role="radio" aria-checked={on} onClick={() => setPlanId(p.rate_plan_id)}
                          className={cn('flex w-full cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-[background-color,box-shadow]',
                            on ? 'border-primary bg-white ring-1 ring-primary' : 'border-border-strong bg-white/60 hover:bg-white')}>
                          <span className={cn('grid size-[18px] shrink-0 place-items-center rounded-full border-2', on ? 'border-primary' : 'border-border-strong')} aria-hidden>{on && <span className="size-2 rounded-full bg-primary" />}</span>
                          <b className="min-w-0 flex-1 text-[14px] font-semibold">{p.title}</b>
                          <span className="text-right text-[14px] font-bold whitespace-nowrap text-brand">{fmtPrice(p.total)}<span className="block text-[11px] font-normal text-muted-foreground">{t('Rooms.totalFor', { nights: t('Common.nights', { n: nights }) })}</span></span>
                        </button>
                      )
                    })}
                  </div>
                  <div className="grid gap-2 border-t border-dashed border-border-strong pt-3.5 text-[14px]">
                    <NightPrices p={plan} />
                    {vat && <div className="flex justify-between gap-3"><span className="text-muted-foreground">{t('Rooms.serviceVat')}</span><span className="text-primary">{t('Rooms.includedShort')}</span></div>}
                  </div>
                </>
              ) : (
                <p className="text-[14px] text-muted-foreground">
                  {state === 'sold_out' ? t('Rooms.soldOut', { range: fmtRange(stay.checkin, stay.checkout, locale) })
                    : state === 'too_small' && occ ? t('Rooms.roomMax', { max: t('Common.guests', { adults: occ.adults, children: occ.children }), party })
                    : t('Rooms.askPrice')}
                </p>
              )}
            </div>

            {state === 'available' && plan ? (
              <div className="grid gap-3 px-1">
                <p className="flex items-baseline justify-between gap-3"><span className="text-[14px] text-muted-foreground">{t('Rooms.totalLabel')} {t('Common.nights', { n: nights })}</span><b className="text-[22px] font-bold tabular-nums">{fmtPrice(plan.total)}</b></p>
                <Link href={`/dat-phong?${selectionQuery({ hotel: hotel.slug, room: room.slug, plan: plan.rate_plan_id }, stay)}`} className={`${BOOK} h-11 w-full text-[15px]`}>{t('Rooms.bookNow')}</Link>
                <p className="text-[12px] leading-relaxed text-muted-foreground">{hotel.cancel_summary}. {t('Room.noChargeYet')}.</p>
              </div>
            ) : state === 'sold_out' || state === 'too_small' ? (
              <button type="button" onClick={onEdit} className={`${BTN_OUT} rounded-full`}>{state === 'sold_out' ? t('Rooms.otherDates') : t('Rooms.changeGuests')}</button>
            ) : (
              <button type="button" onClick={() => onPick()} className={`${BTN} rounded-full`}>{t('Rooms.book')}</button>
            )}
          </aside>
        </div>
      </DialogContent>
    </UIDialog>
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

'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { BedDouble, Check, Eye, Maximize2, Users, ChevronLeft, ChevronRight } from 'lucide-react'
import { repo } from '@/lib/repo'
import { useAsync } from '@/store/provider'
import { parseSearch, searchToParams, type SearchState } from '@/lib/search-params'
import { addDays, diffDays, dow, fmtDate, fmtMonth, fmtRange, TODAY } from '@/lib/format'
import { stockLevel } from '@/lib/inventory'
import { Button, buttonVariants } from '@/components/ui/button'
import { Breadcrumb, PageTitle, Photo, Skeleton, cn } from '../ui'
import { PromoCard, RoomOfferCard } from './cards'
import { Lightbox } from './hotel-view'
import { DateRangeField, GuestsField } from './stay-fields'
import Link from 'next/link'

export function RoomsView({ slug }: { slug: string }) {
  const s = parseSearch(useSearchParams())
  const hotel = useAsync(() => repo.getHotel(slug), [slug])
  const offers = useAsync(() => (hotel.data ? repo.hotelOffers(hotel.data.id, s) : Promise.resolve(null)), [hotel.data?.id, searchToParams(s)])
  const h = hotel.data
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <Breadcrumb items={[{ label: 'Trang chủ', href: '/' }, { label: 'Khách sạn', href: '/khach-san' }, { label: h?.name ?? '…', href: `/${slug}?${searchToParams({ ...s, dest: undefined })}` }, { label: 'Hạng phòng' }]} />
      <PageTitle title={`Hạng phòng · ${h?.name ?? ''}`} sub={`${fmtRange(s.checkin, s.checkout)} · giá theo ngày đã chọn`} />
      {!offers.data || !h ? <div className="space-y-4">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-64" />)}</div> : <div className="space-y-4">{offers.data.map(o => <RoomOfferCard key={o.rt.room_type_id} hotel={h} offer={o} s={s} />)}</div>}
    </div>
  )
}

const MONTHS = ['2026-10', '2026-11', '2026-12', '2027-01']

export function RoomView({ slug, roomSlug }: { slug: string; roomSlug: string }) {
  const sp = useSearchParams()
  const router = useRouter()
  const s = parseSearch(sp)
  const data = useAsync(() => repo.getRoom(slug, roomSlug), [slug, roomSlug])
  const offers = useAsync(() => (data.data ? repo.hotelOffers(data.data.hotel.id, s) : Promise.resolve(null)), [data.data?.hotel.id, sp.toString()])
  const [month, setMonth] = useState(s.checkin.slice(0, 7))
  const cal = useAsync(() => (data.data ? repo.priceCalendar(data.data.rt.room_type_id, month) : Promise.resolve(null)), [data.data?.rt.room_type_id, month])
  const [light, setLight] = useState<number | null>(null)
  if (!data.data) return <div className="mx-auto max-w-6xl space-y-4 px-4 py-8 sm:px-6"><Skeleton className="h-8 w-64" /><Skeleton className="aspect-[3/1]" /></div>
  const { hotel, rt } = data.data
  const offer = offers.data?.find(o => o.rt.room_type_id === rt.room_type_id)
  const images = [rt.image, ...hotel.gallery.slice(4, 7)].filter(Boolean)
  const nights = diffDays(s.checkin, s.checkout)
  const go = (p: Partial<SearchState>) => router.replace(`/${slug}/phong/${roomSlug}?${searchToParams({ ...s, ...p, dest: undefined })}`, { scroll: false })
  const first = cal.data?.[0]?.day
  const lead = first ? (dow(first) + 6) % 7 : 0 // lịch bắt đầu thứ Hai
  const hotelHref = `/${slug}?${searchToParams({ ...s, dest: undefined })}`

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <Breadcrumb items={[{ label: 'Trang chủ', href: '/' }, { label: hotel.name, href: hotelHref }, { label: 'Hạng phòng', href: `/${slug}/phong?${searchToParams({ ...s, dest: undefined })}` }, { label: rt.name }]} />
      <PageTitle title={rt.name} sub={<>{hotel.name} · {rt.view}</>} />

      <div className="grid gap-2 md:grid-cols-[2fr_1fr]">
        <button type="button" onClick={() => images.length && setLight(0)} aria-label="Mở ảnh phòng" className="overflow-hidden rounded-2xl"><Photo src={rt.image} alt={rt.name} className="aspect-[3/2]" sizes="(min-width:768px) 66vw, 100vw" priority /></button>
        <div className="hidden grid-rows-3 gap-2 md:grid">
          {hotel.gallery.slice(4, 7).map((src, i) => <button key={src} type="button" onClick={() => setLight(i + (rt.image ? 1 : 0))} aria-label={`Mở ảnh ${i + 2}`} className="overflow-hidden rounded-2xl"><Photo src={src} alt="" className="h-full" sizes="33vw" /></button>)}
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="min-w-0 space-y-10">
          <section>
            <ul className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              {[[Maximize2, `${rt.size_m2} m²`], [BedDouble, rt.beds], [Users, `${rt.max_adults} người lớn, ${rt.max_children} trẻ em`], [Eye, rt.view]].map(([Icon, t]) => {
                const I = Icon as typeof Eye
                return <li key={t as string} className="flex items-start gap-2 rounded-xl border border-border bg-card p-3"><I className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />{t as string}</li>
              })}
            </ul>
            <p className="mt-4 max-w-[75ch] leading-relaxed text-muted-foreground">{rt.description}</p>
          </section>
          <section>
            <h2 className="mb-4 text-lg font-semibold">Tiện nghi phòng</h2>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">{rt.amenities.map(a => <li key={a} className="flex items-center gap-2"><Check className="size-4 shrink-0 text-ok" aria-hidden />{a}</li>)}</ul>
          </section>
          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Lịch giá tháng {fmtMonth(month)}</h2>
              <div className="flex gap-1">
                <Button variant="outline" size="icon-sm" aria-label="Tháng trước" disabled={month === MONTHS[0]} onClick={() => setMonth(MONTHS[MONTHS.indexOf(month) - 1])}><ChevronLeft /></Button>
                <Button variant="outline" size="icon-sm" aria-label="Tháng sau" disabled={month === MONTHS.at(-1)} onClick={() => setMonth(MONTHS[MONTHS.indexOf(month) + 1])}><ChevronRight /></Button>
              </div>
            </div>
            <p className="mb-3 text-sm text-muted-foreground">Giá gói có ăn sáng mỗi đêm, triệu đồng. Bấm một ngày để nhận phòng ngày đó ({nights} đêm).</p>
            <div className="rounded-2xl border border-border bg-card p-3">
              <div className="grid grid-cols-7 gap-1 text-center">
                {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => <div key={d} className="py-1.5 text-xs font-medium text-muted-foreground">{d}</div>)}
                {Array.from({ length: lead }, (_, i) => <div key={`e${i}`} />)}
                {!cal.data ? Array.from({ length: 30 }, (_, i) => <Skeleton key={i} className="h-16" />) : cal.data.map(c => {
                  const lvl = stockLevel(c.left, rt.quantity)
                  const sel = c.day >= s.checkin && c.day < s.checkout
                  return (
                    <button key={c.day} type="button" disabled={c.past || c.left === 0} onClick={() => go({ checkin: c.day, checkout: addDays(c.day, nights) })}
                      className={cn('flex h-16 flex-col items-center justify-center rounded-xl text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40', sel ? 'bg-primary text-primary-foreground' : 'hover:bg-item-hover')}
                      aria-label={`${fmtDate(c.day)}: ${c.price.toLocaleString('vi-VN')}đ, còn ${c.left} phòng`} aria-pressed={sel}>
                      <span className={cn('text-sm', c.day === TODAY && 'font-semibold')}>{Number(c.day.slice(8))}</span>
                      <span className={cn('tabular-nums', sel ? 'text-primary-foreground/85' : 'text-muted-foreground')}>{(c.price / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 2 })}</span>
                      {!sel && lvl !== 'ok' && <span className={cn('font-medium', lvl === 'out' ? 'text-danger' : 'text-warn')}>{c.left ? `còn ${c.left}` : 'hết'}</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          </section>
        </div>
        <aside>
          <div className="sticky top-32 space-y-4">
            <div className="space-y-3 rounded-2xl border border-border bg-card p-4 sm:p-5">
              <DateRangeField id="room-dates" checkin={s.checkin} checkout={s.checkout} onChange={go} />
              <GuestsField id="room-guests" party={{ adults: s.adults, children: s.children, ages: s.ages, rooms: s.rooms }} onChange={go} />
            </div>
            {offer ? <RoomOfferCard hotel={hotel} offer={offer} s={s} compact /> : <Skeleton className="h-60" />}
            <Link href={hotelHref} className={cn(buttonVariants({ variant: 'ghost' }), 'w-full')}>Xem các hạng phòng khác</Link>
          </div>
        </aside>
      </div>
      <Lightbox key={light ?? -1} images={images} index={light} onClose={() => setLight(null)} title={rt.name} />
    </div>
  )
}

export function HotelPromos({ slug }: { slug: string }) {
  const hotel = useAsync(() => repo.getHotel(slug), [slug])
  const promos = useAsync(() => (hotel.data ? repo.listPromotions({ hotelId: hotel.data.id }) : Promise.resolve(null)), [hotel.data?.id])
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <Breadcrumb items={[{ label: 'Trang chủ', href: '/' }, { label: hotel.data?.name ?? '…', href: `/${slug}` }, { label: 'Ưu đãi' }]} />
      <PageTitle title={`Ưu đãi tại ${hotel.data?.name ?? ''}`} />
      {!promos.data ? <Skeleton className="h-72" /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {promos.data.map(p => {
            const checkin = p.min_advance_days ? addDays(TODAY, p.min_advance_days + 1) : undefined
            return (
              <div key={p.id} className="space-y-2">
                <PromoCard promo={p} />
                <Link href={`/${slug}?${searchToParams({ promo: p.slug, checkin, checkout: checkin ? addDays(checkin, p.min_nights ?? 3) : undefined } as Partial<SearchState>)}#phong`} className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}>Áp dụng & xem phòng</Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

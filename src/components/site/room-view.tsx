'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { BedDouble, Check, Eye, Ruler, Users, ChevronLeft, ChevronRight } from 'lucide-react'
import { repo } from '@/lib/repo'
import { useAsync } from '@/store/provider'
import { parseSearch, searchToParams, type SearchState } from '@/lib/search-params'
import { addDays, diffDays, dow, fmtDate, fmtMonth, fmtRange, TODAY } from '@/lib/format'
import { stockLevel } from '@/lib/inventory'
import { Badge, Breadcrumb, ButtonLink, Card, Photo, PageTitle, SkeletonList, cn } from '../ui'
import { PromoCard, RoomOfferCard } from './cards'
import { Lightbox } from './hotel-view'

export function RoomsView({ slug }: { slug: string }) {
  const s = parseSearch(useSearchParams())
  const hotel = useAsync(() => repo.getHotel(slug), [slug])
  const offers = useAsync(() => (hotel.data ? repo.hotelOffers(hotel.data.id, s) : Promise.resolve(null)), [hotel.data?.id, searchToParams(s)])
  const h = hotel.data
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <Breadcrumb items={[{ label: 'Trang chủ', href: '/' }, { label: 'Khách sạn & Resort', href: '/khach-san' }, { label: h?.name ?? '…', href: `/${slug}` }, { label: 'Phòng' }]} />
      <PageTitle title={`Hạng phòng ${h?.name ?? ''}`} sub={`${fmtRange(s.checkin, s.checkout)} · giá theo ngày đã chọn`} />
      {!offers.data || !h ? <SkeletonList /> : <div className="space-y-4">{offers.data.map(o => <RoomOfferCard key={o.rt.room_type_id} hotel={h} offer={o} s={s} />)}</div>}
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
  if (!data.data) return <div className="mx-auto max-w-6xl px-4 py-8"><SkeletonList /></div>
  const { hotel, rt } = data.data
  const offer = offers.data?.find(o => o.rt.room_type_id === rt.room_type_id)
  const images = [rt.image, ...hotel.gallery.slice(4, 7)]
  const nights = diffDays(s.checkin, s.checkout)
  const pickDay = (day: string) => router.replace(`/${slug}/phong/${roomSlug}?${searchToParams({ ...s, checkin: day, checkout: addDays(day, nights) })}`, { scroll: false })
  const first = cal.data?.[0]?.day
  const lead = first ? (dow(first) + 6) % 7 : 0 // lịch bắt đầu thứ 2

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <Breadcrumb items={[{ label: 'Trang chủ', href: '/' }, { label: 'Khách sạn & Resort', href: '/khach-san' }, { label: hotel.name, href: `/${slug}?${searchToParams({ ...s, dest: undefined })}` }, { label: 'Phòng', href: `/${slug}/phong?${searchToParams({ ...s, dest: undefined })}` }, { label: rt.name }]} />
      <h1 className="text-3xl font-bold">{rt.name}</h1>
      <p className="text-muted">{hotel.name} · {rt.view}</p>

      <div className="mt-4 grid gap-2 md:grid-cols-[2fr_1fr]">
        <button type="button" onClick={() => setLight(0)} aria-label="Mở ảnh phòng"><Photo src={images[0]} alt={rt.name} className="aspect-[3/2] rounded-xl" sizes="(min-width:768px) 66vw, 100vw" priority /></button>
        <div className="hidden grid-rows-3 gap-2 md:grid">
          {images.slice(1).map((src, i) => <button key={src} type="button" onClick={() => setLight(i + 1)} aria-label={`Mở ảnh ${i + 2}`}><Photo src={src} alt="" className="h-full rounded-xl" sizes="33vw" /></button>)}
        </div>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-8">
          <section>
            <ul className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <li className="flex items-center gap-2"><Ruler className="size-4 text-primary" />{rt.size_m2} m²</li>
              <li className="flex items-center gap-2"><BedDouble className="size-4 text-primary" />{rt.beds}</li>
              <li className="flex items-center gap-2"><Users className="size-4 text-primary" />{rt.max_adults} NL + {rt.max_children} TE</li>
              <li className="flex items-center gap-2"><Eye className="size-4 text-primary" />{rt.view}</li>
            </ul>
            <p className="mt-4 text-muted">{rt.description}</p>
          </section>
          <section>
            <h2 className="mb-3 text-lg font-bold">Tiện nghi phòng</h2>
            <ul className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">{rt.amenities.map(a => <li key={a} className="flex items-center gap-2"><Check className="size-4 text-ok" />{a}</li>)}</ul>
          </section>
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Lịch giá tháng {fmtMonth(month)}</h2>
              <div className="flex gap-1">
                <button type="button" aria-label="Tháng trước" disabled={month === MONTHS[0]} onClick={() => setMonth(MONTHS[MONTHS.indexOf(month) - 1])} className="rounded-md border border-border p-1.5 disabled:opacity-40"><ChevronLeft className="size-4" /></button>
                <button type="button" aria-label="Tháng sau" disabled={month === MONTHS.at(-1)} onClick={() => setMonth(MONTHS[MONTHS.indexOf(month) + 1])} className="rounded-md border border-border p-1.5 disabled:opacity-40"><ChevronRight className="size-4" /></button>
              </div>
            </div>
            <p className="mb-2 text-xs text-muted">Giá gói ăn sáng / đêm · số phòng còn. Bấm một ngày để đặt nhận phòng ({nights} đêm).</p>
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => <div key={d} className="py-1 font-semibold text-muted">{d}</div>)}
              {Array.from({ length: lead }, (_, i) => <div key={`e${i}`} />)}
              {(cal.data ?? []).map(c => {
                const lvl = stockLevel(c.left, rt.quantity)
                const sel = c.day >= s.checkin && c.day < s.checkout
                return (
                  <button key={c.day} type="button" disabled={c.past || c.left === 0} onClick={() => pickDay(c.day)}
                    className={cn('rounded-lg border p-1 disabled:opacity-40', sel ? 'border-primary bg-mint' : 'border-border bg-surface hover:border-primary')}
                    aria-label={`${fmtDate(c.day)}: ${c.price.toLocaleString('vi-VN')}đ, còn ${c.left} phòng`}>
                    <span className="block font-semibold">{Number(c.day.slice(8))}</span>
                    <span className="block text-[10px] text-muted">{(c.price / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 2 })}tr</span>
                    <span className={cn('block text-[10px] font-medium', lvl === 'out' ? 'text-danger' : lvl === 'low' ? 'text-warn' : 'text-ok')}>{c.left ? `còn ${c.left}` : 'hết'}</span>
                  </button>
                )
              })}
            </div>
          </section>
        </div>
        <aside>
          <div className="sticky top-32 space-y-3">
            <Card className="p-4">
              <p className="text-sm text-muted">{fmtRange(s.checkin, s.checkout)} · {nights} đêm · {s.rooms} phòng</p>
              {offer && <Badge tone={offer.left >= s.rooms ? (stockLevel(offer.left, rt.quantity) === 'low' ? 'warn' : 'ok') : 'danger'} className="mt-1">{offer.left} phòng còn trống</Badge>}
            </Card>
            {offer ? <RoomOfferCard hotel={hotel} offer={offer} s={s} compact /> : <SkeletonList rows={1} />}
            {s.checkin < TODAY && <p className="text-xs text-danger">Ngày đã qua</p>}
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
    <div className="mx-auto max-w-6xl px-4 py-6">
      <Breadcrumb items={[{ label: 'Trang chủ', href: '/' }, { label: hotel.data?.name ?? '…', href: `/${slug}` }, { label: 'Ưu đãi' }]} />
      <PageTitle title={`Ưu đãi tại ${hotel.data?.name ?? ''}`} />
      {!promos.data ? <SkeletonList /> : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {promos.data.map(p => (
            <div key={p.id} className="space-y-2">
              <PromoCard promo={p} />
              <ButtonLink href={`/${slug}?${searchToParams({ promo: p.slug, checkin: p.min_advance_days ? addDays(TODAY, p.min_advance_days + 1) : undefined, checkout: p.min_advance_days ? addDays(TODAY, p.min_advance_days + 1 + (p.min_nights ?? 3)) : undefined } as Partial<SearchState>)}#phong`} variant="secondary" className="w-full">Áp dụng & xem phòng</ButtonLink>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

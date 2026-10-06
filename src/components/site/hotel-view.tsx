'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MapPin, Phone, Check, ChevronLeft, ChevronRight, Utensils, Images, Car, Compass, Ship, ShieldCheck, BadgePercent } from 'lucide-react'
import { repo } from '@/lib/repo'
import { useAsync, useDemo } from '@/store/provider'
import { parseSearch, searchToParams, type SearchState } from '@/lib/search-params'
import { AREA_LABEL } from '@/lib/labels'
import { fmtRange, fmtVND, guestsLabel } from '@/lib/format'
import { Button, buttonVariants } from '@/components/ui/button'
import { Breadcrumb, Empty, Photo, Skeleton, Stars, cn } from '../ui'
import { Dialog } from '../ui/overlay'
import { PromoCard, RoomOfferCard } from './cards'
import { DateRangeField, GuestsField, type Party } from './stay-fields'

const TABS = [['tong-quan', 'Tổng quan'], ['phong', 'Phòng'], ['tien-ich', 'Tiện ích'], ['nha-hang', 'Nhà hàng'], ['trai-nghiem', 'Trải nghiệm'], ['gallery', 'Gallery'], ['chinh-sach', 'Chính sách'], ['uu-dai', 'Ưu đãi']] as const

export function Lightbox({ images, index, onClose, title }: { images: string[]; index: number | null; onClose: () => void; title: string }) {
  const [i, setI] = useState(index ?? 0) // parent đặt key theo index để mở đúng ảnh
  return (
    <Dialog open={index != null} onClose={onClose} title={`${title} · ảnh ${i + 1}/${images.length}`} wide>
      <div className="relative">
        <Photo src={images[i]} alt={`${title} ảnh ${i + 1}`} className="aspect-[3/2] rounded-xl" sizes="900px" />
        <Button variant="outline" size="icon" aria-label="Ảnh trước" onClick={() => setI((i - 1 + images.length) % images.length)} className="absolute top-1/2 left-3 -translate-y-1/2 rounded-full"><ChevronLeft /></Button>
        <Button variant="outline" size="icon" aria-label="Ảnh sau" onClick={() => setI((i + 1) % images.length)} className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full"><ChevronRight /></Button>
      </div>
      <div className="mt-3 grid grid-cols-8 gap-2">
        {images.map((src, k) => <button key={src} type="button" onClick={() => setI(k)} aria-label={`Ảnh ${k + 1}`} aria-current={k === i} className={cn('overflow-hidden rounded-lg', k === i ? 'ring-2 ring-primary ring-offset-2 ring-offset-card' : 'opacity-70 hover:opacity-100')}><Photo src={src} alt="" className="aspect-square" sizes="96px" /></button>)}
      </div>
    </Dialog>
  )
}

/** Khung đặt phòng: dính bên phải (desktop), sheet từ thanh dưới (mobile). */
function BookingCard({ s, onChange, fromPrice, onDone }: { s: SearchState; onChange: (p: Partial<SearchState>) => void; fromPrice?: number; onDone?: () => void }) {
  const party: Party = { adults: s.adults, children: s.children, ages: s.ages, rooms: s.rooms }
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">Giá từ</p>
        <p className="text-2xl font-semibold tabular-nums">{fromPrice ? fmtVND(fromPrice) : '—'}<span className="text-sm font-normal text-muted-foreground"> / đêm</span></p>
      </div>
      <DateRangeField id="bk-dates" checkin={s.checkin} checkout={s.checkout} onChange={onChange} />
      <GuestsField id="bk-guests" party={party} onChange={onChange} />
      <a href="#phong" onClick={onDone} className={cn(buttonVariants({ variant: 'default', size: 'lg' }), 'w-full')}>Xem phòng trống</a>
      <ul className="space-y-2 border-t border-border pt-4 text-sm text-muted-foreground">
        <li className="flex gap-2"><ShieldCheck className="size-4 shrink-0 text-ok" aria-hidden />Giá đặt trực tiếp, không phí ẩn</li>
        <li className="flex gap-2"><Car className="size-4 shrink-0 text-ok" aria-hidden />Thêm xe sân bay Rooty Trip khi đặt</li>
        <li className="flex gap-2"><BadgePercent className="size-4 shrink-0 text-ok" aria-hidden />Thành viên giảm thêm 5%</li>
      </ul>
    </div>
  )
}

export function HotelView({ slug }: { slug: string }) {
  const sp = useSearchParams()
  const router = useRouter()
  const s = parseSearch(sp)
  const { update } = useDemo()
  const hotel = useAsync(() => repo.getHotel(slug), [slug])
  const h = hotel.data
  const offers = useAsync(() => (h ? repo.hotelOffers(h.id, s) : Promise.resolve(null)), [h?.id, sp.toString()])
  const promos = useAsync(() => (h ? repo.listPromotions({ hotelId: h.id }) : Promise.resolve([])), [h?.id])
  const [light, setLight] = useState<number | null>(null)
  const [sheet, setSheet] = useState(false)

  useEffect(() => {
    update(o => ({ recent: [slug, ...o.recent.filter(x => x !== slug)].slice(0, 4) }))
  }, [slug, update])

  if (!h) return <div className="mx-auto max-w-7xl space-y-4 px-4 py-8 sm:px-6"><Skeleton className="h-8 w-72" /><Skeleton className="aspect-[3/1] w-full" /><Skeleton className="h-64" /></div>

  const change = (p: Partial<SearchState>) => router.replace(`/${slug}?${searchToParams({ ...s, ...p, dest: undefined })}`, { scroll: false })
  const fit = offers.data?.filter(o => o.fits) ?? []
  const sellable = fit.filter(o => o.left >= s.rooms)
  const fromPrice = sellable.length ? Math.min(...sellable.flatMap(o => o.plans.map(p => p.nightly))) : undefined

  return (
    <div className="pb-24 lg:pb-0">
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <Breadcrumb items={[{ label: 'Trang chủ', href: '/' }, { label: 'Khách sạn', href: '/khach-san' }, { label: h.name }]} />
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground"><Stars n={h.stars} /><span className="flex items-center gap-1"><MapPin className="size-3.5" aria-hidden />{AREA_LABEL[h.area]} · {h.address}</span></div>
            <h1 className="mt-1 text-2xl font-semibold text-foreground sm:text-3xl">{h.name}</h1>
          </div>
          <a href={`tel:${h.phone.replace(/\s/g, '')}`} className="flex min-h-8 items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><Phone className="size-4" aria-hidden />{h.phone}</a>
        </div>

        <div className="relative mt-5 grid h-64 grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-2xl sm:h-[420px]">
          {h.gallery.slice(0, 5).map((src, i) => (
            <button key={src} type="button" onClick={() => setLight(i)} aria-label={`Mở ảnh ${i + 1}`} className={cn('relative', i === 0 ? 'col-span-4 row-span-2 md:col-span-2' : 'hidden md:block')}>
              <Photo src={src} alt={`${h.name} ảnh ${i + 1}`} className="absolute inset-0 transition-opacity hover:opacity-90" sizes="(min-width:768px) 50vw, 100vw" priority={i === 0} />
            </button>
          ))}
          <Button variant="outline" size="sm" onClick={() => setLight(0)} className="absolute right-3 bottom-3"><Images aria-hidden />Xem {h.gallery.length} ảnh</Button>
        </div>
      </div>

      <nav aria-label="Mục trong trang" className="sticky top-[100px] z-30 mt-6 border-b border-border bg-background">
        <ul className="scrollbar-clean mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6">
          {TABS.map(([id, label]) => <li key={id}><a href={`#${id}`} className="inline-flex h-11 items-center border-b-2 border-transparent px-3 text-sm font-medium whitespace-nowrap text-muted-foreground hover:border-border-strong hover:text-foreground">{label}</a></li>)}
        </ul>
      </nav>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-12">
          <section id="tong-quan">
            <h2 className="text-lg font-semibold">{h.tagline}</h2>
            <p className="mt-3 max-w-[75ch] leading-relaxed text-muted-foreground">{h.description}</p>
            {/* Điểm khác biệt: hiện ngay trên trang KS, không chỉ ở bước dịch vụ thêm */}
            <div className="mt-6 grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-3 sm:p-5">
              {[[Car, 'Xe đón sân bay', 'Rooty Trip, 600.000đ/chiều'], [Compass, 'Tour đón tại sảnh', '4 đảo, Bắc đảo, câu mực'], [Ship, 'Du thuyền RIVUS', 'Cano riêng, hoàng hôn']].map(([Icon, t, d]) => {
                const I = Icon as typeof Car
                return <div key={t as string} className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground"><I className="size-5" aria-hidden /></span><span><span className="block text-sm font-semibold">{t as string}</span><span className="block text-sm text-muted-foreground">{d as string}</span></span></div>
              })}
              <p className="text-sm text-muted-foreground sm:col-span-3">Đặt cùng phòng ở bước <b className="font-medium text-foreground">Dịch vụ thêm</b>, thanh toán một lần — kèm xe + tour được ưu đãi Package −12%.</p>
            </div>
          </section>

          <section id="phong" className="scroll-mt-40">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold">Chọn phòng</h2>
                <p className="text-sm text-muted-foreground">{fmtRange(s.checkin, s.checkout)} · {guestsLabel(s.adults, s.children)} · {s.rooms} phòng</p>
              </div>
              <Link href={`/${slug}/phong?${searchToParams({ ...s, dest: undefined })}`} className="h-8 text-sm font-medium text-foreground/70 hover:text-foreground hover:underline">Tất cả hạng phòng</Link>
            </div>
            {!offers.data ? <div className="space-y-4">{Array.from({ length: 2 }, (_, i) => <Skeleton key={i} className="h-64" />)}</div> : sellable.length === 0 ? (
              <Empty title="Hết phòng phù hợp cho ngày đã chọn">
                Đổi ngày ở khung đặt phòng, hoặc <Link href={`/tim-kiem?${searchToParams({ ...s, dest: '' })}`} className="font-medium text-foreground underline">xem khách sạn khác còn phòng</Link>.
              </Empty>
            ) : <div className={cn('space-y-4 transition-opacity', offers.loading && 'opacity-60')}>{fit.map(o => <RoomOfferCard key={o.rt.room_type_id} hotel={h} offer={o} s={s} />)}</div>}
          </section>

          <section id="tien-ich" className="scroll-mt-40">
            <h2 className="mb-4 text-lg font-semibold">Tiện ích</h2>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">{h.amenities.map(a => <li key={a} className="flex items-center gap-2"><Check className="size-4 shrink-0 text-ok" aria-hidden />{a}</li>)}</ul>
          </section>

          <section id="nha-hang" className="scroll-mt-40">
            <h2 className="mb-4 text-lg font-semibold">Nhà hàng & bar</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {h.restaurants.map(r => (
                <div key={r.name} className="flex gap-3 rounded-2xl border border-border bg-card p-4 sm:p-5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground"><Utensils className="size-5" aria-hidden /></span>
                  <div className="min-w-0"><p className="text-base font-semibold">{r.name}</p><p className="text-sm text-muted-foreground">{r.cuisine} · {r.hours}</p><p className="mt-1 text-sm">{r.desc}</p></div>
                </div>
              ))}
            </div>
          </section>

          <section id="trai-nghiem" className="scroll-mt-40">
            <h2 className="mb-4 text-lg font-semibold">Trải nghiệm quanh khách sạn</h2>
            <div className="divide-y divide-border rounded-2xl border border-border bg-card">
              {h.experiences.map(e => <div key={e.name} className="px-4 py-3 sm:px-5"><p className="text-sm font-medium">{e.name}</p><p className="text-sm text-muted-foreground">{e.desc}</p></div>)}
            </div>
          </section>

          <section id="gallery" className="scroll-mt-40">
            <h2 className="mb-4 text-lg font-semibold">Gallery</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {h.gallery.map((src, i) => <button key={src} type="button" onClick={() => setLight(i)} aria-label={`Mở ảnh ${i + 1}`} className="overflow-hidden rounded-xl"><Photo src={src} alt={`${h.name} ảnh ${i + 1}`} className="aspect-square transition-transform duration-500 hover:scale-[1.04]" sizes="(min-width:640px) 25vw, 50vw" /></button>)}
            </div>
          </section>

          <section id="chinh-sach" className="scroll-mt-40">
            <h2 className="mb-4 text-lg font-semibold">Chính sách</h2>
            <dl className="divide-y divide-border rounded-2xl border border-border bg-card text-sm">
              {[['Nhận phòng', h.policies.checkin], ['Trả phòng', h.policies.checkout], ['Huỷ phòng', h.policies.cancel], ['Trẻ em', h.policies.children], ['Thú cưng', h.policies.pets]].map(([k, v]) => (
                <div key={k} className="grid gap-1 px-4 py-3 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-4 sm:px-5"><dt className="text-muted-foreground">{k}</dt><dd>{v}</dd></div>
              ))}
            </dl>
          </section>

          <section id="uu-dai" className="scroll-mt-40">
            <h2 className="mb-4 text-lg font-semibold">Ưu đãi tại {h.name}</h2>
            <div className="grid gap-4 sm:grid-cols-2">{(promos.data ?? []).map(p => <PromoCard key={p.id} promo={p} />)}</div>
          </section>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-40 rounded-2xl border border-border bg-card p-5"><BookingCard s={s} onChange={change} fromPrice={fromPrice} /></div>
        </aside>
      </div>

      <div className="no-print fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-border bg-card px-4 py-3 lg:hidden">
        <button type="button" onClick={() => setSheet(true)} className="min-w-0 flex-1 text-left">
          <span className="block truncate text-xs text-muted-foreground underline-offset-2">{fmtRange(s.checkin, s.checkout)} · {guestsLabel(s.adults, s.children)} · Đổi</span>
          <span className="block font-semibold tabular-nums">{fromPrice ? `Từ ${fmtVND(fromPrice)} / đêm` : 'Hết phòng ngày này'}</span>
        </button>
        <a href="#phong" className={buttonVariants({ variant: 'default' })}>Chọn phòng</a>
      </div>
      <Dialog open={sheet} onClose={() => setSheet(false)} title="Ngày & khách" side="bottom">
        <BookingCard s={s} onChange={change} fromPrice={fromPrice} onDone={() => setSheet(false)} />
      </Dialog>

      <Lightbox key={light ?? -1} images={h.gallery} index={light} onClose={() => setLight(null)} title={h.name} />
    </div>
  )
}

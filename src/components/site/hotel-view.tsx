'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MapPin, Phone, Mail, Check, ChevronLeft, ChevronRight, Utensils, Clock, Baby, PawPrint, Ban, Images } from 'lucide-react'
import { repo } from '@/lib/repo'
import { useAsync, useDemo } from '@/store/provider'
import { parseSearch, searchToParams, type SearchState } from '@/lib/search-params'
import { AREA_LABEL } from '@/lib/labels'
import { addDays, diffDays, fmtRange, fmtVND, guestsLabel, TODAY } from '@/lib/format'
import { Breadcrumb, Button, ButtonLink, Card, Photo, Skeleton, SkeletonList, Stars, Empty, cn } from '../ui'
import { Dialog } from '../ui/overlay'
import { PromoCard, RoomOfferCard } from './cards'

const TABS = [
  ['tong-quan', 'Tổng quan'], ['phong', 'Phòng'], ['tien-ich', 'Tiện ích'], ['nha-hang', 'Nhà hàng'], ['trai-nghiem', 'Trải nghiệm'],
  ['gallery', 'Gallery'], ['chinh-sach', 'Chính sách'], ['uu-dai', 'Ưu đãi'], ['dat-phong', 'Đặt phòng'],
] as const

export function Lightbox({ images, index, onClose, title }: { images: string[]; index: number | null; onClose: () => void; title: string }) {
  const [i, setI] = useState(index ?? 0) // parent đặt key theo index để mở đúng ảnh
  return (
    <Dialog open={index != null} onClose={onClose} title={`${title} · ${i + 1}/${images.length}`} wide>
      <div className="relative">
        <Photo src={images[i]} alt={`${title} ảnh ${i + 1}`} className="aspect-[3/2] rounded-lg" sizes="900px" />
        <button type="button" aria-label="Ảnh trước" onClick={() => setI((i - 1 + images.length) % images.length)} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white"><ChevronLeft /></button>
        <button type="button" aria-label="Ảnh sau" onClick={() => setI((i + 1) % images.length)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white"><ChevronRight /></button>
      </div>
      <div className="mt-3 grid grid-cols-8 gap-1">
        {images.map((src, k) => <button key={src} type="button" onClick={() => setI(k)} aria-label={`Ảnh ${k + 1}`} className={cn('overflow-hidden rounded', k === i && 'ring-2 ring-primary')}><Photo src={src} alt="" className="aspect-square" sizes="80px" /></button>)}
      </div>
    </Dialog>
  )
}

/** Widget đặt phòng: dính bên phải (desktop), thanh dưới (mobile). Đổi ngày → cập nhật URL. */
function BookingWidget({ s, onChange, fromPrice }: { s: SearchState; onChange: (p: Partial<SearchState>) => void; fromPrice?: number }) {
  return (
    <Card className="space-y-3 p-4 shadow-sm">
      <p className="text-sm text-muted">Giá từ</p>
      <p className="text-2xl font-bold">{fromPrice ? fmtVND(fromPrice) : '—'}<span className="text-sm font-normal text-muted"> /đêm</span></p>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs font-medium text-muted">Nhận phòng<input type="date" min={TODAY} value={s.checkin} onChange={e => e.target.value && onChange({ checkin: e.target.value, checkout: s.checkout > e.target.value ? s.checkout : addDays(e.target.value, 1) })} className="mt-1 h-10 w-full rounded-lg border border-border bg-surface px-2 text-sm text-fg" /></label>
        <label className="text-xs font-medium text-muted">Trả phòng<input type="date" min={addDays(s.checkin, 1)} value={s.checkout} onChange={e => e.target.value && onChange({ checkout: e.target.value })} className="mt-1 h-10 w-full rounded-lg border border-border bg-surface px-2 text-sm text-fg" /></label>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {([['adults', 'Người lớn', 1, 8], ['children', 'Trẻ em', 0, 6], ['rooms', 'Phòng', 1, 6]] as const).map(([k, label, min, max]) => (
          <label key={k} className="text-xs font-medium text-muted">{label}
            <select value={s[k]} onChange={e => onChange({ [k]: Number(e.target.value), ...(k === 'children' ? { ages: Array(Number(e.target.value)).fill(6) } : {}) })} className="mt-1 h-10 w-full rounded-lg border border-border bg-surface px-2 text-sm text-fg">
              {Array.from({ length: max - min + 1 }, (_, n) => <option key={n} value={n + min}>{n + min}</option>)}
            </select>
          </label>
        ))}
      </div>
      <p className="text-xs text-muted">{diffDays(s.checkin, s.checkout)} đêm · {fmtRange(s.checkin, s.checkout)}</p>
      <ButtonLink href="#phong" className="w-full" size="lg">Xem phòng trống</ButtonLink>
      <p className="text-center text-xs text-muted">Đặt trực tiếp: giá tốt nhất · thêm xe sân bay & tour</p>
    </Card>
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

  useEffect(() => {
    update(o => ({ recent: [slug, ...o.recent.filter(x => x !== slug)].slice(0, 4) }))
  }, [slug, update])

  if (!h) return <div className="mx-auto max-w-7xl px-4 py-8"><Skeleton className="mb-4 h-8 w-1/3" /><Skeleton className="aspect-[3/1] w-full" /><SkeletonList className="mt-6" /></div>

  const change = (p: Partial<SearchState>) => router.replace(`/${slug}?${searchToParams({ ...s, ...p, dest: undefined })}`, { scroll: false })
  const sellable = offers.data?.filter(o => o.fits && o.left >= s.rooms) ?? []
  const fromPrice = sellable.length ? Math.min(...sellable.flatMap(o => o.plans.map(p => p.nightly))) : undefined

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 pb-28 lg:pb-6">
      <Breadcrumb items={[{ label: 'Trang chủ', href: '/' }, { label: 'Khách sạn & Resort', href: '/khach-san' }, { label: h.name }]} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Stars n={h.stars} />
          <h1 className="mt-1 text-3xl font-bold">{h.name}</h1>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted"><MapPin className="size-4" />{h.address} · {AREA_LABEL[h.area]}</p>
        </div>
        <p className="text-sm text-muted">rootyhospitality.com/<b className="text-fg">{h.slug}</b></p>
      </div>

      <div className="mt-4 grid h-[260px] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-2xl md:h-[400px]">
        {h.gallery.slice(0, 5).map((src, i) => (
          <button key={src} type="button" onClick={() => setLight(i)} aria-label={`Mở ảnh ${i + 1}`} className={cn('relative', i === 0 ? 'col-span-4 row-span-2 md:col-span-2' : 'hidden md:block')}>
            <Photo src={src} alt={`${h.name} ảnh ${i + 1}`} className="absolute inset-0" sizes="(min-width:768px) 50vw, 100vw" priority={i === 0} />
            {i === 4 && <span className="absolute inset-0 grid place-items-center bg-black/40 text-sm font-semibold text-white"><span className="flex items-center gap-1"><Images className="size-4" />+{h.gallery.length - 5} ảnh</span></span>}
          </button>
        ))}
      </div>

      <nav aria-label="Mục khách sạn" className="sticky top-[100px] z-30 -mx-4 mt-4 overflow-x-auto border-b border-border bg-bg/95 px-4 backdrop-blur">
        <ul className="flex gap-1 whitespace-nowrap">
          {TABS.map(([id, label]) => <li key={id}><a href={`#${id}`} className="inline-block border-b-2 border-transparent px-3 py-3 text-sm font-medium text-muted hover:border-primary hover:text-fg">{label}</a></li>)}
        </ul>
      </nav>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-12">
          <section id="tong-quan">
            <h2 className="text-xl font-bold">{h.tagline}</h2>
            <p className="mt-3 leading-relaxed text-muted">{h.description}</p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted"><span className="flex items-center gap-1"><Phone className="size-4" />{h.phone}</span><span className="flex items-center gap-1"><Mail className="size-4" />{h.email}</span></div>
          </section>

          <section id="phong">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <h2 className="text-xl font-bold">Phòng · {fmtRange(s.checkin, s.checkout)} · {guestsLabel(s.adults, s.children)}</h2>
              <Link href={`/${slug}/phong?${searchToParams({ ...s, dest: undefined })}`} className="text-sm text-primary hover:underline">Tất cả hạng phòng →</Link>
            </div>
            {!offers.data ? <SkeletonList /> : sellable.length === 0 ? (
              <Empty title="Hết phòng phù hợp cho ngày đã chọn">
                Thử đổi ngày ở khung đặt phòng hoặc <Link href={`/tim-kiem?${searchToParams({ ...s, dest: '' })}`} className="text-primary underline">xem khách sạn khác còn phòng</Link>.
              </Empty>
            ) : <div className={cn('space-y-4', offers.loading && 'opacity-60')}>{offers.data.filter(o => o.fits).map(o => <RoomOfferCard key={o.rt.room_type_id} hotel={h} offer={o} s={s} />)}</div>}
          </section>

          <section id="tien-ich">
            <h2 className="mb-3 text-xl font-bold">Tiện ích</h2>
            <ul className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">{h.amenities.map(a => <li key={a} className="flex items-center gap-2"><Check className="size-4 text-ok" />{a}</li>)}</ul>
          </section>

          <section id="nha-hang">
            <h2 className="mb-3 text-xl font-bold">Nhà hàng</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {h.restaurants.map(r => (
                <Card key={r.name} className="p-4"><p className="flex items-center gap-2 font-semibold"><Utensils className="size-4 text-primary" />{r.name}</p><p className="text-sm text-muted">{r.cuisine} · {r.hours}</p><p className="mt-1 text-sm">{r.desc}</p></Card>
              ))}
            </div>
          </section>

          <section id="trai-nghiem">
            <h2 className="mb-3 text-xl font-bold">Trải nghiệm quanh khách sạn</h2>
            <div className="grid gap-3 sm:grid-cols-3">{h.experiences.map(e => <Card key={e.name} className="p-4"><p className="font-semibold">{e.name}</p><p className="mt-1 text-sm text-muted">{e.desc}</p></Card>)}</div>
            <p className="mt-3 text-sm text-muted">Xe sân bay, tour Rooty Trip và du thuyền RIVUS đặt luôn ở bước <b>Dịch vụ thêm</b> khi đặt phòng. <Link href="/trai-nghiem" className="text-primary hover:underline">Xem tất cả trải nghiệm</Link></p>
          </section>

          <section id="gallery">
            <h2 className="mb-3 text-xl font-bold">Gallery</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {h.gallery.map((src, i) => <button key={src} type="button" onClick={() => setLight(i)} aria-label={`Mở ảnh ${i + 1}`} className="overflow-hidden rounded-lg"><Photo src={src} alt={`${h.name} ảnh ${i + 1}`} className="aspect-square transition-transform hover:scale-105" sizes="25vw" /></button>)}
            </div>
          </section>

          <section id="chinh-sach">
            <h2 className="mb-3 text-xl font-bold">Chính sách</h2>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              {[[Clock, 'Nhận / trả phòng', `${h.policies.checkin} · ${h.policies.checkout}`], [Ban, 'Huỷ phòng', h.policies.cancel], [Baby, 'Trẻ em', h.policies.children], [PawPrint, 'Thú cưng', h.policies.pets]].map(([Icon, k, v]) => {
                const I = Icon as typeof Clock
                return <Card key={k as string} className="p-4"><dt className="flex items-center gap-2 font-semibold"><I className="size-4 text-primary" />{k as string}</dt><dd className="mt-1 text-muted">{v as string}</dd></Card>
              })}
            </dl>
          </section>

          <section id="uu-dai">
            <h2 className="mb-3 text-xl font-bold">Ưu đãi tại {h.name}</h2>
            <div className="grid gap-4 sm:grid-cols-2">{(promos.data ?? []).map(p => <PromoCard key={p.id} promo={p} />)}</div>
          </section>

          <section id="dat-phong" className="rounded-2xl bg-mint p-6">
            <h2 className="text-xl font-bold text-brand dark:text-accent">Đặt phòng {h.name}</h2>
            <p className="mt-1 text-sm text-muted">Chọn hạng phòng ở mục Phòng phía trên, hoặc đi thẳng vào luồng đặt phòng.</p>
            <ButtonLink href={`/${slug}/dat-phong?${searchToParams({ ...s, dest: undefined })}`} className="mt-4">Bắt đầu đặt phòng</ButtonLink>
          </section>
        </div>

        <aside className="hidden lg:block"><div className="sticky top-40"><BookingWidget s={s} onChange={change} fromPrice={fromPrice} /></div></aside>
      </div>

      <div className="no-print fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-border bg-surface px-4 py-3 lg:hidden">
        <div className="min-w-0 flex-1"><p className="text-xs text-muted">{fmtRange(s.checkin, s.checkout)} · {guestsLabel(s.adults, s.children)}</p><p className="font-bold">{fromPrice ? `Từ ${fmtVND(fromPrice)}/đêm` : 'Hết phòng'}</p></div>
        <MobileDates s={s} onChange={change} />
        <ButtonLink href="#phong">Đặt phòng</ButtonLink>
      </div>

      <Lightbox key={light ?? -1} images={h.gallery} index={light} onClose={() => setLight(null)} title={h.name} />
    </div>
  )
}

function MobileDates({ s, onChange }: { s: SearchState; onChange: (p: Partial<SearchState>) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>Đổi ngày</Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Ngày & khách" side="bottom">
        <BookingWidget s={s} onChange={onChange} />
      </Dialog>
    </>
  )
}

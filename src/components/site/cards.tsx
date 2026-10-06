'use client'
import Link from 'next/link'
import { BedDouble, Check, Eye, MapPin, Maximize2, Scale, Sparkles, Users, X } from 'lucide-react'
import type { Article, Hotel, Promotion } from '@/lib/types'
import type { RoomOffer } from '@/lib/repo'
import { AREA_LABEL } from '@/lib/labels'
import { addDays, diffDays, fmtDate, fmtDayMonth, fmtVND } from '@/lib/format'
import { bookingHref, searchToParams, type SearchState } from '@/lib/search-params'
import { stockLevel } from '@/lib/inventory'
import { useDemo } from '@/store/provider'
import { buttonVariants } from '@/components/ui/button'
import { Badge, Photo, Stars, cn } from '../ui'
import { toast } from '../ui/overlay'

export function useCompare() {
  const { overlay, update } = useDemo()
  const ids = overlay.compare
  const toggle = (id: string, name: string) => {
    if (ids.includes(id)) { update(o => ({ compare: o.compare.filter(x => x !== id) })); return }
    if (ids.length >= 3) { toast('Chỉ so sánh tối đa 3 phòng. Bỏ bớt ở trang So sánh.', 'error'); return }
    update(o => ({ compare: [...o.compare, id] }))
    toast(`Đã thêm "${name}" vào so sánh`)
  }
  return { ids, toggle }
}

/** Còn bao nhiêu phòng: chỉ tô màu khi sắp hết hoặc hết (M4). */
export function StockNote({ left, total, need = 1 }: { left: number; total: number; need?: number }) {
  if (left < need) return <span className="text-sm font-medium text-danger">{left ? `Chỉ còn ${left} phòng, không đủ ${need}` : 'Hết phòng ngày này'}</span>
  return stockLevel(left, total) === 'low'
    ? <span className="text-sm font-medium text-warn">Chỉ còn {left} phòng</span>
    : <span className="text-sm text-muted-foreground">Còn {left} phòng</span>
}

/** Card khách sạn dạng lưới (trang chủ, danh sách KS, điểm đến). */
export function HotelCard({ hotel, href, fromPrice, children }: { hotel: Hotel; href?: string; fromPrice?: number; children?: React.ReactNode }) {
  const url = href ?? `/${hotel.slug}`
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <Link href={url} className="block overflow-hidden" tabIndex={-1} aria-hidden>
        <Photo src={hotel.cover} alt="" className="aspect-[4/3] transition-transform duration-500 group-hover:scale-[1.03]" sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" />
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><MapPin className="size-3.5" aria-hidden />{AREA_LABEL[hotel.area]}</span>
          <Stars n={hotel.stars} />
        </div>
        <Link href={url} className="text-base font-semibold text-foreground hover:text-primary">{hotel.name}</Link>
        <p className="line-clamp-2 text-sm text-muted-foreground">{hotel.tagline}</p>
        <p className="mt-auto pt-2 text-sm text-muted-foreground">
          {fromPrice ? <>Từ <span className="text-lg font-semibold text-foreground tabular-nums">{fmtVND(fromPrice)}</span> / đêm</> : 'Xem giá theo ngày'}
        </p>
        {children}
      </div>
    </article>
  )
}

/** Một gói giá: quyền lợi bên trái, giá/đêm + tổng + nút Đặt bên phải. */
function PlanRow({ hotel, offer, p, s }: { hotel: Hotel; offer: RoomOffer; p: RoomOffer['plans'][number]; s: SearchState }) {
  const ok = offer.fits && offer.left >= s.rooms
  const nights = diffDays(s.checkin, s.checkout)
  const perks = [
    { ok: p.plan.has_breakfast, text: p.plan.has_breakfast ? 'Bao gồm ăn sáng' : 'Không gồm ăn sáng' },
    { ok: !!p.plan.free_cancel_days, text: p.plan.free_cancel_days ? `Huỷ miễn phí trước ${fmtDate(addDays(s.checkin, -p.plan.free_cancel_days))}` : 'Không hoàn huỷ' },
  ]
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 py-4">
      <div className="min-w-0 flex-1 basis-52">
        <p className="text-sm font-medium text-foreground">{p.plan.has_breakfast ? 'Phòng + ăn sáng' : 'Chỉ phòng'}</p>
        <ul className="mt-1.5 space-y-1 text-sm">
          {perks.map(k => (
            <li key={k.text} className={cn('flex items-center gap-1.5', k.ok ? 'text-ok' : 'text-muted-foreground')}>
              {k.ok ? <Check className="size-4 shrink-0" aria-hidden /> : <X className="size-4 shrink-0" aria-hidden />}{k.text}
            </li>
          ))}
        </ul>
      </div>
      <div className="ml-auto flex items-center gap-4">
        <div className="text-right">
          <p className="text-lg font-semibold text-foreground tabular-nums">{fmtVND(p.nightly)}<span className="text-sm font-normal text-muted-foreground"> / đêm</span></p>
          <p className="text-xs text-muted-foreground tabular-nums">Tổng {fmtVND(p.promo ? p.totalAfterPromo : p.total)} · {nights} đêm{s.rooms > 1 ? ` · ${s.rooms} phòng` : ''}</p>
        </div>
        {ok
          ? <Link href={bookingHref(hotel.slug, s, offer.rt.room_type_id, p.plan.rate_plan_id)} className={buttonVariants({ variant: 'default' })}>Đặt phòng</Link>
          : <span className={cn(buttonVariants({ variant: 'default' }), 'pointer-events-none opacity-40')} aria-disabled>Đặt phòng</span>}
      </div>
    </div>
  )
}

/** Card hạng phòng: ảnh trái, thông số, số phòng còn, các gói giá. */
export function RoomOfferCard({ hotel, offer, s, compact }: { hotel: Hotel; offer: RoomOffer; s: SearchState; compact?: boolean }) {
  const { rt } = offer
  const { ids, toggle } = useCompare()
  const inCompare = ids.includes(rt.room_type_id)
  const href = `/${hotel.slug}/phong/${rt.slug}?${searchToParams({ ...s, dest: undefined })}`
  const promo = offer.plans.find(p => p.promo)?.promo
  return (
    <article className={cn('overflow-hidden rounded-2xl border border-border bg-card', !offer.fits && 'opacity-70')}>
      <div className={cn('grid', !compact && 'sm:grid-cols-[240px_minmax(0,1fr)]')}>
        {!compact && (
          <Link href={href} className="block" tabIndex={-1} aria-hidden>
            <Photo src={rt.image} alt="" className="aspect-[16/10] sm:aspect-auto sm:h-full sm:min-h-56" sizes="(min-width:640px) 240px, 100vw" />
          </Link>
        )}
        <div className="px-4 pt-4 sm:px-5 sm:pt-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {offer.personalized && <Badge tone="info" className="mb-1.5"><Sparkles className="size-3" aria-hidden />Gợi ý theo lần ở trước</Badge>}
              <Link href={href} className="block text-base font-semibold text-foreground hover:text-primary">{rt.name}</Link>
              <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <li className="flex items-center gap-1.5"><Maximize2 className="size-3.5" aria-hidden />{rt.size_m2} m²</li>
                <li className="flex items-center gap-1.5"><BedDouble className="size-3.5" aria-hidden />{rt.beds}</li>
                <li className="flex items-center gap-1.5"><Eye className="size-3.5" aria-hidden />{rt.view}</li>
                <li className="flex items-center gap-1.5"><Users className="size-3.5" aria-hidden />{rt.max_adults} người lớn, {rt.max_children} trẻ em</li>
              </ul>
            </div>
            {!compact && (
              <button type="button" onClick={() => toggle(rt.room_type_id, rt.name)} aria-pressed={inCompare} aria-label={inCompare ? `Bỏ ${rt.name} khỏi so sánh` : `So sánh ${rt.name}`}
                className={cn('inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-sm transition-colors', inCompare ? 'bg-accent font-medium text-accent-foreground' : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground')}>
                <Scale className="size-4" aria-hidden /><span className="hidden sm:inline">{inCompare ? 'Đang so sánh' : 'So sánh'}</span>
              </button>
            )}
          </div>
          <p className="mt-2">
            <StockNote left={offer.left} total={rt.quantity} need={s.rooms} />
            {!offer.fits && <span className="text-sm text-muted-foreground"> · Không đủ chỗ cho {s.adults + s.children} khách/{s.rooms} phòng</span>}
            {promo && <span className="text-sm text-muted-foreground"> · <span className="font-medium text-accent-foreground">Ưu đãi {promo.name.split('–')[0].trim()} −{promo.discount_pct}%</span> đã trừ trong tổng</span>}
          </p>
          <div className="mt-1 divide-y divide-border border-t border-border">
            {offer.plans.map(p => <PlanRow key={p.plan.rate_plan_id} hotel={hotel} offer={offer} p={p} s={s} />)}
          </div>
        </div>
      </div>
    </article>
  )
}

export function PromoCard({ promo }: { promo: Promotion }) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-border bg-card">
      <Link href={`/uu-dai/${promo.slug}`} tabIndex={-1} aria-hidden className="block overflow-hidden"><Photo src={promo.image} alt="" className="aspect-[16/9] transition-transform duration-500 group-hover:scale-[1.03]" sizes="(min-width:768px) 33vw, 100vw" /></Link>
      <div className="space-y-1.5 p-4 sm:p-5">
        <Badge tone="brand">Giảm {promo.discount_pct}%</Badge>
        <Link href={`/uu-dai/${promo.slug}`} className="block text-base font-semibold hover:text-primary">{promo.name}</Link>
        <p className="text-sm text-muted-foreground">{promo.summary}</p>
        <p className="text-xs text-muted-foreground">Nhận phòng đến {fmtDayMonth(promo.valid_to)}/{promo.valid_to.slice(0, 4)}</p>
      </div>
    </article>
  )
}

export function ArticleCard({ a }: { a: Article }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card">
      <Link href={`/cam-nang/${a.slug}`} tabIndex={-1} aria-hidden><Photo src={a.image} alt="" className="aspect-[16/9]" sizes="(min-width:768px) 33vw, 100vw" /></Link>
      <div className="space-y-1 p-4 sm:p-5">
        <p className="text-xs text-muted-foreground">{a.category} · {fmtDate(a.date)} · {a.read_min} phút đọc</p>
        <Link href={`/cam-nang/${a.slug}`} className="block text-base font-semibold hover:text-primary">{a.title}</Link>
        <p className="text-sm text-muted-foreground">{a.excerpt}</p>
      </div>
    </article>
  )
}

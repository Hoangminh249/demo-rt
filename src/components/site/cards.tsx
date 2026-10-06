'use client'
import Link from 'next/link'
import { BedDouble, Coffee, MapPin, Ruler, Scale, ShieldCheck, Users, Sparkles } from 'lucide-react'
import type { Hotel, Promotion, Article } from '@/lib/types'
import type { RoomOffer } from '@/lib/repo'
import { AREA_LABEL, TAG_LABEL } from '@/lib/labels'
import { fmtDate, fmtRange, fmtVND, guestsLabel, roomsLeft } from '@/lib/format'
import { bookingHref, searchToParams, type SearchState } from '@/lib/search-params'
import { stockLevel } from '@/lib/inventory'
import { useDemo } from '@/store/provider'
import { Badge, ButtonLink, Card, Photo, Stars, cn } from '../ui'
import { toast } from '../ui/overlay'

export function useCompare() {
  const { overlay, update } = useDemo()
  const ids = overlay.compare
  const toggle = (id: string, name: string) => {
    if (ids.includes(id)) { update(o => ({ compare: o.compare.filter(x => x !== id) })); return }
    if (ids.length >= 3) { toast('Chỉ so sánh tối đa 3 phòng. Bỏ bớt trong trang So sánh.', 'error'); return }
    update(o => ({ compare: [...o.compare, id] }))
    toast(`Đã thêm "${name}" vào so sánh`)
  }
  return { ids, toggle }
}

export function HotelCard({ hotel, href, fromPrice, children }: { hotel: Hotel; href?: string; fromPrice?: number; children?: React.ReactNode }) {
  return (
    <Card className="group overflow-hidden">
      <Link href={href ?? `/${hotel.slug}`} className="block">
        <Photo src={hotel.cover} alt={hotel.name} className="aspect-[4/3] transition-transform group-hover:scale-[1.02]" sizes="(min-width:768px) 33vw, 100vw" />
      </Link>
      <div className="space-y-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <Stars n={hotel.stars} />
          <span className="flex items-center gap-1 text-xs text-muted"><MapPin className="size-3.5" />{AREA_LABEL[hotel.area]}</span>
        </div>
        <Link href={href ?? `/${hotel.slug}`} className="block text-lg font-semibold hover:text-primary">{hotel.name}</Link>
        <p className="line-clamp-2 text-sm text-muted">{hotel.tagline}</p>
        <div className="flex flex-wrap gap-1">{hotel.tags.slice(0, 4).map(t => <Badge key={t} tone="brand">{TAG_LABEL[t]}</Badge>)}</div>
        {fromPrice ? <p className="pt-1 text-sm">Từ <span className="text-lg font-bold text-fg">{fmtVND(fromPrice)}</span><span className="text-muted">/đêm</span></p> : null}
        {children}
      </div>
    </Card>
  )
}

/** Thẻ phòng giống ví dụ PDF: Room · khách · ngày · gói · giá/đêm · còn phòng · BOOK NOW */
export function RoomOfferCard({ hotel, offer, s, compact }: { hotel: Hotel; offer: RoomOffer; s: SearchState; compact?: boolean }) {
  const { rt } = offer
  const { ids, toggle } = useCompare()
  const level = stockLevel(offer.left, rt.quantity)
  const enough = offer.left >= s.rooms
  return (
    <div className={cn('rounded-xl border border-border bg-surface', !enough && 'opacity-75')}>
      <div className="flex flex-col gap-4 p-4 sm:flex-row">
        <Link href={`/${hotel.slug}/phong/${rt.slug}?${searchToParams(s)}`} className="shrink-0">
          <Photo src={rt.image} alt={rt.name} className="aspect-[4/3] w-full rounded-lg sm:w-44" sizes="200px" />
        </Link>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/${hotel.slug}/phong/${rt.slug}?${searchToParams(s)}`} className="text-base font-semibold hover:text-primary">{rt.name}</Link>
            {offer.personalized && <Badge tone="info"><Sparkles className="size-3" /> Gợi ý dựa trên lần ở trước</Badge>}
          </div>
          <p className="text-sm text-muted">{guestsLabel(s.adults, s.children)} · {fmtRange(s.checkin, s.checkout)}{s.rooms > 1 ? ` · ${s.rooms} phòng` : ''}</p>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
            <li className="flex items-center gap-1"><Ruler className="size-3.5" />{rt.size_m2} m²</li>
            <li className="flex items-center gap-1"><BedDouble className="size-3.5" />{rt.beds}</li>
            <li className="flex items-center gap-1"><Users className="size-3.5" />Tối đa {rt.max_adults} NL + {rt.max_children} TE</li>
          </ul>
          <div className="pt-1">
            {!enough ? <Badge tone="danger">{offer.left ? `Chỉ còn ${offer.left} phòng — không đủ ${s.rooms} phòng` : 'Hết phòng ngày này'}</Badge>
              : <Badge tone={level === 'low' ? 'warn' : 'ok'}>{roomsLeft(offer.left)}</Badge>}
          </div>
        </div>
        {!compact && (
          <button type="button" onClick={() => toggle(rt.room_type_id, rt.name)} aria-pressed={ids.includes(rt.room_type_id)}
            className={cn('self-start rounded-lg border px-2.5 py-1.5 text-xs font-medium', ids.includes(rt.room_type_id) ? 'border-primary bg-mint text-primary' : 'border-border text-muted hover:text-fg')}>
            <Scale className="mr-1 inline size-3.5" />{ids.includes(rt.room_type_id) ? 'Đang so sánh' : 'So sánh'}
          </button>
        )}
      </div>
      <div className="divide-y divide-border border-t border-border">
        {offer.plans.map(p => (
          <div key={p.plan.rate_plan_id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1 text-sm">
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-medium">
                <span className={cn('flex items-center gap-1', p.plan.has_breakfast ? 'text-ok' : 'text-muted')}><Coffee className="size-4" />{p.plan.has_breakfast ? 'Breakfast Included' : 'Room Only'}</span>
                <span className={cn('flex items-center gap-1', p.plan.free_cancel_days ? 'text-ok' : 'text-muted')}><ShieldCheck className="size-4" />{p.plan.free_cancel_days ? 'Free Cancellation' : 'Không hoàn huỷ'}</span>
              </p>
              {p.promo && <p className="mt-1 text-xs text-primary">Ưu đãi {p.promo.name.split('–')[0].trim()} −{p.promo.discount_pct}% · còn {fmtVND(p.totalAfterPromo)} cho {s.rooms > 1 ? `${s.rooms} phòng` : 'cả kỳ'}</p>}
            </div>
            <div className="text-right">
              <p className="text-lg font-bold">{fmtVND(p.nightly)}<span className="text-sm font-normal text-muted"> / night</span></p>
              <p className="text-xs text-muted">Tổng {fmtVND(p.total)}</p>
            </div>
            <ButtonLink href={enough ? bookingHref(hotel.slug, s, rt.room_type_id, p.plan.rate_plan_id) : '#'} aria-disabled={!enough} className={cn(!enough && 'pointer-events-none opacity-40')}>BOOK NOW</ButtonLink>
          </div>
        ))}
      </div>
    </div>
  )
}

export function PromoCard({ promo }: { promo: Promotion }) {
  return (
    <Card className="group overflow-hidden">
      <Link href={`/uu-dai/${promo.slug}`}><Photo src={promo.image} alt={promo.name} className="aspect-[16/9]" sizes="(min-width:768px) 33vw, 100vw" /></Link>
      <div className="space-y-2 p-4">
        <Badge tone="brand">−{promo.discount_pct}%</Badge>
        <Link href={`/uu-dai/${promo.slug}`} className="block font-semibold hover:text-primary">{promo.name}</Link>
        <p className="text-sm text-muted">{promo.summary}</p>
        <p className="text-xs text-muted">Hạn: {fmtDate(promo.valid_to)}</p>
      </div>
    </Card>
  )
}

export function ArticleCard({ a }: { a: Article }) {
  return (
    <Card className="overflow-hidden">
      <Link href={`/cam-nang/${a.slug}`}><Photo src={a.image} alt={a.title} className="aspect-[16/9]" sizes="(min-width:768px) 33vw, 100vw" /></Link>
      <div className="space-y-1 p-4">
        <p className="text-xs text-muted">{a.category} · {fmtDate(a.date)} · {a.read_min} phút đọc</p>
        <Link href={`/cam-nang/${a.slug}`} className="block font-semibold hover:text-primary">{a.title}</Link>
        <p className="text-sm text-muted">{a.excerpt}</p>
      </div>
    </Card>
  )
}

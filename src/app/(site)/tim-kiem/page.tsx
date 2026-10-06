'use client'
import Link from 'next/link'
import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SlidersHorizontal, MapPin, CalendarSearch, ChevronDown, Check } from 'lucide-react'
import { repo, type HotelResult } from '@/lib/repo'
import { useAsync } from '@/store/provider'
import { parseSearch, searchToParams, bookingHref, type SearchState } from '@/lib/search-params'
import { AREA_LABEL, TAG_LABEL } from '@/lib/labels'
import { addDays, diffDays, fmtRange, fmtVND, guestsLabel } from '@/lib/format'
import type { Area, HotelTag } from '@/lib/types'
import { Button, buttonVariants } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Select as UISelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SearchBar } from '@/components/site/search-bar'
import { RoomOfferCard, StockNote } from '@/components/site/cards'
import { Badge, Empty, Photo, Segmented, Skeleton, Stars, cn } from '@/components/ui'
import { Dialog } from '@/components/ui/overlay'

const FILTER_TAGS: HotelTag[] = ['gan-bien', 'ho-boi', 'kids-club', 'an-sang', 'huy-mien-phi']
const PRICES = [1_500_000, 2_000_000, 3_000_000, 5_000_000]

function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex min-h-10 w-fit cursor-pointer items-center gap-3 text-sm">
      <Checkbox checked={checked} onCheckedChange={onChange} className="size-5 rounded-md border-border-strong data-[state=checked]:border-primary data-[state=checked]:bg-primary" />
      {label}
    </label>
  )
}

function Filters({ s, apply }: { s: SearchState; apply: (p: Partial<SearchState>) => void }) {
  const toggle = <T,>(arr: T[] | undefined, v: T) => (arr?.includes(v) ? arr.filter(x => x !== v) : [...(arr ?? []), v])
  const active = (s.areas?.length ?? 0) + (s.stars?.length ?? 0) + (s.tags?.length ?? 0) + (s.maxPrice ? 1 : 0)
  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="mb-1 text-sm font-semibold">Khu vực</legend>
        {(['bac-dao', 'trung-tam', 'nam-dao'] as Area[]).map(a => <CheckRow key={a} label={AREA_LABEL[a]} checked={!!s.areas?.includes(a)} onChange={() => apply({ areas: toggle(s.areas, a) })} />)}
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Giá mỗi đêm</legend>
        <UISelect value={String(s.maxPrice ?? 'all')} onValueChange={v => apply({ maxPrice: v === 'all' ? undefined : Number(v) })}>
          <SelectTrigger aria-label="Giá tối đa mỗi đêm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Mọi mức giá</SelectItem>
            {PRICES.map(v => <SelectItem key={v} value={String(v)}>Dưới {fmtVND(v)}</SelectItem>)}
          </SelectContent>
        </UISelect>
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Hạng sao</legend>
        <div className="flex gap-2">
          {[3, 4, 5].map(n => {
            const on = !!s.stars?.includes(n)
            return (
              <button key={n} type="button" aria-pressed={on} onClick={() => apply({ stars: toggle(s.stars, n) })}
                className={cn('inline-flex h-9 items-center gap-1 rounded-lg border px-3 text-sm transition-colors', on ? 'border-primary bg-accent font-medium text-accent-foreground' : 'border-border-strong bg-card text-foreground hover:bg-button-hover')}>
                {on && <Check className="size-3.5" aria-hidden />}{n} sao
              </button>
            )
          })}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-1 text-sm font-semibold">Tiện ích</legend>
        {FILTER_TAGS.map(t => <CheckRow key={t} label={TAG_LABEL[t]} checked={!!s.tags?.includes(t)} onChange={() => apply({ tags: toggle(s.tags, t) })} />)}
      </fieldset>
      {active > 0 && <Button variant="ghost" onClick={() => apply({ areas: [], stars: [], tags: [], maxPrice: undefined })}>Xoá {active} bộ lọc</Button>}
    </div>
  )
}

/** Thứ tự PDF §2: Hotel → Room → Giá → Tình trạng phòng → Ưu đãi → Book Now. */
function HotelResultCard({ r, s }: { r: HotelResult; s: SearchState }) {
  const [open, setOpen] = useState(false)
  const nights = diffDays(s.checkin, s.checkout)
  const sellable = r.offers.filter(o => o.fits && o.left >= s.rooms)
  // Đề xuất như ví dụ PDF: hạng rẻ nhất còn phòng, gói có ăn sáng + huỷ miễn phí
  const cheapest = [...sellable].sort((a, b) => a.plans[0].nightly - b.plans[0].nightly)[0]
  const best = cheapest && { o: cheapest, p: cheapest.plans.find(p => p.plan.has_breakfast) ?? cheapest.plans[0] }
  const hotelHref = `/${r.hotel.slug}?${searchToParams({ ...s, dest: undefined })}`
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="grid sm:grid-cols-[220px_minmax(0,1fr)] lg:grid-cols-[260px_minmax(0,1fr)_220px]">
        <Link href={hotelHref} tabIndex={-1} aria-hidden className="block"><Photo src={r.hotel.cover} alt="" className="aspect-[16/10] sm:aspect-auto sm:h-full sm:min-h-56" sizes="(min-width:640px) 260px, 100vw" /></Link>
        <div className="min-w-0 p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <Stars n={r.hotel.stars} /><span className="flex items-center gap-1"><MapPin className="size-3.5" aria-hidden />{AREA_LABEL[r.hotel.area]}</span>
          </div>
          <Link href={hotelHref} className="mt-1 block text-base font-semibold text-foreground hover:text-primary">{r.hotel.name}</Link>
          <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{r.hotel.tagline}</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">{r.hotel.tags.filter(t => t !== 'an-sang' && t !== 'huy-mien-phi').map(t => <li key={t}><Badge tone="neutral">{TAG_LABEL[t]}</Badge></li>)}</ul>
          {best ? (
            <div className="mt-4 rounded-xl bg-muted px-3 py-2.5 text-sm">
              <p className="font-medium text-foreground">{best.o.rt.name}</p>
              <p className="mt-0.5 text-muted-foreground">{best.p.plan.has_breakfast ? 'Bao gồm ăn sáng' : 'Chỉ phòng'} · {best.p.plan.free_cancel_days ? 'Huỷ miễn phí' : 'Không hoàn huỷ'} · <StockNote left={best.o.left} total={best.o.rt.quantity} need={s.rooms} /></p>
            </div>
          ) : <p className="mt-4 text-sm font-medium text-danger">Hết phòng phù hợp cho {fmtRange(s.checkin, s.checkout)}</p>}
        </div>
        <div className="flex flex-col justify-between gap-3 border-t border-border p-4 sm:col-span-2 sm:flex-row sm:items-end sm:p-5 lg:col-span-1 lg:flex-col lg:items-stretch lg:border-t-0 lg:border-l lg:text-right">
          {best ? (
            <>
              <div>
                {best.p.promo && <Badge tone="brand" className="mb-1">{best.p.promo.name.split('–')[0].trim()} −{best.p.promo.discount_pct}%</Badge>}
                <p className="text-xl font-semibold whitespace-nowrap text-foreground tabular-nums">{fmtVND(best.p.nightly)}<span className="text-sm font-normal text-muted-foreground"> / đêm</span></p>
                <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">Tổng {fmtVND(best.p.promo ? best.p.totalAfterPromo : best.p.total)}</p>
                <p className="text-xs text-muted-foreground">cho {nights} đêm{s.rooms > 1 ? `, ${s.rooms} phòng` : ''}</p>
              </div>
              <div className="flex flex-col gap-2">
                <Link href={bookingHref(r.hotel.slug, s, best.o.rt.room_type_id, best.p.plan.rate_plan_id)} className={buttonVariants({ variant: 'default' })}>Đặt phòng</Link>
                {r.offers.length > 1 && (
                  <Button variant="ghost" size="sm" aria-expanded={open} onClick={() => setOpen(!open)}>
                    {open ? 'Thu gọn' : `Xem ${r.offers.length} hạng phòng`}<ChevronDown className={cn('transition-transform', open && 'rotate-180')} aria-hidden />
                  </Button>
                )}
              </div>
            </>
          ) : (
            <Link href={`/tim-kiem?${searchToParams({ ...s, checkin: addDays(s.checkin, 7), checkout: addDays(s.checkout, 7) })}`} className={buttonVariants({ variant: 'outline' })}>Thử tuần sau</Link>
          )}
        </div>
      </div>
      {open && <div className="space-y-3 border-t border-border bg-background p-3 sm:p-4">{r.offers.map(o => <RoomOfferCard key={o.rt.room_type_id} hotel={r.hotel} offer={o} s={s} />)}</div>}
    </article>
  )
}

function MapView({ results, s }: { results: HotelResult[]; s: SearchState }) {
  const [sel, setSel] = useState<string | null>(results[0]?.hotel.id ?? null)
  const cur = results.find(r => r.hotel.id === sel)
  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_320px]">
      <div className="relative mx-auto aspect-[2/3] w-full max-w-md overflow-hidden rounded-2xl border border-border">
        <Photo src="/images/map-phu-quoc.svg" alt="Bản đồ Phú Quốc (minh hoạ)" className="absolute inset-0" />
        {results.map(r => (
          <button key={r.hotel.id} type="button" onClick={() => setSel(r.hotel.id)} aria-pressed={sel === r.hotel.id}
            style={{ left: `${((r.hotel.lng - 103.8) / 0.32) * 100}%`, top: `${((10.48 - r.hotel.lat) / 0.58) * 100}%` }}
            className={cn('absolute -translate-x-1/2 -translate-y-full rounded-full border px-2.5 py-1 text-xs font-semibold tabular-nums', sel === r.hotel.id ? 'z-10 border-brand bg-brand text-brand-foreground' : 'border-border-strong bg-card text-foreground')}
            aria-label={r.hotel.name}>
            {r.fromPrice ? `${(r.fromPrice / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tr` : 'Hết'}
          </button>
        ))}
      </div>
      {cur && (
        <div className="h-fit space-y-2 rounded-2xl border border-border bg-card p-4">
          <Photo src={cur.hotel.cover} alt="" className="aspect-[4/3] rounded-xl" sizes="320px" />
          <Stars n={cur.hotel.stars} />
          <p className="text-base font-semibold">{cur.hotel.name}</p>
          <p className="text-sm text-muted-foreground">{cur.hotel.address}</p>
          {cur.fromPrice > 0 && <p className="text-sm">Từ <b className="tabular-nums">{fmtVND(cur.fromPrice)}</b> / đêm</p>}
          <Link href={`/${cur.hotel.slug}?${searchToParams({ ...s, dest: undefined })}#phong`} className={cn(buttonVariants({ variant: 'default' }), 'w-full')}>Xem phòng</Link>
        </div>
      )}
    </div>
  )
}

function SearchView() {
  const sp = useSearchParams()
  const router = useRouter()
  const s = parseSearch(sp)
  const key = sp.toString()
  const [sheet, setSheet] = useState(false)
  const res = useAsync(() => repo.search(s), [key])
  const apply = (p: Partial<SearchState>) => router.replace(`/tim-kiem?${searchToParams({ ...s, ...p })}`, { scroll: false })
  const shown = res.data?.filter(r => r.fromPrice) ?? []
  const soldOut = res.data?.filter(r => !r.fromPrice) ?? []

  return (
    <>
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6"><SearchBar key={key} initial={s} variant="inline" /></div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="hidden lg:block"><div className="sticky top-32"><Filters s={s} apply={apply} /></div></aside>
          <div className="min-w-0">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <div className="mr-auto min-w-0">
                <h1 className="text-xl font-semibold">{res.data ? `${shown.length} khách sạn còn phòng` : 'Đang tìm phòng…'}</h1>
                <p className="text-sm text-muted-foreground">{fmtRange(s.checkin, s.checkout)} · {guestsLabel(s.adults, s.children)} · {s.rooms} phòng{s.promo && <> · ưu đãi <b className="text-foreground">{s.promo}</b></>}</p>
              </div>
              <Button variant="outline" className="lg:hidden" onClick={() => setSheet(true)}><SlidersHorizontal aria-hidden />Bộ lọc</Button>
              <UISelect value={s.sort ?? 'recommended'} onValueChange={v => apply({ sort: v as SearchState['sort'] })}>
                <SelectTrigger aria-label="Sắp xếp" className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="recommended">Đề xuất</SelectItem><SelectItem value="price-asc">Giá thấp đến cao</SelectItem>
                  <SelectItem value="price-desc">Giá cao đến thấp</SelectItem><SelectItem value="stars">Hạng sao</SelectItem>
                </SelectContent>
              </UISelect>
              <Segmented label="Chế độ xem" value={s.view ?? 'list'} onChange={v => apply({ view: v })} options={[{ value: 'list', label: 'Danh sách' }, { value: 'map', label: 'Bản đồ' }]} />
            </div>
            {!res.data ? (
              <div className="space-y-4" role="status" aria-label="Đang tải">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-56" />)}</div>
            ) : shown.length === 0 ? (
              <Empty icon={<CalendarSearch className="size-10" />} title="Không còn phòng phù hợp">
                <p>Thử đổi ngày, bỏ bớt bộ lọc hoặc xem tất cả khách sạn.</p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <Link href={`/tim-kiem?${searchToParams({ ...s, checkin: addDays(s.checkin, 7), checkout: addDays(s.checkout, 7) })}`} className={buttonVariants({ variant: 'outline' })}>Lùi 1 tuần ({fmtRange(addDays(s.checkin, 7), addDays(s.checkout, 7))})</Link>
                  <Link href={`/tim-kiem?${searchToParams({ ...s, dest: '', areas: [], stars: [], tags: [], maxPrice: undefined })}`} className={buttonVariants({ variant: 'outline' })}>Xem mọi khách sạn</Link>
                </div>
              </Empty>
            ) : (
              <div className={cn('transition-opacity', res.loading && 'opacity-60')}>
                {s.view === 'map' ? <MapView results={shown} s={s} /> : (
                  <div className="space-y-4">
                    {shown.map(r => <HotelResultCard key={r.hotel.id} r={r} s={s} />)}
                    {soldOut.length > 0 && <p className="pt-2 text-sm text-muted-foreground">Hết phòng ngày này: {soldOut.map(r => r.hotel.name).join(', ')}.</p>}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <Dialog open={sheet} onClose={() => setSheet(false)} title="Bộ lọc" side="bottom" footer={<Button variant="default" className="w-full" onClick={() => setSheet(false)}>Xem {shown.length} khách sạn</Button>}>
        <Filters s={s} apply={apply} />
      </Dialog>
    </>
  )
}

export default function SearchPage() {
  return <Suspense fallback={<div className="mx-auto max-w-7xl space-y-4 px-4 py-6"><Skeleton className="h-20" /><Skeleton className="h-56" /></div>}><SearchView /></Suspense>
}

'use client'
import Link from 'next/link'
import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SlidersHorizontal, MapPin, CalendarSearch } from 'lucide-react'
import { repo, type HotelResult } from '@/lib/repo'
import { useAsync } from '@/store/provider'
import { parseSearch, searchToParams, type SearchState } from '@/lib/search-params'
import { AREA_LABEL, TAG_LABEL } from '@/lib/labels'
import { addDays, fmtRange, fmtVND, guestsLabel } from '@/lib/format'
import type { Area, HotelTag } from '@/lib/types'
import { SearchBar } from '@/components/site/search-bar'
import { RoomOfferCard } from '@/components/site/cards'
import { Badge, Button, ButtonLink, Empty, Photo, Segmented, Select, SkeletonList, Stars, cn } from '@/components/ui'
import { Dialog } from '@/components/ui/overlay'

const FILTER_TAGS: HotelTag[] = ['gan-bien', 'ho-boi', 'kids-club', 'an-sang', 'huy-mien-phi']

function Filters({ s, apply }: { s: SearchState; apply: (p: Partial<SearchState>) => void }) {
  const toggle = <T,>(arr: T[] | undefined, v: T) => (arr?.includes(v) ? arr.filter(x => x !== v) : [...(arr ?? []), v])
  return (
    <div className="space-y-6 text-sm">
      <fieldset>
        <legend className="mb-2 font-semibold">Khu vực</legend>
        {(['bac-dao', 'trung-tam', 'nam-dao'] as Area[]).map(a => (
          <label key={a} className="flex items-center gap-2 py-1"><input type="checkbox" className="size-4 accent-[var(--primary)]" checked={!!s.areas?.includes(a)} onChange={() => apply({ areas: toggle(s.areas, a) })} />{AREA_LABEL[a]}</label>
        ))}
      </fieldset>
      <fieldset>
        <legend className="mb-2 font-semibold">Giá mỗi đêm</legend>
        <Select aria-label="Giá tối đa mỗi đêm" value={s.maxPrice ?? ''} onChange={e => apply({ maxPrice: e.target.value ? Number(e.target.value) : undefined })}>
          <option value="">Mọi mức giá</option>
          {[1_500_000, 2_000_000, 3_000_000, 5_000_000].map(v => <option key={v} value={v}>Dưới {fmtVND(v)}</option>)}
        </Select>
      </fieldset>
      <fieldset>
        <legend className="mb-2 font-semibold">Hạng sao</legend>
        <div className="flex gap-2">
          {[3, 4, 5].map(n => (
            <button key={n} type="button" aria-pressed={!!s.stars?.includes(n)} onClick={() => apply({ stars: toggle(s.stars, n) })}
              className={cn('rounded-lg border px-3 py-1.5', s.stars?.includes(n) ? 'border-primary bg-mint text-primary' : 'border-border')}>{n}★</button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 font-semibold">Tiện ích</legend>
        {FILTER_TAGS.map(t => (
          <label key={t} className="flex items-center gap-2 py-1"><input type="checkbox" className="size-4 accent-[var(--primary)]" checked={!!s.tags?.includes(t)} onChange={() => apply({ tags: toggle(s.tags, t) })} />{TAG_LABEL[t]}</label>
        ))}
      </fieldset>
      <Button variant="ghost" size="sm" onClick={() => apply({ areas: [], stars: [], tags: [], maxPrice: undefined })}>Xoá bộ lọc</Button>
    </div>
  )
}

function HotelBlock({ r, s }: { r: HotelResult; s: SearchState }) {
  return (
    <article className="space-y-3">
      <div className="flex gap-4 rounded-xl border border-border bg-surface p-3">
        <Photo src={r.hotel.cover} alt={r.hotel.name} className="aspect-[4/3] w-28 shrink-0 rounded-lg sm:w-40" sizes="160px" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Hotel</p>
          <Link href={`/${r.hotel.slug}?${searchToParams(s)}`} className="text-lg font-bold hover:text-primary">{r.hotel.name}</Link>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted"><Stars n={r.hotel.stars} /><span className="flex items-center gap-1"><MapPin className="size-3.5" />{AREA_LABEL[r.hotel.area]}</span></div>
          <div className="mt-2 flex flex-wrap gap-1">
            {r.hotel.tags.slice(0, 4).map(t => <Badge key={t} tone="brand">{TAG_LABEL[t]}</Badge>)}
            {r.promo && <Badge tone="warn">Ưu đãi: {r.promo.name.split('–')[0].trim()} −{r.promo.discount_pct}%</Badge>}
          </div>
        </div>
        <div className="hidden text-right sm:block">
          {r.fromPrice ? <><p className="text-xs text-muted">Từ</p><p className="text-lg font-bold">{fmtVND(r.fromPrice)}</p><p className="text-xs text-muted">/đêm</p></> : <Badge tone="danger">Hết phòng</Badge>}
          <ButtonLink href={`/${r.hotel.slug}?${searchToParams(s)}`} variant="secondary" size="sm" className="mt-2">Xem khách sạn</ButtonLink>
        </div>
      </div>
      <div className="space-y-3 sm:pl-6">{r.offers.map(o => <RoomOfferCard key={o.rt.room_type_id} hotel={r.hotel} offer={o} s={s} />)}</div>
    </article>
  )
}

function MapView({ results, s }: { results: HotelResult[]; s: SearchState }) {
  const [sel, setSel] = useState<string | null>(results[0]?.hotel.id ?? null)
  const cur = results.find(r => r.hotel.id === sel)
  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_320px]">
      <div className="relative mx-auto aspect-[2/3] w-full max-w-md overflow-hidden rounded-xl border border-border">
        <Photo src="/images/map-phu-quoc.svg" alt="Bản đồ Phú Quốc (minh hoạ)" className="absolute inset-0" />
        {results.map(r => (
          <button key={r.hotel.id} type="button" onClick={() => setSel(r.hotel.id)}
            style={{ left: `${((r.hotel.lng - 103.8) / 0.32) * 100}%`, top: `${((10.48 - r.hotel.lat) / 0.58) * 100}%` }}
            className={cn('absolute -translate-x-1/2 -translate-y-full rounded-full px-2 py-1 text-xs font-bold shadow', sel === r.hotel.id ? 'z-10 bg-brand text-white' : 'bg-surface text-fg')}
            aria-label={r.hotel.name}>
            {r.fromPrice ? `${(r.fromPrice / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}tr` : 'Hết'}
          </button>
        ))}
      </div>
      {cur && (
        <div className="space-y-2 rounded-xl border border-border bg-surface p-4">
          <Photo src={cur.hotel.cover} alt={cur.hotel.name} className="aspect-[4/3] rounded-lg" sizes="320px" />
          <p className="text-lg font-semibold">{cur.hotel.name}</p>
          <Stars n={cur.hotel.stars} />
          <p className="text-sm text-muted">{cur.hotel.address}</p>
          {cur.fromPrice > 0 && <p>Từ <b>{fmtVND(cur.fromPrice)}</b>/đêm · {cur.left} phòng trống</p>}
          <ButtonLink href={`/${cur.hotel.slug}?${searchToParams(s)}#phong`} className="w-full">Xem phòng</ButtonLink>
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
  const shift = (days: number) => `/tim-kiem?${searchToParams({ ...s, checkin: addDays(s.checkin, days), checkout: addDays(s.checkout, days) })}`

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="rounded-2xl border border-border bg-surface p-4"><SearchBar key={key} initial={s} variant="inline" /></div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden lg:block"><div className="sticky top-32"><Filters s={s} apply={apply} /></div></aside>
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <p className="mr-auto text-sm text-muted">
              {res.data ? <><b className="text-fg">{res.data.length} khách sạn</b> · </> : null}{fmtRange(s.checkin, s.checkout)} · {guestsLabel(s.adults, s.children)} · {s.rooms} phòng
              {s.promo && <> · Ưu đãi <b className="text-primary">{s.promo}</b></>}
            </p>
            <Button variant="secondary" size="sm" className="lg:hidden" onClick={() => setSheet(true)}><SlidersHorizontal className="size-4" /> Bộ lọc</Button>
            <Select aria-label="Sắp xếp" value={s.sort} onChange={e => apply({ sort: e.target.value as SearchState['sort'] })} className="h-9 w-auto">
              <option value="recommended">Đề xuất</option><option value="price-asc">Giá thấp → cao</option><option value="price-desc">Giá cao → thấp</option><option value="stars">Hạng sao</option>
            </Select>
            <Segmented label="Chế độ xem" value={s.view ?? 'list'} onChange={v => apply({ view: v })} options={[{ value: 'list', label: 'Danh sách' }, { value: 'map', label: 'Bản đồ' }]} />
          </div>
          {!res.data ? <SkeletonList rows={4} /> : res.data.length === 0 || res.data.every(r => !r.fromPrice) ? (
            <Empty icon={<CalendarSearch className="size-10" />} title="Không còn phòng phù hợp">
              <p>Thử đổi ngày, bỏ bớt bộ lọc hoặc xem khách sạn khác.</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <ButtonLink variant="secondary" size="sm" href={shift(7)}>Lùi 1 tuần ({fmtRange(addDays(s.checkin, 7), addDays(s.checkout, 7))})</ButtonLink>
                <ButtonLink variant="secondary" size="sm" href={`/tim-kiem?${searchToParams({ ...s, dest: '', areas: [], stars: [], tags: [], maxPrice: undefined })}`}>Xem mọi khách sạn</ButtonLink>
              </div>
            </Empty>
          ) : (
            <div className={cn(res.loading && 'opacity-60 transition-opacity')}>
              {s.view === 'map' ? <MapView results={res.data} s={s} /> : <div className="space-y-10">{res.data.map(r => <HotelBlock key={r.hotel.id} r={r} s={s} />)}</div>}
            </div>
          )}
        </div>
      </div>
      <Dialog open={sheet} onClose={() => setSheet(false)} title="Bộ lọc" side="bottom" footer={<Button onClick={() => setSheet(false)} className="w-full">Xem kết quả</Button>}>
        <Filters s={s} apply={apply} />
      </Dialog>
    </div>
  )
}

export default function SearchPage() {
  return <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-6"><SkeletonList rows={4} /></div>}><SearchView /></Suspense>
}

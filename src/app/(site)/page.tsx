'use client'
import Link from 'next/link'
import { ArrowRight, Sparkles, Car, Ship, Compass } from 'lucide-react'
import { repo } from '@/lib/repo'
import { useAsync, useDemo } from '@/store/provider'
import { DEFAULT_SEARCH, searchToParams } from '@/lib/search-params'
import { SearchBar } from '@/components/site/search-bar'
import { HotelCard, PromoCard, RoomOfferCard } from '@/components/site/cards'
import { Photo, Skeleton, Badge } from '@/components/ui'

function Section({ title, href, children, sub }: { title: string; href?: string; children: React.ReactNode; sub?: string }) {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-12">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div><h2 className="text-xl font-bold md:text-2xl">{title}</h2>{sub && <p className="mt-1 text-sm text-muted">{sub}</p>}</div>
        {href && <Link href={href} className="flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline">Xem tất cả <ArrowRight className="size-4" /></Link>}
      </div>
      {children}
    </section>
  )
}

export default function HomePage() {
  const { overlay } = useDemo()
  const personal = overlay.session.customerId === 'C001'
  const banner = useAsync(() => repo.getBanner(), [])
  const s = { ...DEFAULT_SEARCH, dest: '' }
  const featured = useAsync(() => repo.search({ ...s, sort: 'stars' }), [])
  const promos = useAsync(() => repo.listPromotions(), [])
  const dests = useAsync(() => repo.listDestinations(), [])
  const exps = useAsync(() => repo.listExperiences(), [])
  const forYou = useAsync(() => (personal ? repo.search({ ...s, children: 1, sort: 'recommended' }) : Promise.resolve([])), [personal])
  const recent = repo.hotelsSync().filter(h => overlay.recent.includes(h.slug))

  return (
    <>
      <section className="relative">
        <Photo src="/images/hero.svg" alt="Biển Phú Quốc" className="absolute inset-0" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-brand/70 via-brand/40 to-bg" />
        <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-16 md:pt-24">
          <h1 className="max-w-2xl text-3xl font-bold text-white md:text-5xl">{banner.data?.headline ?? 'Ở đâu tại Phú Quốc?'}</h1>
          <p className="mt-3 max-w-2xl text-white/90 md:text-lg">{banner.data?.sub ?? ' '}</p>
          <div className="mt-8 rounded-2xl bg-surface/95 p-4 shadow-xl backdrop-blur md:p-5">
            <SearchBar />
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/90">
            <span className="flex items-center gap-1 rounded-full bg-black/25 px-3 py-1"><Car className="size-3.5" /> Đặt trực tiếp: thêm xe sân bay Rooty Trip</span>
            <span className="flex items-center gap-1 rounded-full bg-black/25 px-3 py-1"><Compass className="size-3.5" /> Tour đón tại khách sạn</span>
            <span className="flex items-center gap-1 rounded-full bg-black/25 px-3 py-1"><Ship className="size-3.5" /> Du thuyền RIVUS</span>
          </div>
        </div>
      </section>

      {personal && (
        <Section title="Gợi ý dành cho anh Nguyễn Văn A" sub="Dựa trên 4 lần ở trước: Ocean View → Family Room → có ăn sáng → tour phù hợp">
          <Badge tone="info" className="mb-3"><Sparkles className="size-3" /> Gợi ý dựa trên lần ở trước</Badge>
          {!forYou.data ? <Skeleton className="h-48" /> : (
            <div className="grid gap-4 lg:grid-cols-2">
              {forYou.data.flatMap(r => r.offers.filter(o => o.personalized && o.left > 0).slice(0, 1).map(o => (
                <RoomOfferCard key={o.rt.room_type_id} hotel={r.hotel} offer={{ ...o, plans: o.plans.filter(p => p.plan.has_breakfast) }} s={{ ...s, children: 1, ages: [6] }} compact />
              ))).slice(0, 2)}
            </div>
          )}
        </Section>
      )}

      <Section title="Khách sạn nổi bật" href="/khach-san" sub="Một website, nhiều khách sạn — cùng một hệ thống đặt phòng">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {!featured.data ? Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-80" />)
            : featured.data.slice(0, 3).map(r => <HotelCard key={r.hotel.id} hotel={r.hotel} fromPrice={r.fromPrice} href={`/${r.hotel.slug}?${searchToParams(s)}`} />)}
        </div>
      </Section>

      <Section title="Ưu đãi" href="/uu-dai">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {!promos.data ? Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-64" />) : promos.data.slice(0, 3).map(p => <PromoCard key={p.id} promo={p} />)}
        </div>
      </Section>

      <Section title="Điểm đến" href="/diem-den">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {(dests.data ?? []).map(d => (
            <Link key={d.slug} href={`/diem-den/${d.slug}`} className="group relative block overflow-hidden rounded-xl">
              <Photo src={d.image} alt={d.name} className="aspect-[3/4] transition-transform group-hover:scale-105" sizes="25vw" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <span className="absolute bottom-3 left-3 text-lg font-semibold text-white">{d.name}</span>
            </Link>
          ))}
          {!dests.data && Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="aspect-[3/4]" />)}
        </div>
      </Section>

      <Section title="Trải nghiệm" href="/trai-nghiem" sub="Khách không cần rời Rooty Hospitality — đặt cùng phòng">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {(exps.data ?? []).map(e => (
            <Link key={e.slug} href={`/trai-nghiem/${e.slug}`} className="group overflow-hidden rounded-xl border border-border bg-surface">
              <Photo src={e.image} alt={e.name} className="aspect-square" sizes="15vw" />
              <p className="p-2 text-center text-sm font-medium group-hover:text-primary">{e.name}</p>
            </Link>
          ))}
        </div>
      </Section>

      {recent.length > 0 && (
        <Section title="Bạn đã xem gần đây">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{recent.map(h => <HotelCard key={h.id} hotel={h} />)}</div>
        </Section>
      )}
    </>
  )
}

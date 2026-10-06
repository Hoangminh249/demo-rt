'use client'
import Link from 'next/link'
import { Car, Compass, Ship, BadgePercent, Sparkles } from 'lucide-react'
import { repo } from '@/lib/repo'
import { useAsync, useDemo } from '@/store/provider'
import { DEFAULT_SEARCH, searchToParams } from '@/lib/search-params'
import { SearchBar } from '@/components/site/search-bar'
import { HotelCard, PromoCard, RoomOfferCard } from '@/components/site/cards'
import { Photo, Skeleton } from '@/components/ui'

function Section({ title, href, sub, children }: { title: string; href?: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-foreground sm:text-xl">{title}</h2>
          {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
        </div>
        {href && <Link href={href} className="h-8 shrink-0 text-sm font-medium text-foreground/70 hover:text-foreground hover:underline">Xem tất cả</Link>}
      </div>
      {children}
    </section>
  )
}

// Điểm khác biệt (brief U1): đặt trực tiếp là thêm được xe, tour, du thuyền trong một lần.
const PERKS = [
  { Icon: Car, title: 'Xe đón sân bay', text: 'Rooty Trip đón tận sân bay, đặt cùng phòng' },
  { Icon: Compass, title: 'Tour đón tại khách sạn', text: '4 đảo, Bắc đảo, câu mực đêm' },
  { Icon: Ship, title: 'Du thuyền RIVUS', text: 'Cano riêng, du thuyền hoàng hôn' },
  { Icon: BadgePercent, title: 'Giá thành viên −5%', text: 'Khi đăng nhập, cộng với ưu đãi' },
]

export default function HomePage() {
  const { overlay } = useDemo()
  const personal = overlay.session.customerId === 'C001'
  const s = { ...DEFAULT_SEARCH, dest: '' }
  const banner = useAsync(() => repo.getBanner(), [])
  const hotels = useAsync(() => repo.search({ ...s, sort: 'stars' }), [])
  const promos = useAsync(() => repo.listPromotions(), [])
  const dests = useAsync(() => repo.listDestinations(), [])
  const exps = useAsync(() => repo.listExperiences(), [])
  const forYou = useAsync(() => (personal ? repo.search({ ...s, children: 1, sort: 'recommended' }) : Promise.resolve([])), [personal])
  const recent = repo.hotelsSync().filter(h => overlay.recent.includes(h.slug))

  return (
    <>
      <section className="relative isolate">
        <Photo src="/images/hero.jpg" alt="" className="absolute inset-0 -z-10" priority />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand/80 via-brand/45 to-brand/20" />
        <div className="mx-auto max-w-7xl px-4 pt-14 pb-10 sm:px-6 md:pt-24 md:pb-16">
          <h1 className="max-w-2xl text-2xl font-semibold text-white sm:text-3xl md:text-4xl">{banner.data?.headline ?? 'Ở đâu tại Phú Quốc?'}</h1>
          <p className="mt-3 max-w-xl text-white/85 sm:text-lg">{banner.data?.sub ?? ' '}</p>
          <div className="mt-8 rounded-2xl border border-border bg-card p-4 sm:p-5">
            <SearchBar />
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-card">
        <ul className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          {PERKS.map(({ Icon, title, text }) => (
            <li key={title} className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground"><Icon className="size-5" aria-hidden /></span>
              <span className="min-w-0"><span className="block text-sm font-semibold">{title}</span><span className="block text-sm text-muted-foreground">{text}</span></span>
            </li>
          ))}
        </ul>
      </section>

      {personal && (
        <Section title="Dành cho anh Nguyễn Văn A" sub="Theo 4 lần ở trước: hướng biển, phòng gia đình, có ăn sáng">
          {!forYou.data ? <Skeleton className="h-64" /> : (
            <div className="grid gap-4 xl:grid-cols-2">
              {forYou.data.flatMap(r => r.offers.filter(o => o.personalized && o.left > 0).slice(0, 1).map(o => (
                <RoomOfferCard key={o.rt.room_type_id} hotel={r.hotel} offer={{ ...o, plans: o.plans.filter(p => p.plan.has_breakfast) }} s={{ ...s, children: 1, ages: [6] }} />
              ))).slice(0, 2)}
            </div>
          )}
          <p className="mt-3 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground"><Sparkles className="size-4 text-info" aria-hidden />Tour gợi ý: Bắc đảo – Grand World & Safari (lần trước anh đã đi tour 4 đảo). <Link href="/trai-nghiem/tour" className="font-medium text-foreground underline-offset-4 hover:underline">Xem tour</Link></p>
        </Section>
      )}

      <Section title="Khách sạn & resort" href="/khach-san" sub="Giá tham khảo 12–15/10/2026, 2 người lớn + 1 trẻ em">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {!hotels.data ? Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-96" />)
            : hotels.data.map(r => <HotelCard key={r.hotel.id} hotel={r.hotel} fromPrice={r.fromPrice} href={`/${r.hotel.slug}?${searchToParams(s)}`} />)}
        </div>
      </Section>

      <Section title="Ưu đãi" href="/uu-dai">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {!promos.data ? Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-72" />) : promos.data.slice(0, 3).map(p => <PromoCard key={p.id} promo={p} />)}
        </div>
      </Section>

      <Section title="Điểm đến" href="/diem-den">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {(dests.data ?? []).map(d => (
            <Link key={d.slug} href={`/diem-den/${d.slug}`} className="group relative block overflow-hidden rounded-2xl">
              <Photo src={d.image} alt="" className="aspect-[3/4] transition-transform duration-500 group-hover:scale-[1.03]" sizes="25vw" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
              <span className="absolute inset-x-4 bottom-4 text-base font-semibold text-white">{d.name}</span>
            </Link>
          ))}
          {!dests.data && Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="aspect-[3/4]" />)}
        </div>
      </Section>

      <Section title="Trải nghiệm" href="/trai-nghiem" sub="Đặt cùng phòng ở bước dịch vụ thêm, thanh toán một lần">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {(exps.data ?? []).map(e => (
            <Link key={e.slug} href={`/trai-nghiem/${e.slug}`} className="group overflow-hidden rounded-2xl border border-border bg-card">
              <Photo src={e.image} alt="" className="aspect-square" sizes="(min-width:1024px) 14vw, 25vw" />
              <p className="px-3 py-2.5 text-sm font-medium group-hover:text-primary">{e.name}</p>
            </Link>
          ))}
        </div>
      </Section>

      {recent.length > 0 && (
        <Section title="Bạn đã xem gần đây">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{recent.map(h => <HotelCard key={h.id} hotel={h} />)}</div>
        </Section>
      )}
    </>
  )
}

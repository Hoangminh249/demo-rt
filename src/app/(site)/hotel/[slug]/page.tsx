// Trang khách sạn — wireframe phương án A (khuôn trang tour rootytrip): đường dẫn · bộ ảnh · thanh mục lục dính ·
// nội dung trái (tổng quan, chọn phòng, tiện ích, ăn uống, trải nghiệm, vị trí, chính sách, hỏi đáp) · thẻ giá dính phải.
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense, type ReactNode } from 'react'
import { ArrowUpRight, ChevronDown, MapPin, Navigation } from 'lucide-react'
import { repo } from '@/lib/repo'
import { fmtPrice } from '@/lib/format'
import { BTN, BTN_OUT, CheckItem, CONTAINER, EYEBROW, ICONS, Photo, Stars, TEXT_LINK } from '@/components/site/kit'
import { Gallery } from '@/components/hotel/gallery'
import { TabNav } from '@/components/hotel/tab-nav'
import { Rooms } from '@/components/hotel/rooms'
import { OnlyRooty, PriceCard } from '@/components/hotel/price-card'

export const dynamicParams = false
export const generateStaticParams = () => repo.hotelSlugs().map(slug => ({ slug }))

export async function generateMetadata({ params }: PageProps<'/hotel/[slug]'>) {
  const h = repo.getHotel((await params).slug)
  return h ? { title: `${h.name} — ${h.area}`, description: h.tagline } : {}
}

const TABS: [string, string][] = [['Tổng quan', 'tong-quan'], ['Phòng', 'phong'], ['Tiện ích', 'tien-ich'], ['Ăn uống', 'an-uong'], ['Trải nghiệm', 'trai-nghiem-ks'], ['Vị trí', 'vi-tri'], ['Chính sách', 'chinh-sach'], ['Hỏi đáp', 'hoi-dap']]

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return <section id={id} className="scroll-mt-36 border-t border-border pt-10"><h2 className="text-[26px] font-bold text-brand">{title}</h2>{children}</section>
}

export default async function HotelPage({ params }: PageProps<'/hotel/[slug]'>) {
  const h = repo.getHotel((await params).slug)
  if (!h) notFound()
  const from = repo.fromPrice(h.id)

  return (
    <>
      <nav aria-label="Đường dẫn" className={`${CONTAINER} py-4 text-[14px]`}>
        <ol className="flex flex-wrap items-center gap-2 text-primary">
          <li><Link href="/" className="inline-flex min-h-8 items-center hover:underline">Trang chủ</Link></li>
          <li aria-hidden>—</li>
          <li><Link href="/#khach-san" className="inline-flex min-h-8 items-center hover:underline">Khách sạn</Link></li>
          <li aria-hidden>—</li>
          <li className="font-semibold text-brand" aria-current="page">{h.name}</li>
        </ol>
      </nav>

      <div className={CONTAINER}><Gallery name={h.name} images={h.gallery} /></div>
      <TabNav tabs={TABS} />

      <div className={`${CONTAINER} grid gap-10 pt-10 lg:grid-cols-[minmax(0,1fr)_340px]`}>
        <div className="grid min-w-0 gap-12">
          <section id="tong-quan" className="scroll-mt-36">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1"><span className={EYEBROW}>{h.area}</span><Stars n={h.stars} /></div>
            <h1 className="mt-2 text-[34px] leading-tight font-bold text-brand sm:text-[42px]">{h.name}</h1>
            <ul className="mt-4 grid gap-3 border-b border-border pb-5 text-[15px] sm:grid-cols-2">
              {h.facts.map(f => { const Icon = ICONS[f.icon]; return <li key={f.label} className="flex gap-2.5"><Icon className="mt-1 size-4 shrink-0 text-brand" aria-hidden /><span><b className="font-semibold">{f.label}:</b> {f.value}</span></li> })}
            </ul>
            <p className="mt-5 text-[16px] leading-relaxed">{h.description}</p>
            <p className="mt-5 font-semibold text-brand">Điểm nổi bật</p>
            <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">{h.highlights.map(t => <CheckItem key={t}>{t}</CheckItem>)}</ul>
          </section>

          <Suspense fallback={<section id="phong" className="scroll-mt-36 border-t border-border pt-10"><h2 className="text-[26px] font-bold text-brand">Chọn phòng</h2><div className="mt-6 h-64 animate-pulse rounded-2xl bg-muted" /></section>}>
            <Rooms hotel={h} />
          </Suspense>

          <Section id="tien-ich" title="Tiện ích">
            <ul className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              {h.amenities.map(a => { const Icon = ICONS[a.icon]; return <li key={a.label} className="flex items-center gap-3 text-[15px]"><span className="grid size-10 shrink-0 place-items-center rounded-lg bg-mint text-brand"><Icon className="size-5" aria-hidden /></span>{a.label}</li> })}
            </ul>
          </Section>

          <Section id="an-uong" title="Ăn uống">
            <div className="mt-6 grid gap-6 sm:grid-cols-3">
              {h.restaurants.map(r => (
                <article key={r.name}>
                  <Photo src={r.image} alt={r.name} sizes="(min-width: 640px) 33vw, 100vw" className="aspect-[4/3] w-full rounded-xl" />
                  <h3 className="mt-3 text-lg font-bold text-brand">{r.name}</h3>
                  <p className="text-[14px] text-muted-foreground">{r.meta}</p>
                  <p className="mt-1 text-[15px]">{r.desc}</p>
                </article>
              ))}
            </div>
          </Section>

          <Section id="trai-nghiem-ks" title="Trải nghiệm quanh khách sạn">
            <div className="mt-6 grid gap-6 sm:grid-cols-3">
              {h.experiences.map(e => (
                <article key={e.name}>
                  <Photo src={e.image} alt={e.name} sizes="(min-width: 640px) 33vw, 100vw" className="aspect-[4/3] w-full rounded-xl" />
                  <h3 className="mt-3 text-lg font-bold text-brand">{e.name}</h3>
                  <p className="text-[14px] text-muted-foreground">{e.desc}</p>
                  <a href={e.href} className={`mt-1 ${TEXT_LINK}`}>Đặt cùng {e.href.includes('rivus') ? 'RIVUS' : 'Rooty Trip'} <ArrowUpRight className="size-4" aria-hidden /></a>
                </article>
              ))}
            </div>
          </Section>

          <Section id="vi-tri" title="Vị trí">
            <div className="mt-6 grid gap-6 md:grid-cols-[1.4fr_1fr]">
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-mint">
                {/* eslint-disable-next-line @next/next/no-img-element -- SVG bản đồ minh hoạ */}
                <img src="/images/map-phu-quoc.svg" alt="Bản đồ Phú Quốc" className="size-full object-contain" />
              </div>
              <div>
                <p className="flex gap-2 text-[15px]"><MapPin className="mt-0.5 size-4 shrink-0 text-orange" aria-hidden />{h.address}</p>
                <ul className="mt-4 divide-y divide-border">
                  {h.distances.map(([place, time]) => <li key={place} className="flex justify-between gap-4 py-3 text-[15px]"><span>{place}</span><span className="font-medium text-brand">{time}</span></li>)}
                </ul>
                <a href={h.map_url} target="_blank" rel="noopener" className={`mt-4 ${BTN_OUT}`}><Navigation className="size-4" aria-hidden />Chỉ đường Google Maps</a>
              </div>
            </div>
          </Section>

          <Section id="chinh-sach" title="Chính sách">
            <dl className="mt-6 divide-y divide-border rounded-xl border border-border">
              {h.policies.map(([k, v]) => <div key={k} className="grid gap-1 px-5 py-4 sm:grid-cols-[180px_1fr] sm:gap-6"><dt className="font-semibold text-brand">{k}</dt><dd className="text-[15px]">{v}</dd></div>)}
            </dl>
          </Section>

          <Section id="hoi-dap" title="Hỏi đáp">
            <div className="mt-6 divide-y divide-border rounded-xl border border-border">
              {h.faq.map(([q, a], i) => (
                <details key={q} className="group px-5" open={i === 0}>
                  <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 font-semibold text-brand [&::-webkit-details-marker]:hidden">
                    {q}<ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
                  </summary>
                  <p className="pb-4 text-[15px]">{a}</p>
                </details>
              ))}
            </div>
          </Section>
        </div>

        <aside className="hidden lg:block" aria-label="Đặt phòng">
          <div className="sticky top-[150px] grid gap-5">
            <Suspense fallback={<div className="h-[390px] animate-pulse rounded-2xl bg-muted" />}><PriceCard fromPrice={from} /></Suspense>
            <OnlyRooty />
          </div>
        </aside>
      </div>

      {/* Điện thoại: thanh đặt phòng dính đáy */}
      <div id="mobile-book-bar" className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-white px-4 py-3 lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0"><span className="block text-[13px] text-muted-foreground">Giá từ</span><span className="text-lg font-semibold">{fmtPrice(from)}</span><span className="text-[13px] text-muted-foreground"> /đêm</span></p>
          <a href="#phong" className={BTN}>Chọn phòng</a>
        </div>
      </div>
    </>
  )
}

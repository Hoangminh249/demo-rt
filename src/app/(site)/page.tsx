// Trang chủ — wireframe phương án A: banner + thanh chọn nhanh · cam kết · lưới thẻ khách sạn · hệ sinh thái Rooty.
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight, CalendarX, Headset, PlaneLanding, Ship } from 'lucide-react'
import { repo } from '@/lib/repo'
import { fmtPrice } from '@/lib/format'
import { hotelHref } from '@/lib/stay'
import type { Hotel } from '@/lib/types'
import { BTN, CheckItem, CONTAINER, EYEBROW, Photo, SectionTitle, Stars, TEXT_LINK } from '@/components/site/kit'
import { QuickBar } from '@/components/site/quick-bar'

export const metadata = { title: { absolute: 'Rooty Hospitality — Khách sạn Rooty tại Phú Quốc' } }

const PROMISES = [
  [PlaneLanding, 'Đón sân bay miễn phí', 'khi đặt trực tiếp từ 2 đêm'],
  [CalendarX, 'Huỷ miễn phí', 'với gói giá linh hoạt'],
  [Headset, 'Hỗ trợ 7:30 – 21:00', 'người Phú Quốc, nghe máy ngay'],
  [Ship, 'Trọn chuyến đi', 'tour, cano, du thuyền Rooty'],
] as const

const ECOSYSTEM = [
  ['/images/addons/transfer.jpg', 'Xe đón sân bay', 'Tặng khi đặt phòng trực tiếp từ 2 đêm. Tài xế Rooty Trip đón tận cửa ra.', 'Gọi đặt xe', 'tel:0886068886'],
  ['/images/addons/cau-muc.jpg', 'Tour cano 4 đảo + cáp treo', 'Rooty Trip đón tại sảnh khách sạn, đi Nam đảo trong ngày.', 'Xem tour trên Rooty Trip', 'https://rootytrip.com/san-pham/tour-cano-dao-cap-treo-va-buffet-hon-thom/'],
  ['/images/experiences/rivus.jpg', 'Du thuyền RIVUS', 'Cano riêng, du thuyền ngắm hoàng hôn cho gia đình và nhóm bạn.', 'Xem trên RIVUS', 'https://rivusyacht.com'],
] as const

function HotelCard({ h }: { h: Hotel }) {
  const href = hotelHref(h.slug)
  return (
    <article className="group flex flex-col">
      <Link href={href} className="block overflow-hidden rounded-xl" tabIndex={-1} aria-hidden>
        <Photo src={h.cover} alt="" sizes="(min-width: 768px) 50vw, 100vw" className="aspect-[16/10] w-full transition-transform duration-500 group-hover:scale-[1.03]" />
      </Link>
      <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1"><span className={EYEBROW}>{h.area}</span><Stars n={h.stars} /></div>
      <h3 className="mt-2 text-2xl font-bold text-brand"><Link href={href} className="hover:text-primary">{h.name}</Link></h3>
      <p className="mt-1 text-[15px] text-muted-foreground">{h.tagline}</p>
      <ul className="mt-4 grid gap-2.5">{h.highlights.slice(0, 3).map(t => <CheckItem key={t}>{t}</CheckItem>)}</ul>
      <div className="mt-auto pt-6">
        <div className="flex flex-wrap items-end justify-between gap-4 border-t border-border pt-5">
          <p>
            <span className="block text-[13px] text-muted-foreground">Giá từ</span>
            <span className="text-2xl font-semibold text-foreground">{fmtPrice(repo.fromPrice(h.id))}</span>
            <span className="text-[14px] text-muted-foreground"> /đêm</span>
          </p>
          <Link href={href} className={BTN}>Xem khách sạn <ArrowRight className="size-4" aria-hidden /></Link>
        </div>
      </div>
    </article>
  )
}

export default function HomePage() {
  const hotels = repo.listHotels()
  return (
    <>
      <section className="relative">
        <Image src="/images/hero.jpg" alt="" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-black/5" />
        <div className={`${CONTAINER} relative flex min-h-[520px] flex-col justify-end pt-24 pb-10 lg:min-h-[600px]`}>
          <p className="text-[14px] font-semibold tracking-[0.12em] text-yellow uppercase">Rooty Hospitality · Phú Quốc</p>
          <h1 className="mt-3 max-w-2xl text-[36px] leading-[1.1] font-bold text-white sm:text-[52px]">Nghỉ dưỡng Phú Quốc <br className="hidden sm:block" />cùng Rooty</h1>
          <p className="mt-4 max-w-xl text-[17px] text-white/90">Khách sạn của người Phú Quốc, đặt trực tiếp để có giá tốt và xe đón sân bay.</p>
          <div className="mt-8"><QuickBar hotels={hotels.map(h => ({ slug: h.slug, name: h.name }))} /></div>
        </div>
      </section>

      <section id="vi-sao" aria-label="Vì sao đặt trực tiếp" className={`${CONTAINER} grid scroll-mt-24 grid-cols-1 gap-6 py-10 sm:grid-cols-2 lg:grid-cols-4`}>
        {PROMISES.map(([Icon, t, s]) => (
          <div key={t} className="flex items-start gap-3">
            <Icon className="size-9 shrink-0 text-orange" strokeWidth={1.75} aria-hidden />
            <div><p className="font-semibold text-brand">{t}</p><p className="text-[14px] text-muted-foreground italic">{s}</p></div>
          </div>
        ))}
      </section>

      <section id="khach-san" className="scroll-mt-16 bg-gradient-to-b from-mint to-white py-16">
        <div className={CONTAINER}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionTitle lead="Khách sạn của" accent="Rooty" />
            <p className="text-[15px] text-muted-foreground">{hotels.length} khách sạn tại Phú Quốc</p>
          </div>
          <div className="mt-10 grid gap-10 md:grid-cols-2 md:gap-8">{hotels.map(h => <HotelCard key={h.slug} h={h} />)}</div>
        </div>
      </section>

      <section id="trai-nghiem" className={`${CONTAINER} scroll-mt-20 pt-16`}>
        <SectionTitle lead="Trọn chuyến đi cùng" accent="Rooty" />
        <p className="mt-2 max-w-2xl text-[16px] text-muted-foreground">Khách sạn của Rooty nằm trong cùng hệ sinh thái với tour, cano và du thuyền ở Phú Quốc.</p>
        <div className="mt-8 grid gap-8 md:grid-cols-3">
          {ECOSYSTEM.map(([img, t, d, l, href]) => (
            <article key={t}>
              <Photo src={img} alt={t} sizes="(min-width: 768px) 33vw, 100vw" className="aspect-[4/3] w-full rounded-xl" />
              <h3 className="mt-4 text-lg font-bold text-brand">{t}</h3>
              <p className="mt-1 text-[15px] text-muted-foreground">{d}</p>
              <a href={href} className={`mt-2 ${TEXT_LINK}`}>{l} <ArrowUpRight className="size-4" aria-hidden /></a>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}

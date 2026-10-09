// Trang chủ — banner (70% ảnh, 30% dải kính: chọn nhanh + những gì đã gồm) · khách sạn (lưới so le theo Figma) · banner ưu đãi ·
// câu chuyện thương hiệu · trọn chuyến đi. Liquid glass chỉ ở nhãn trên ảnh và các tấm kính đè lên ảnh.
import type { CSSProperties, ReactNode } from 'react'
import { ArrowRight, ArrowUpRight, Bus, Coffee, MessageCircle, Receipt } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { cn } from 'cn'
import { Link } from '@/i18n/navigation'
import { hotelApi } from '@/api/hotel'
import { siteApi } from '@/api/site'
import { fmtDate, fmtPrice, today } from '@/lib/format'
import { defaultStay, hotelHref } from '@/lib/stay'
import type { Hotel } from '@/types/hotel'
import type { Locale } from '@/types/global'
import { CONTAINER, Photo } from '@/components/site/kit'
import { HeroSlides } from '@/components/site/hero-slides'
import { QuickBar } from '@/components/site/quick-bar'

// Dựng tĩnh, làm mới mỗi 10 phút ("Giá từ" lấy từ Gohost, cache 1 giờ trong src/lib/gohost.ts).
export const revalidate = 600

export async function generateMetadata({ params }: PageProps<'/[locale]'>) {
  const t = await getTranslations({ locale: (await params).locale as Locale, namespace: 'Meta' })
  return { title: { absolute: t('title') } }
}

const PROMISE_ICONS = [Bus, Coffee, Receipt, MessageCircle]
// ponytail: ảnh lấy tạm từ Figma (public/home) — thay bằng video banner và ảnh thật khi có.
const HERO = [{ src: '/home/hero-1.jpg', focus: '50% 40%' }, { src: '/home/hero-2.jpg', focus: 'center' }, { src: '/home/hero-3.jpg', focus: 'center' }]
// Khách sạn chưa có ảnh (Calista, chưa chụp) dùng tạm ảnh Figma /home/hotel-sample.jpg trên trang chủ.
// ponytail: 5 khách sạn mẫu của Figma để lưới đủ 7 ô — xoá mảng này trước khi go-live / khi có khách sạn thật thứ 3.
const SAMPLES = [['Wyndham Grand', '/home/hotel-sample.jpg'], ['Wyndham Garden', '/home/hero-2.jpg'], ['Casepia', '/home/hotel-sample.jpg'], ['La Racine', '/home/hero-2.jpg'], ['Almafi', '/home/hotel-sample.jpg']] as const
// Lưới so le 3 cột của Figma: chiều cao từng ô theo cột (máy tính). Điện thoại: một cột, ô cao đều.
const BENTO = [[560, 320], [320, 560], [420, 218, 218]]
const ECO = [{ img: '/home/shuttle.jpg', href: null, warm: false }, { img: '/home/story.jpg', href: 'https://rootytrip.com', warm: true }, { img: '/home/hero-3.jpg', href: 'https://rivusyacht.com', warm: false }]

const BTN_SM = 'inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-[13px] font-semibold whitespace-nowrap text-white transition-colors hover:bg-primary-hover'
const SAND_BTN = 'inline-flex h-12 items-center gap-2 rounded-lg bg-[#f8d09c] px-7 text-[14px] font-bold text-[#124b43] transition-colors hover:bg-[#fbe0bb]'

/** Ô ảnh của lưới khách sạn / trải nghiệm: ảnh tràn, phủ tối dần xuống, chữ nằm trên ảnh; chỉ nhãn là kính. */
function ImageCard({ img, alt, h, tag, warm, children }: { img: string | null; alt: string; h: number; tag: string; warm?: boolean; children: ReactNode }) {
  return (
    <article className="group relative h-[340px] overflow-hidden rounded-2xl lg:h-(--h)" style={{ '--h': `${h}px` } as CSSProperties}>
      <Photo src={img} alt={alt} sizes="(min-width: 1024px) 400px, 100vw" className="absolute! inset-0 transition-transform duration-500 group-hover:scale-[1.04]" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/5 to-[rgb(10_40_32/0.86)]" />
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-2 p-5 text-white sm:p-6">
        <span className={cn('glass-tag', warm && 'glass-tag-warm')}>{tag}</span>
        {children}
      </div>
    </article>
  )
}

function HotelCard({ h, from, now, height }: { h: Hotel; from: number | null; now: string; height: number }) {
  const t = useTranslations()
  const locale = useLocale()
  const href = hotelHref(h.slug)
  const tall = height >= 500
  return (
    <ImageCard img={h.cover ?? '/home/hotel-sample.jpg'} alt={h.cover ? h.name : ''} h={height} tag={h.area} warm>
      <h3 className={cn('leading-tight font-bold', tall ? 'text-[28px]' : 'text-[22px]')}><Link href={href} className="hover:underline">{h.name}</Link></h3>
      <p className="text-[13px] leading-relaxed text-[#c8e8de]">{h.tagline}</p>
      {tall && <ul className="grid gap-1 text-[13px] text-[#a8d5c4]">{h.highlights.slice(0, 3).map(x => <li key={x}>✓ {x}</li>)}</ul>}
      <div className="mt-1 flex w-full flex-wrap items-end justify-between gap-3">
        {from ? (
          <p><span className="block text-[12px] text-[#a8d5c4]">{t('Common.from')} {t('Common.perNight')}</span><span className={cn('font-bold', tall ? 'text-[22px]' : 'text-lg')}>{fmtPrice(from)}</span></p>
        ) : (
          <p>{h.opening && h.opening > now && <span className="block text-[12px] text-[#a8d5c4]">{t('Common.opening', { date: fmtDate(h.opening, locale) })}</span>}<span className="text-[15px] font-semibold">{t('Home.priceByDate')}</span></p>
        )}
        <Link href={href} className={BTN_SM}>{t('Home.viewHotel')} <ArrowRight className="size-3.5" aria-hidden /></Link>
      </div>
    </ImageCard>
  )
}

type Cell = { hotel: Hotel; from: number | null } | { sample: (typeof SAMPLES)[number] }

export default async function HomePage({ params }: PageProps<'/[locale]'>) {
  const locale = (await params).locale as Locale
  setRequestLocale(locale)
  const t = await getTranslations('Home')
  const hotels = hotelApi.list(locale)
  const prices = await Promise.all(hotels.map(h => hotelApi.fromPrice(h.slug)))
  const site = siteApi.info(locale)
  const now = today()
  const promises = t.raw('promises') as [string, string][]
  const story = t.raw('story.items') as [string, string][]
  const eco = t.raw('eco') as [string, string, string, string][]

  // Khách sạn thật đứng đầu cột 1 và 2 (ô lớn), khách sạn mẫu lấp phần còn lại theo thứ tự cột.
  const real: Cell[] = hotels.map((hotel, i) => ({ hotel, from: prices[i] }))
  const fill: Cell[] = SAMPLES.map(sample => ({ sample }))
  const order = [real[0], fill[0], real[1], fill[1], ...real.slice(2), ...fill.slice(2)].filter(Boolean)
  let k = 0
  const columns = BENTO.map(col => col.map(height => ({ cell: order[k++], height })).filter(x => x.cell))

  return (
    <>
      <HeroSlides
        slides={HERO}
        intro={<>
          <p className="text-[14px] font-semibold tracking-[0.12em] text-yellow uppercase">{t('eyebrow')}</p>
          <h1 className="mt-3 max-w-2xl text-[36px] leading-[1.1] font-bold text-white sm:text-[56px]">{t('h1a')} <br className="hidden sm:block" />{t('h1b')}</h1>
          <p className="mt-4 max-w-xl text-[17px] text-white/90">{t('sub')}</p>
        </>}
        bar={<QuickBar hotels={hotels.map(h => ({ slug: h.slug, name: h.name, opening: h.opening }))} now={now} initial={defaultStay(now, hotels[0]?.opening)} />}
        band={
          <ul id="vi-sao" aria-label={t('whyAria')} className="grid scroll-mt-24 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {promises.map(([title, sub], i) => {
              const Icon = PROMISE_ICONS[i]
              return (
                <li key={title} className="flex items-start gap-3.5 text-white">
                  <span className="glass-tag size-12 shrink-0 justify-center rounded-2xl p-0 text-[#f8d09c]"><Icon className="size-[22px]" strokeWidth={1.75} aria-hidden /></span>
                  <span><b className="block font-semibold">{title}</b><span className="text-[14px] text-[#c8e8de]">{sub}</span></span>
                </li>
              )
            })}
          </ul>
        }
      />

      <section id="khach-san" className="scroll-mt-16 bg-[#fffdf8] py-16 lg:py-20">
        <div className={CONTAINER}>
          <p className="text-[12px] font-bold tracking-[0.08em] text-orange uppercase">{t('hotelsEyebrow')}</p>
          <h2 className="mt-2.5 text-[30px] leading-tight font-bold text-brand sm:text-[42px]">{t('hotelsLead')} <span className="text-brand-accent">Rooty</span></h2>
          <p className="mt-2 text-[16px] text-muted-foreground">{t('hotelsSub')}</p>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {columns.map((col, c) => (
              <div key={c} className="flex flex-col gap-6">
                {col.map(({ cell, height }) => 'hotel' in cell
                  ? <HotelCard key={cell.hotel.slug} h={cell.hotel} from={cell.from} now={now} height={height} />
                  : (
                    <ImageCard key={cell.sample[0]} img={cell.sample[1]} alt={cell.sample[0]} h={height} tag={t('sampleTag')}>
                      <h3 className="text-xl font-bold">{cell.sample[0]}</h3>
                      <p className="text-[13px] text-[#c8e8de]">{t('sampleDesc')}</p>
                      <p className="text-[15px] font-semibold">{t('samplePrice')}</p>
                    </ImageCard>
                  ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ưu đãi + câu chuyện: hai khối bo góc trong khung nội dung, cách nhau một khe nhỏ */}
      <div className={`${CONTAINER} grid gap-4 sm:gap-5 `}>
      {/* Banner ưu đãi theo Figma: ảnh, phủ xanh từ trái sang, chỉ nhãn là kính */}
      <section aria-labelledby="uu-dai" className="relative isolate flex min-h-[340px] items-center overflow-hidden rounded-2xl bg-[#0f2a29] text-[#fffdf8]">
        <Photo src="/home/hero-2.jpg" alt="" className="absolute! inset-0 -z-10" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[rgb(8_56_48/0.95)] via-[rgb(8_56_48/0.6)] to-transparent" />
        <div className="flex flex-col items-start gap-5 px-6 py-12 sm:px-12">
          <span className="glass-tag glass-tag-warm px-3.5 py-1.5">{t('offer.badge')}</span>
          <div>
            <p className="text-[13px] font-semibold text-[#a8d5c4]">{t('offer.sub')}</p>
            <h2 id="uu-dai" className="mt-1.5 text-[32px] leading-[1.1] font-bold sm:text-[44px]">{t('offer.title')}</h2>
          </div>
          <p className="text-[14px]">{t('offer.note')}</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/#khach-san" className={SAND_BTN}>{t('offer.cta')} →</Link>
            <a href={`tel:${site.phone}`} className="inline-flex h-12 items-center rounded-lg border border-white/20 bg-white/10 px-7 text-[14px] font-semibold hover:bg-white/15">{t('offer.call', { phone: site.phone_display })}</a>
          </div>
        </div>
      </section>

      {/* Câu chuyện thương hiệu: ảnh nền, khối chữ trên tấm kính */}
      <section aria-labelledby="cau-chuyen" className="relative isolate overflow-hidden rounded-2xl px-4 py-12 text-white sm:px-10 lg:py-20">
        <Photo src="/home/story.jpg" alt="" className="absolute! inset-0 -z-10" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[rgb(8_56_48/0.15)] to-[rgb(8_56_48/0.6)]" />
        <div className="flex justify-end">
          <div className="glass-dark flex max-w-[560px] flex-col gap-5 rounded-2xl p-6 sm:p-10">
            <p className="text-[12px] font-bold tracking-[0.08em] text-[#f8d09c] uppercase">{t('story.eyebrow')}</p>
            <h2 id="cau-chuyen" className="text-[28px] leading-tight font-bold sm:text-[36px]">{t('story.title')}</h2>
            <p className="text-[15px] leading-[1.8] text-[#d6eee6]">{t('story.body')}</p>
            <ol className="grid gap-3">
              {story.map(([title, desc], i) => (
                <li key={title} className="flex gap-4 rounded-2xl border border-white/25 bg-white/10 px-4 py-4 shadow-[inset_0_1px_0_rgb(255_255_255/0.35)] backdrop-blur-md">
                  <b className="text-[22px] text-[#f8d09c]">0{i + 1}</b>
                  <span><b className="block text-[15px] font-semibold">{title}</b><span className="text-[13px] text-[#c8e8de]">{desc}</span></span>
                </li>
              ))}
            </ol>
            <Link href="/#khach-san" className={`${SAND_BTN} self-start`}>{t('story.cta')}<ArrowRight className="size-4" aria-hidden /></Link>
          </div>
        </div>
      </section>
      </div>

      <section id="trai-nghiem" className={`${CONTAINER} scroll-mt-20 pt-16 lg:pt-20`}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[12px] font-bold tracking-[0.08em] text-orange uppercase">{t('ecoEyebrow')}</p>
            <h2 className="mt-2.5 text-[30px] leading-tight font-bold text-brand sm:text-[38px]">{t('ecoLead')} <span className="text-brand-accent">Rooty</span></h2>
          </div>
        </div>
        <p className="mt-2.5 text-[16px] text-muted-foreground">{t('ecoSub')}</p>
        <div className="mt-9 grid gap-6 md:grid-cols-3">
          {ECO.map((e, i) => {
            const [tag, title, desc, cta] = eco[i]
            return (
              <ImageCard key={title} img={e.img} alt={title} h={420} tag={tag} warm={e.warm}>
                <h3 className="text-[22px] font-bold">{title}</h3>
                <p className="text-[13px] text-[#c8e8de]">{desc}</p>
                <a href={e.href ?? site.zalo} {...(!e.href && { target: '_blank', rel: 'noopener' })} className={`${BTN_SM} mt-1 self-end`}>
                  {cta}{e.href ? <ArrowUpRight className="size-3.5" aria-hidden /> : <ArrowRight className="size-3.5" aria-hidden />}
                </a>
              </ImageCard>
            )
          })}
        </div>
      </section>
    </>
  )
}

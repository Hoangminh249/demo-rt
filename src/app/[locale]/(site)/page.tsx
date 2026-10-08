// Trang chủ (canvas "Trang chủ", 08/10/2026) — banner trượt + thanh tìm phòng đè mép dưới · 4 điều đã gồm · thẻ các khách sạn
// (ảnh và chữ đổi bên xen kẽ; chưa có ảnh mà sắp khai trương thì ô ngày khai trương) · câu chuyện Rooty · hệ sinh thái · liên hệ.
import Image from 'next/image'
import type { ReactNode } from 'react'
import { ArrowRight, ArrowUpRight, Bus, Check, Coffee, MessageCircle, Phone, Receipt } from 'lucide-react'
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
import { BTN, BTN_OUT, CONTAINER, Photo, SectionTitle } from '@/components/site/kit'
import { HeroSlides } from '@/components/site/hero-slides'
import { QuickBar } from '@/components/site/quick-bar'

// Dựng tĩnh, làm mới mỗi 10 phút ("Giá từ" lấy từ Gohost, cache 1 giờ trong src/lib/gohost.ts).
export const revalidate = 600

export async function generateMetadata({ params }: PageProps<'/[locale]'>) {
  const t = await getTranslations({ locale: (await params).locale as Locale, namespace: 'Meta' })
  return { title: { absolute: t('title') } }
}

const PROMISE_ICONS = [Bus, Coffee, Receipt, MessageCircle]
const ECOSYSTEM = [['https://rootytrip.com', '/images/eco/rooty-trip.jpg'], ['https://rivusyacht.com', '/images/eco/rivus.jpg']] as const
const STORY_PHOTO = '/images/pito-hon-thom/terrace-2.jpg'

/** Nhãn nhỏ in hoa có gạch đầu (cam trên nền sáng, cát trên nền tối). */
const Overline = ({ children, dark }: { children: ReactNode; dark?: boolean }) => (
  <p className={cn('flex items-center gap-3.5 text-[12px] font-semibold tracking-[0.2em] uppercase', dark ? 'text-sand' : 'text-orange')}>
    <span className={cn('h-px w-7 sm:w-10', dark ? 'bg-sand' : 'bg-orange')} aria-hidden />{children}
  </p>
)
const H2 = 'mt-4 text-[34px] leading-[1.08] font-semibold tracking-[-0.03em] sm:mt-5 lg:text-[44px]'

/** Chưa có ảnh mà sắp khai trương: ô xanh đậm ghi ngày khai trương thay khung "Ảnh đang cập nhật". */
function OpeningPanel({ date, area }: { date: string; area: string }) {
  const t = useTranslations('Home')
  const [y, m, d] = date.split('-')
  return (
    <div className="absolute inset-0 flex overflow-hidden bg-brand">
      <span className="absolute inset-4 rounded-md border border-sand/35 sm:inset-6" aria-hidden />
      <span className="absolute -top-28 -right-28 size-[420px] rounded-full border border-white/8" aria-hidden />
      <span className="absolute -top-14 -right-14 size-[300px] rounded-full border border-white/8" aria-hidden />
      <div className="relative m-auto text-center text-white">
        <p className="text-[12px] font-semibold tracking-[0.3em] text-sand uppercase">{t('openingLabel')}</p>
        <p className="mt-4 text-[56px] leading-none font-light tracking-[-0.04em] tabular-nums sm:mt-5 sm:text-[72px]">{d} · {m}</p>
        <p className="mt-2.5 text-[16px] font-light tracking-[0.5em] text-white/75 sm:text-[20px]">{y}</p>
        <span className="mx-auto mt-8 block h-px w-10 bg-sand/60" aria-hidden />
        <p className="mt-4 text-[14px] text-white/72">{area}</p>
      </div>
    </div>
  )
}

function HotelCard({ h, from, now, flip }: { h: Hotel; from: number | null; now: string; flip: boolean }) {
  const t = useTranslations()
  const locale = useLocale()
  const href = hotelHref(h.slug)
  const upcoming = !!h.opening && h.opening > now
  return (
    <article className={cn('group grid overflow-hidden rounded-2xl bg-white shadow-[0_30px_60px_-40px_rgb(4_38_32/0.35)]', flip ? 'lg:grid-cols-[5fr_7fr]' : 'lg:grid-cols-[7fr_5fr]')}>
      <Link href={href} tabIndex={-1} aria-hidden className={cn('relative block aspect-[4/3] overflow-hidden lg:aspect-auto lg:min-h-[460px]', flip && 'lg:order-2')}>
        {h.cover || !h.opening ? <>
          <Photo src={h.cover} alt="" sizes="(min-width: 1024px) 700px, 100vw" className="absolute inset-0 transition-transform duration-[1100ms] ease-out group-hover:scale-[1.035]" />
          {!upcoming && <span className="absolute bottom-4 left-4 inline-flex h-8 items-center gap-2 rounded-md bg-white px-3 text-[13px] font-semibold text-brand sm:bottom-6 sm:left-6"><span className="size-1.5 rounded-full bg-brand-accent" />{t('Home.open')}</span>}
        </> : <OpeningPanel date={h.opening} area={h.area} />}
      </Link>
      <div className="flex flex-col p-5 sm:p-8 lg:px-10 lg:pt-10 lg:pb-9">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-[12px] font-semibold tracking-[0.18em] text-orange uppercase">{h.area}</p>
          {upcoming && <span className="inline-flex h-[26px] items-center rounded-md bg-yellow px-2.5 text-[12px] font-semibold text-yellow-foreground">{t('Common.opening', { date: fmtDate(h.opening!, locale) })}</span>}
        </div>
        <h3 className="mt-3 text-[28px] leading-[1.1] font-semibold tracking-[-0.03em] lg:text-[34px]"><Link href={href} className="text-brand transition-colors hover:text-primary">{h.name}</Link></h3>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground sm:text-[16px]">{h.tagline}</p>
        <ul className="mt-5 grid gap-3 text-[14px] leading-normal sm:mt-7 sm:text-[15px]">
          {h.highlights.slice(0, 3).map(x => <li key={x} className="flex gap-3"><Check className="mt-0.5 size-[18px] shrink-0 text-brand-accent" strokeWidth={1.75} aria-hidden />{x}</li>)}
        </ul>
        <div className="mt-auto pt-6 sm:pt-8">
          <div className="flex flex-wrap items-end justify-between gap-4 border-t border-border pt-5 sm:pt-6">
            {from ? (
              <p>
                <span className="block text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">{t('Common.from')}</span>
                <span className="mt-1.5 block whitespace-nowrap"><span className="text-[24px] font-semibold tracking-[-0.02em] text-brand tabular-nums sm:text-[28px] lg:text-[26px]">{fmtPrice(from)}</span><span className="ml-1 text-[14px] text-muted-foreground">{t('Common.perNight')}</span></span>
              </p>
            ) : h.online ? <p className="text-[15px] text-muted-foreground">{t('Home.priceByDate')}</p> : (
              <p>
                <span className="block text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">{t('Home.bookLabel')}</span>
                <span className="mt-2 block text-[15px] font-semibold sm:text-[16px]">{t('Home.bookVia')}</span>
              </p>
            )}
            <Link href={href} className={`${BTN} group/cta`}>{t('Home.viewHotel')}<ArrowRight className="size-4 transition-transform duration-200 group-hover/cta:translate-x-[3px]" aria-hidden /></Link>
          </div>
        </div>
      </div>
    </article>
  )
}

export default async function HomePage({ params }: PageProps<'/[locale]'>) {
  const locale = (await params).locale as Locale
  setRequestLocale(locale)
  const t = await getTranslations('Home')
  const hotels = hotelApi.list(locale)
  const site = siteApi.info(locale)
  const prices = await Promise.all(hotels.map(h => hotelApi.fromPrice(h.slug)))
  const now = today()
  const promises = t.raw('promises') as [string, string][]
  const story = t.raw('storyItems') as [string, string][]
  const eco = t.raw('eco') as [string, string, string, string][]
  // Banner: bộ ảnh banner riêng của từng khách sạn (src/content, có điểm lấy nét). Chưa có ảnh thì chưa lên banner.
  const slides = hotels.flatMap(h => h.hero.map(x => ({ ...x, label: h.name })))

  return (
    <>
      <HeroSlides
        slides={slides}
        checks={t.raw('checks') as string[]}
        intro={<>
          <Overline dark>{t('eyebrow')}</Overline>
          <h1 className="mt-4 max-w-3xl text-[44px] leading-[1.04] font-semibold tracking-[-0.035em] text-white sm:mt-5 sm:text-[56px] lg:text-[64px]">
            {t('h1a')} <br className="hidden sm:block" /><span className="font-light italic">{t('h1b')}</span>
          </h1>
          <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-white/86 sm:mt-5 sm:text-[18px]">{t('sub')}</p>
        </>}
      />

      <div id="tim-phong" className={`${CONTAINER} relative z-10 -mt-16 scroll-mt-28`}>
        <QuickBar hotels={hotels.map(h => ({ slug: h.slug, name: h.name, opening: h.opening }))} now={now} initial={defaultStay(now, hotels[0]?.opening)} />
        <p className="mt-4 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-center text-[13px] text-muted-foreground">
          {t('direct')}<span className="size-[3px] rounded-full bg-border-strong" aria-hidden />
          <a href={site.zalo} target="_blank" rel="noopener" className="font-semibold text-primary hover:text-brand">Zalo · {site.phone_display}</a>
        </p>
      </div>

      <section id="vi-sao" aria-label={t('whyAria')} className={`${CONTAINER} scroll-mt-24 pt-10 pb-12 lg:pt-14 lg:pb-16`}>
        <div className="grid grid-cols-2 border-y border-border lg:grid-cols-4">
          {promises.map(([title, sub], i) => {
            const Icon = PROMISE_ICONS[i]
            return (
              <div key={title} className={cn('py-5 lg:px-7 lg:py-8', i % 2 ? 'border-l border-border pl-3.5' : 'pr-3.5 lg:border-l', i < 2 && 'border-b border-border lg:border-b-0', i === 0 && 'lg:border-l-0 lg:pl-0', i === 3 && 'lg:pr-0')}>
                <Icon className="size-6 text-orange lg:size-7" strokeWidth={1.5} aria-hidden />
                <p className="mt-3 text-[15px] font-semibold text-brand lg:mt-5 lg:text-[16px]">{title}</p>
                <p className="mt-1 text-[13px] leading-normal text-muted-foreground lg:mt-1.5 lg:text-[14px]">{sub}</p>
              </div>
            )
          })}
        </div>
      </section>

      <section id="khach-san" className="scroll-mt-16 bg-muted py-12 lg:py-20">
        <div className={CONTAINER}>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <Overline>{t('hotelsEyebrow')}</Overline>
              <SectionTitle lead={t('hotelsLead')} accent="Rooty" className={H2} />
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground sm:mt-4 sm:text-[17px]">{t('hotelsSub')}</p>
            </div>
            <p className="hidden text-[14px] text-muted-foreground sm:block"><span className="mr-2 text-[32px] font-light tracking-[-0.02em] text-brand tabular-nums">{String(hotels.length).padStart(2, '0')}</span>{t('hotelsCount')}</p>
          </div>
          <div className="mt-8 grid gap-5 lg:mt-10 lg:gap-6">
            {hotels.map((h, i) => <HotelCard key={h.slug} h={h} from={prices[i]} now={now} flip={i % 2 === 1} />)}
          </div>
        </div>
      </section>

      <section className="grid bg-brand lg:min-h-[560px] lg:grid-cols-2">
        <div className="relative aspect-[4/3] lg:aspect-auto">
          <Image src={STORY_PHOTO} alt={t('storyPhoto')} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
        </div>
        <div className="flex max-w-[600px] flex-col justify-center px-4 py-10 text-white sm:px-6 lg:px-14 lg:py-[72px]">
          <Overline dark>{t('storyEyebrow')}</Overline>
          <h2 className="mt-4 text-[32px] leading-[1.15] font-semibold tracking-[-0.03em] sm:mt-5 lg:text-[44px] lg:leading-[1.12]">{t('storyA')} <span className="font-light italic">{t('storyB')}</span></h2>
          <p className="mt-4 text-[15px] leading-[1.7] text-white/78 sm:mt-5 sm:text-[16px]">{t('storyBody')}</p>
          <ol className="mt-7 border-t border-white/16 lg:mt-8">
            {story.map(([title, sub], i) => (
              <li key={title} className="grid grid-cols-[40px_1fr] border-b border-white/16 py-4 sm:grid-cols-[56px_1fr] lg:py-[18px]">
                <span className="text-[13px] font-semibold text-sand tabular-nums sm:text-[14px]">{String(i + 1).padStart(2, '0')}</span>
                <span><span className="block text-[16px] font-semibold sm:text-[17px]">{title}</span><span className="mt-1 block text-[14px] leading-normal text-white/70">{sub}</span></span>
              </li>
            ))}
          </ol>
          <Link href="/#tim-phong" className="mt-7 inline-flex h-11 items-center justify-center gap-2 self-stretch rounded-lg border border-white/55 px-5 text-[15px] font-semibold text-white transition-colors hover:bg-white hover:text-brand sm:self-start lg:mt-8">
            {t('storyCta')}<ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </section>

      <section id="trai-nghiem" className={`${CONTAINER} scroll-mt-20 pt-12 lg:pt-20`}>
        <div className="max-w-2xl">
          <Overline>{t('ecoEyebrow')}</Overline>
          <SectionTitle lead={t('ecoLead')} accent="Rooty" className={H2} />
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground sm:mt-4 sm:text-[17px]">{t('ecoSub')}</p>
        </div>
        <div className="mt-7 grid gap-8 md:grid-cols-2 lg:mt-9">
          {ECOSYSTEM.map(([href, img], i) => {
            const [tag, title, desc, cta] = eco[i]
            return (
              <article key={href} className="group">
                <a href={href} tabIndex={-1} aria-hidden className="relative block aspect-[16/10] overflow-hidden rounded-xl">
                  <Image src={img} alt="" fill sizes="(min-width: 768px) 600px, 100vw" className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]" />
                </a>
                <p className="mt-5 text-[12px] font-semibold tracking-[0.18em] text-orange uppercase">{tag}</p>
                <h3 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-brand sm:text-[26px]">{title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{desc}</p>
                <a href={href} className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-[15px] font-semibold text-brand underline decoration-border-strong underline-offset-[6px] transition-colors hover:decoration-brand">
                  {cta}<ArrowUpRight className="size-4" aria-hidden />
                </a>
              </article>
            )
          })}
        </div>
      </section>

      <section className={`${CONTAINER} pt-12 pb-14 lg:pt-20 lg:pb-24`}>
        <div className="relative flex flex-wrap items-center justify-between gap-6 overflow-hidden rounded-2xl bg-mint px-5 py-7 sm:px-8 lg:px-12 lg:py-10">
          <span className="absolute -right-20 -bottom-40 size-[360px] rounded-full border border-brand/10" aria-hidden />
          <div className="relative max-w-xl">
            <h2 className="text-[26px] leading-[1.2] font-semibold tracking-[-0.03em] text-brand lg:text-[36px] lg:leading-[1.15]">{t('ctaTitle')}</h2>
            <p className="mt-2.5 text-[15px] leading-relaxed text-muted-foreground sm:text-[16px]">{t('ctaBody')}</p>
          </div>
          <div className="relative flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:gap-3">
            <a href={site.zalo} target="_blank" rel="noopener" className={BTN}><MessageCircle className="size-4" aria-hidden />{t('ctaZalo')}</a>
            <a href={`tel:${site.phone}`} className={`${BTN_OUT} tabular-nums`}><Phone className="size-4" aria-hidden />{site.phone_display}</a>
          </div>
        </div>
      </section>
    </>
  )
}

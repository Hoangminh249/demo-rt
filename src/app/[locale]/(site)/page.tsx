// Trang chủ — wireframe phương án A: banner trượt + thanh chọn nhanh · cam kết · lưới thẻ khách sạn · hệ sinh thái Rooty.
import { ArrowRight, ArrowUpRight, CalendarX, Headset, PlaneLanding, Ship } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { repo } from '@/lib/repo'
import { hotelHref } from '@/lib/stay'
import type { Hotel, Locale } from '@/lib/types'
import { BTN, CheckItem, CONTAINER, EYEBROW, Photo, SectionTitle, Stars, TEXT_LINK } from '@/components/site/kit'
import { HeroSlides } from '@/components/site/hero-slides'
import { Price } from '@/components/site/currency'
import { QuickBar } from '@/components/site/quick-bar'

export async function generateMetadata({ params }: PageProps<'/[locale]'>) {
  const t = await getTranslations({ locale: (await params).locale as Locale, namespace: 'Meta' })
  return { title: { absolute: t('title') } }
}

const PROMISE_ICONS = [PlaneLanding, CalendarX, Headset, Ship]
const ECOSYSTEM = [
  ['/images/addons/transfer.jpg', 'tel:0886068886'],
  ['/images/addons/cau-muc.jpg', 'https://rootytrip.com/san-pham/tour-cano-dao-cap-treo-va-buffet-hon-thom/'],
  ['/images/experiences/rivus.jpg', 'https://rivusyacht.com'],
] as const

function HotelCard({ h }: { h: Hotel }) {
  const t = useTranslations()
  const href = hotelHref(h.slug)
  return (
    <article className="group flex flex-col">
      <Link href={href} className="block overflow-hidden rounded-xl" tabIndex={-1} aria-hidden>
        <Photo src={h.cover} alt="" sizes="(min-width: 768px) 50vw, 100vw" className="aspect-[16/10] w-full transition-transform duration-500 group-hover:scale-[1.03]" />
      </Link>
      <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1"><span className={EYEBROW}>{h.area}</span><Stars n={h.stars} /></div>
      <h3 className="mt-2 text-2xl font-bold text-brand"><Link href={href} className="hover:text-primary">{h.name}</Link></h3>
      <p className="mt-1 text-[15px] text-muted-foreground">{h.tagline}</p>
      <ul className="mt-4 grid gap-2.5">{h.highlights.slice(0, 3).map(x => <CheckItem key={x}>{x}</CheckItem>)}</ul>
      <div className="mt-auto pt-6">
        <div className="flex flex-wrap items-end justify-between gap-4 border-t border-border pt-5">
          <p>
            <span className="block text-[13px] text-muted-foreground">{t('Common.from')}</span>
            <span className="text-2xl font-semibold text-foreground"><Price vnd={repo.fromPrice(h.id)} /></span>
            <span className="text-[14px] text-muted-foreground"> {t('Common.perNight')}</span>
          </p>
          <Link href={href} className={BTN}>{t('Home.viewHotel')} <ArrowRight className="size-4" aria-hidden /></Link>
        </div>
      </div>
    </article>
  )
}

export default async function HomePage({ params }: PageProps<'/[locale]'>) {
  const locale = (await params).locale as Locale
  setRequestLocale(locale)
  const t = await getTranslations('Home')
  const hotels = repo.listHotels(locale)
  const promises = t.raw('promises') as [string, string][]
  const eco = t.raw('eco') as [string, string, string][]
  const slides = [...hotels.map(h => ({ src: h.cover, label: h.name, href: hotelHref(h.slug) })), { src: '/images/hero.jpg', label: t('slidePhuQuoc') }]

  return (
    <>
      <HeroSlides
        slides={slides}
        intro={<>
          <p className="text-[14px] font-semibold tracking-[0.12em] text-yellow uppercase">{t('eyebrow')}</p>
          <h1 className="mt-3 max-w-2xl text-[36px] leading-[1.1] font-bold text-white sm:text-[52px]">{t('h1a')} <br className="hidden sm:block" />{t('h1b')}</h1>
          <p className="mt-4 max-w-xl text-[17px] text-white/90">{t('sub')}</p>
        </>}
        bar={<QuickBar hotels={hotels.map(h => ({ slug: h.slug, name: h.name }))} />}
      />

      <section id="vi-sao" aria-label={t('whyAria')} className={`${CONTAINER} grid scroll-mt-24 grid-cols-1 gap-6 py-10 sm:grid-cols-2 lg:grid-cols-4`}>
        {promises.map(([title, sub], i) => {
          const Icon = PROMISE_ICONS[i]
          return (
            <div key={title} className="flex items-start gap-3">
              <Icon className="size-9 shrink-0 text-orange" strokeWidth={1.75} aria-hidden />
              <div><p className="font-semibold text-brand">{title}</p><p className="text-[14px] text-muted-foreground italic">{sub}</p></div>
            </div>
          )
        })}
      </section>

      <section id="khach-san" className="scroll-mt-16 bg-gradient-to-b from-mint to-white py-16">
        <div className={CONTAINER}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionTitle lead={t('hotelsLead')} accent="Rooty" />
            <p className="text-[15px] text-muted-foreground">{t('count', { n: hotels.length })}</p>
          </div>
          <div className="mt-10 grid gap-10 md:grid-cols-2 md:gap-8">{hotels.map(h => <HotelCard key={h.slug} h={h} />)}</div>
        </div>
      </section>

      <section id="trai-nghiem" className={`${CONTAINER} scroll-mt-20 pt-16`}>
        <SectionTitle lead={t('ecoLead')} accent="Rooty" />
        <p className="mt-2 max-w-2xl text-[16px] text-muted-foreground">{t('ecoSub')}</p>
        <div className="mt-8 grid gap-8 md:grid-cols-3">
          {ECOSYSTEM.map(([img, href], i) => {
            const [title, desc, cta] = eco[i]
            return (
              <article key={img}>
                <Photo src={img} alt={title} sizes="(min-width: 768px) 33vw, 100vw" className="aspect-[4/3] w-full rounded-xl" />
                <h3 className="mt-4 text-lg font-bold text-brand">{title}</h3>
                <p className="mt-1 text-[15px] text-muted-foreground">{desc}</p>
                <a href={href} className={`mt-2 ${TEXT_LINK}`}>{cta} <ArrowUpRight className="size-4" aria-hidden /></a>
              </article>
            )
          })}
        </div>
      </section>
    </>
  )
}

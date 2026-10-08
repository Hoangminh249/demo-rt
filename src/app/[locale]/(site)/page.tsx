// Trang chủ — banner trượt + thanh chọn nhanh · 4 điều đã gồm khi ở khách sạn Rooty · thẻ các khách sạn · hệ sinh thái Rooty.
import { ArrowRight, ArrowUpRight, Bus, Coffee, MessageCircle, Receipt } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { hotelApi } from '@/api/hotel'
import { fmtDate, fmtPrice, today } from '@/lib/format'
import { defaultStay, hotelHref } from '@/lib/stay'
import type { Hotel } from '@/types/hotel'
import type { Locale } from '@/types/global'
import { BTN, CheckItem, CONTAINER, EYEBROW, Photo, SectionTitle, TEXT_LINK } from '@/components/site/kit'
import { HeroSlides } from '@/components/site/hero-slides'
import { QuickBar } from '@/components/site/quick-bar'

// Dựng tĩnh, làm mới mỗi 10 phút ("Giá từ" lấy từ Gohost, cache 1 giờ trong src/lib/gohost.ts).
export const revalidate = 600

export async function generateMetadata({ params }: PageProps<'/[locale]'>) {
  const t = await getTranslations({ locale: (await params).locale as Locale, namespace: 'Meta' })
  return { title: { absolute: t('title') } }
}

const PROMISE_ICONS = [Bus, Coffee, Receipt, MessageCircle]
const ECOSYSTEM = ['https://rootytrip.com', 'https://rivusyacht.com']

function HotelCard({ h, from, now }: { h: Hotel; from: number | null; now: string }) {
  const t = useTranslations()
  const locale = useLocale()
  const href = hotelHref(h.slug)
  return (
    <article className="group flex flex-col">
      <Link href={href} className="block overflow-hidden rounded-xl" tabIndex={-1} aria-hidden>
        <Photo src={h.cover} alt="" sizes="(min-width: 768px) 50vw, 100vw" className="aspect-[16/10] w-full transition-transform duration-500 group-hover:scale-[1.03]" />
      </Link>
      <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className={EYEBROW}>{h.area}</span>
        {h.opening && h.opening > now && <span className="inline-flex h-7 items-center rounded-md bg-yellow px-2.5 text-[13px] font-semibold text-yellow-foreground">{t('Common.opening', { date: fmtDate(h.opening, locale) })}</span>}
      </div>
      <h3 className="mt-2 text-2xl font-bold text-brand"><Link href={href} className="hover:text-primary">{h.name}</Link></h3>
      <p className="mt-1 text-[15px] text-muted-foreground">{h.tagline}</p>
      <ul className="mt-4 grid gap-2.5">{h.highlights.slice(0, 3).map(x => <CheckItem key={x}>{x}</CheckItem>)}</ul>
      <div className="mt-auto pt-6">
        <div className="flex flex-wrap items-end justify-between gap-4 border-t border-border pt-5">
          {from ? (
            <p>
              <span className="block text-[13px] text-muted-foreground">{t('Common.from')}</span>
              <span className="text-2xl font-semibold text-foreground">{fmtPrice(from)}</span>
              <span className="text-[14px] text-muted-foreground"> {t('Common.perNight')}</span>
            </p>
          ) : <p className="text-[15px] text-muted-foreground">{t('Home.priceByDate')}</p>}
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
  const hotels = hotelApi.list(locale)
  const prices = await Promise.all(hotels.map(h => hotelApi.fromPrice(h.slug)))
  const now = today()
  const promises = t.raw('promises') as [string, string][]
  const eco = t.raw('eco') as [string, string, string][]
  // Banner: bộ ảnh banner riêng của từng khách sạn (src/content, có điểm lấy nét). Chưa có ảnh thì chưa lên banner.
  const slides = hotels.flatMap(h => h.hero.map(x => ({ ...x, label: h.name, href: hotelHref(h.slug) })))

  return (
    <>
      <HeroSlides
        slides={slides}
        intro={<>
          <p className="text-[14px] font-semibold tracking-[0.12em] text-yellow uppercase">{t('eyebrow')}</p>
          <h1 className="mt-3 max-w-2xl text-[36px] leading-[1.1] font-bold text-white sm:text-[52px]">{t('h1a')} <br className="hidden sm:block" />{t('h1b')}</h1>
          <p className="mt-4 max-w-xl text-[17px] text-white/90">{t('sub')}</p>
        </>}
        bar={<QuickBar hotels={hotels.map(h => ({ slug: h.slug, name: h.name, opening: h.opening }))} now={now} initial={defaultStay(now, hotels[0]?.opening)} />}
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
          <SectionTitle lead={t('hotelsLead')} accent="Rooty" />
          <div className="mt-10 grid gap-10 md:grid-cols-2 md:gap-8">{hotels.map((h, i) => <HotelCard key={h.slug} h={h} from={prices[i]} now={now} />)}</div>
        </div>
      </section>

      <section id="trai-nghiem" className={`${CONTAINER} scroll-mt-20 pt-16`}>
        <SectionTitle lead={t('ecoLead')} accent="Rooty" />
        <p className="mt-2 max-w-2xl text-[16px] text-muted-foreground">{t('ecoSub')}</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {ECOSYSTEM.map((href, i) => {
            const [title, desc, cta] = eco[i]
            return (
              <article key={href} className="flex flex-col rounded-xl border border-border p-5">
                <h3 className="text-lg font-bold text-brand">{title}</h3>
                <p className="mt-1 text-[15px] text-muted-foreground">{desc}</p>
                <a href={href} className={`mt-3 ${TEXT_LINK}`}>{cta} <ArrowUpRight className="size-4" aria-hidden /></a>
              </article>
            )
          })}
        </div>
      </section>
    </>
  )
}

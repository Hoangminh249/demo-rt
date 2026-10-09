// Footer "sang trọng": dải ảnh hoàng hôn + tấm kính mời liên hệ · 4 cột kẻ mảnh vàng cát · một dòng pháp lý.
// Liên hệ là kênh đặt phòng của khách sạn (Zalo/hotline, email) — không phải hotline tour của Rooty Trip.
import { ArrowUpRight, Mail, MessageCircle, Phone } from 'lucide-react'
import { getLocale, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { hotelApi } from '@/api/hotel'
import { siteApi } from '@/api/site'
import { fmtDate, today } from '@/lib/format'
import { hotelHref } from '@/lib/stay'
import type { Locale } from '@/types/global'
import { CONTAINER, Photo } from './kit'
import { Logo } from './header'

const LINK = 'inline-flex min-h-8 items-center gap-1 text-[#e6efe9] transition-colors hover:text-[#f8d09c]'
const COL = 'border-[rgb(248_208_156/0.16)] sm:border-l sm:pl-7'
const HEAD = 'mb-3 text-[11px] font-semibold tracking-[0.18em] text-[#f8d09c] uppercase'

export async function SiteFooter() {
  const t = await getTranslations()
  const locale = (await getLocale()) as Locale
  const site = siteApi.info(locale)
  const year = new Date().getFullYear()
  return (
    <footer id="lien-he" className="mt-20 bg-[#0b2f2a] text-[#e6efe9]">
      <div className="relative isolate">
        <Photo src="/home/hero-3.jpg" alt="" className="absolute! inset-x-0 top-0 -z-10 h-[240px]" />
        <div className="absolute inset-x-0 top-0 -z-10 h-[240px] bg-gradient-to-b from-[rgb(11_47_42/0.2)] via-[rgb(11_47_42/0.45)] to-[#0b2f2a]" />
        <div className={`${CONTAINER} pt-[120px]`}>
          <div className="glass-dark flex flex-wrap items-center justify-between gap-x-8 gap-y-4 rounded-[22px] px-6 py-6 sm:px-9">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.18em] text-[#f8d09c] uppercase">{t('Footer.inviteEyebrow')}</p>
              <p className="mt-1.5 font-serif text-[28px] leading-tight font-medium text-[#fffdf8] sm:text-[34px]">{t('Footer.inviteA')} <em className="text-[#f8d09c]">{t('Footer.inviteB')}</em></p>
            </div>
            <div className="flex items-center gap-5 text-[15px]">
              <a href={`tel:${site.phone}`} className={LINK}><Phone className="size-4 text-[#f8d09c]" aria-hidden />{site.phone_display}</a>
              <span className="h-5 w-px bg-[rgb(248_208_156/0.3)]" aria-hidden />
              <a href={site.zalo} target="_blank" rel="noopener" className={LINK}><MessageCircle className="size-4 text-[#f8d09c]" aria-hidden />Zalo</a>
            </div>
          </div>
        </div>
      </div>

      <div className={`${CONTAINER} grid gap-8 py-12 text-[14px] sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:gap-10`}>
        <div>
          <Link href="/" className="inline-flex items-center gap-3" aria-label={t('Header.home')}>
            <Logo white className="h-10" />
            <span className="h-7 w-px bg-white/40" aria-hidden />
            <span className="text-[15px] font-semibold tracking-wide text-white">Hospitality</span>
          </Link>
          <p className="mt-3 max-w-[300px] leading-relaxed text-[#a9c4bb]">{t('Home.sub')}</p>
          <a href={`mailto:${site.email}`} className={`${LINK} mt-2`}><Mail className="size-4 text-[#f8d09c]" aria-hidden />{site.email}</a>
        </div>
        <nav aria-label={t('Header.hotels')} className={COL}>
          <p className={HEAD}>{t('Header.hotels')}</p>
          <ul className="grid gap-1">
            {hotelApi.list(locale).map(h => (
              <li key={h.slug}><Link href={hotelHref(h.slug)} className={LINK}>{h.name}</Link>{h.opening && h.opening > today() &&<span className="ml-1.5 text-[12px] text-[#a9c4bb]">· {t('Footer.opening', { date: fmtDate(h.opening, locale) })}</span>}</li>
            ))}
          </ul>
        </nav>
        <nav aria-label={t('Footer.support')} className={COL}>
          <p className={HEAD}>{t('Footer.support')}</p>
          <ul className="grid gap-1">
            {([['contactPage', '/lien-he'], ['cancel', '/chinh-sach-huy'], ['terms', '/dieu-khoan-dat-phong'], ['privacy', '/chinh-sach-bao-mat']] as const).map(([k, href]) => (
              <li key={href}><Link href={href} className={LINK}>{t(`Header.${k}`)}</Link></li>
            ))}
          </ul>
        </nav>
        <nav aria-label={t('Footer.ecosystem')} className={COL}>
          <p className={HEAD}>{t('Footer.ecosystem')}</p>
          <ul className="grid gap-1">
            <li><a href="https://rootytrip.com" className={LINK}>{t('Footer.rootyTrip')} <ArrowUpRight className="size-3.5" aria-hidden /></a></li>
            <li><a href="https://rivusyacht.com" className={LINK}>{t('Footer.rivus')} <ArrowUpRight className="size-3.5" aria-hidden /></a></li>
          </ul>
        </nav>
      </div>

      <div className={CONTAINER}>
        <p className="border-t border-[rgb(248_208_156/0.16)] py-5 text-[12px] leading-relaxed text-[#a9c4bb]">
          {t('Footer.legal', { year, company: site.owner.name, id: site.owner.id, address: site.owner.address })}
        </p>
      </div>
    </footer>
  )
}

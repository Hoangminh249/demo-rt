// Footer "Toàn cảnh hoàng hôn" (canvas Footer, phương án A): ảnh cao + câu mời + viên kính liên hệ · 4 cột kẻ mảnh vàng cát · một dòng pháp lý.
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

const LINK = 'inline-flex min-h-8 items-center gap-1 text-[#f2f7f4] transition-colors hover:text-[#f8d09c]'
const COL = 'border-[rgb(248_208_156/0.16)] sm:border-l sm:pl-7'
const CONTACT = 'inline-flex h-12 items-center justify-center gap-2 px-5 text-[#f2f7f4] transition-colors hover:text-[#f8d09c]'
const DIVIDER = 'hidden h-5 w-px bg-[rgb(248_208_156/0.3)] sm:block'
const HEAD = 'mb-3 text-[12px] font-semibold tracking-[0.18em] text-[#f8d09c] uppercase'

export async function SiteFooter() {
  const t = await getTranslations()
  const locale = (await getLocale()) as Locale
  const site = siteApi.info(locale)
  const year = new Date().getFullYear()
  return (
    <footer id="lien-he" className="relative isolate mt-20 overflow-hidden bg-[#164a41] text-[#e6efe9]">
      {/* Ảnh hoàng hôn trải sau cả footer; nền xanh là lớp trong (~85%) để biển mờ hiện qua phần cột.
          Quầng tối sau câu mời giữ chữ không chìm vào nắng. */}
      <Photo src="/home/hero-3.jpg" alt="" className="absolute! inset-0 -z-10 [&_img]:object-bottom" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_55%_42%_at_50%_200px,rgb(8_46_40/0.5),transparent_75%),linear-gradient(to_bottom,rgb(22_74_65/0.15)_0,rgb(22_74_65/0.45)_260px,rgb(22_74_65/0.85)_420px)]" />
      {/* Câu mời chữ có chân ở giữa, một viên kính gom liên hệ */}
      <div className="flex min-h-[340px] flex-col items-center justify-end pb-10 lg:min-h-[380px]">
        <div className={`${CONTAINER} flex flex-col items-center gap-4 text-center`}>
          <p className="text-[13px] font-semibold tracking-[0.2em] text-[#f8d09c] uppercase [text-shadow:0_1px_2px_rgb(0_0_0/0.45),0_0_18px_rgb(0_0_0/0.4)]">{t('Footer.inviteEyebrow')}</p>
          <p className="font-serif text-[36px] leading-[1.02] font-medium text-[#fffdf8] [text-shadow:0_1px_2px_rgb(0_0_0/0.3),0_2px_28px_rgb(0_0_0/0.45)] sm:text-[44px] lg:text-[54px]">
            {t('Footer.inviteA')}<br /><em className="text-[#f8d09c]">{t('Footer.inviteB')}</em>
          </p>
          <div className="glass-dark mt-2 flex w-full flex-col items-stretch gap-1 rounded-[22px] p-1.5 text-[15px] sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:rounded-full">
            <a href={`tel:${site.phone}`} className={CONTACT}><Phone className="size-4 text-[#f8d09c]" aria-hidden />{site.phone_display}</a>
            <span className={DIVIDER} aria-hidden />
            <a href={site.zalo} target="_blank" rel="noopener" className={CONTACT}><MessageCircle className="size-4 text-[#f8d09c]" aria-hidden />Zalo</a>
            <span className={DIVIDER} aria-hidden />
            <a href={`mailto:${site.email}`} className={CONTACT}><Mail className="size-4 text-[#f8d09c]" aria-hidden />{site.email}</a>
          </div>
        </div>
      </div>

      <div className={`${CONTAINER} grid gap-8 py-10 text-[15px] [text-shadow:0_1px_2px_rgb(0_0_0/0.25)] sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:gap-10`}>
        <div>
          <Link href="/" className="inline-flex items-center gap-3" aria-label={t('Header.home')}>
            <Logo white className="h-11" />
            <span className="h-7 w-px bg-white/40" aria-hidden />
            <span className="text-[16px] font-semibold tracking-wide text-white">Hospitality</span>
          </Link>
          <p className="mt-3 max-w-[300px] leading-relaxed text-[#cfe3dc]">{t('Home.sub')}</p>
        </div>
        <nav aria-label={t('Header.hotels')} className={COL}>
          <p className={HEAD}>{t('Header.hotels')}</p>
          <ul className="grid gap-1">
            {hotelApi.list(locale).map(h => (
              <li key={h.slug}><Link href={hotelHref(h.slug)} className={LINK}>{h.name}</Link>{h.opening && h.opening > today() &&<span className="ml-1.5 text-[13px] text-[#cfe3dc]">· {t('Footer.opening', { date: fmtDate(h.opening, locale) })}</span>}</li>
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
        <p className="border-t border-[rgb(248_208_156/0.16)] py-5 text-[13px] leading-relaxed text-[#cfe3dc]">
          {t('Footer.legal', { year, company: site.owner.name, id: site.owner.id, address: site.owner.address })}
        </p>
      </div>
    </footer>
  )
}

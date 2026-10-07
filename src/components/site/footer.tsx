// Footer theo khuôn rootytrip.com: viền trên xanh, nhãn cam in hoa, số điện thoại xanh lớn, khối pháp lý ở giữa.
// Liên hệ là kênh đặt phòng của khách sạn (Zalo/hotline, email) — không phải hotline tour của Rooty Trip.
import type { ReactNode } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { getLocale, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { repo } from '@/lib/repo'
import { hotelHref } from '@/lib/stay'
import type { Locale } from '@/lib/types'
import { CONTAINER, EYEBROW } from './kit'
import { Logo } from './header'

const Dot = ({ children }: { children: ReactNode }) => (
  <li className="flex items-center gap-2"><span className="size-1.5 shrink-0 rounded-full bg-orange" aria-hidden />{children}</li>
)
const LINK = 'inline-flex min-h-8 items-center gap-1 whitespace-nowrap hover:text-primary'

export async function SiteFooter() {
  const t = await getTranslations('Footer')
  const locale = (await getLocale()) as Locale
  const site = repo.site(locale)
  return (
    <footer id="lien-he" className="mt-20 border-t-4 border-primary bg-white">
      <div className={`${CONTAINER} grid gap-10 py-12 md:grid-cols-[1.1fr_1fr_1fr]`}>
        <div>
          <Logo className="h-12" />
          <p className="mt-5 text-xl font-bold text-brand">{t('contactTitle')}</p>
          <p className={`mt-4 ${EYEBROW}`}>{t('booking')}</p>
          <a href={`tel:${site.phone}`} className="mt-1 flex min-h-10 items-center gap-1.5 text-xl font-semibold text-brand">{site.phone_display} <span className="text-sm font-normal text-muted-foreground">Zalo · {t('hotline')}</span></a>
          <p className={`mt-4 ${EYEBROW}`}>{t('email')}</p>
          <a href={`mailto:${site.email}`} className="mt-1 inline-flex min-h-8 items-center text-brand underline underline-offset-4">{site.email}</a>
        </div>
        <div>
          <p className="text-xl font-bold text-brand">{t('hotels')}</p>
          <ul className="mt-3 grid gap-1 text-[15px]">
            {repo.listHotels(locale).map(h => <Dot key={h.slug}><Link href={hotelHref(h.slug)} className={LINK}>{h.name}</Link></Dot>)}
          </ul>
        </div>
        <div>
          <p className="text-xl font-bold text-brand">{t('ecosystem')}</p>
          <ul className="mt-3 grid gap-1 text-[15px]">
            <li><a href="https://rootytrip.com" className={LINK}>{t('rootyTrip')} <ArrowUpRight className="size-3.5" aria-hidden /></a></li>
            <li><a href="https://rivusyacht.com" className={LINK}>{t('rivus')} <ArrowUpRight className="size-3.5" aria-hidden /></a></li>
          </ul>
        </div>
      </div>
      <div className={`${CONTAINER} border-t border-border py-8 text-center`}>
        <p className="text-lg font-bold text-brand sm:text-xl">{site.owner.name}</p>
        <p className="mt-2 text-[14px] text-muted-foreground">{t('companyId', { id: site.owner.id })} · {t('address', { address: site.owner.address })}</p>
      </div>
      <div className="bg-brand py-4 text-center text-[13px] text-white">{t('copyright', { year: new Date().getFullYear() })}</div>
    </footer>
  )
}

// Footer theo khuôn rootytrip.com: viền trên xanh, nhãn cam in hoa, số điện thoại xanh lớn, khối pháp lý ở giữa.
import type { ReactNode } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { getLocale, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { repo } from '@/lib/repo'
import { hotelHref } from '@/lib/stay'
import { CONTAINER, EYEBROW } from './kit'
import { Logo } from './header'

const Dot = ({ children }: { children: ReactNode }) => (
  <li className="flex items-center gap-2"><span className="size-1.5 shrink-0 rounded-full bg-orange" aria-hidden />{children}</li>
)
const LINK = 'inline-flex min-h-8 items-center gap-1 whitespace-nowrap hover:text-primary'

export async function SiteFooter() {
  const t = await getTranslations('Footer')
  const locale = await getLocale()
  const pay = t.raw('payMethods') as string[]
  return (
    <footer id="lien-he" className="mt-20 border-t-4 border-primary bg-white">
      <div className={`${CONTAINER} grid gap-10 py-12 md:grid-cols-[1.1fr_1fr_1fr]`}>
        <div>
          <Logo className="h-12" />
          <p className="mt-5 text-xl font-bold text-brand">{t('contactTitle')}</p>
          <p className={`mt-4 ${EYEBROW}`}>{t('booking')}</p>
          <a href="tel:0886068886" className="mt-1 flex min-h-10 items-center gap-1.5 text-xl font-semibold text-brand">0886 068 886 <span className="text-sm font-normal text-muted-foreground">{t('city')}</span></a>
          <p className={`mt-4 ${EYEBROW}`}>{t('care')}</p>
          <a href="tel:0339062222" className="mt-1 flex min-h-10 items-center gap-1.5 text-xl font-semibold text-brand">0339 06 2222 <span className="text-sm font-normal text-muted-foreground">Zalo / WhatsApp</span></a>
          <p className={`mt-4 ${EYEBROW}`}>{t('email')}</p>
          <a href="mailto:sales@rootytrip.com" className="mt-1 inline-flex min-h-8 items-center text-brand underline underline-offset-4">sales@rootytrip.com</a>
        </div>
        <div>
          <p className="text-xl font-bold text-brand">{t('hotels')}</p>
          <ul className="mt-3 grid gap-1 text-[15px]">
            {repo.listHotels(locale).map(h => <Dot key={h.slug}><Link href={hotelHref(h.slug)} className={LINK}>{h.name}</Link></Dot>)}
          </ul>
          <p className="mt-8 text-xl font-bold text-brand">{t('policies')}</p>
          {/* Trang chính sách chưa làm trong đợt này */}
          <ul className="mt-3 grid gap-1 text-[15px]">
            {(t.raw('policyItems') as string[]).map(x => <Dot key={x}><span className="inline-flex min-h-8 items-center text-muted-foreground">{x}</span></Dot>)}
          </ul>
        </div>
        <div>
          <p className="text-xl font-bold text-brand">{t('connect')}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {['Facebook', 'Zalo', 'YouTube', 'TikTok'].map(x => <span key={x} className="inline-flex h-10 items-center rounded-lg bg-mint px-3 text-[14px] font-medium text-brand">{x}</span>)}
          </div>
          <p className="mt-6 text-[14px] text-muted-foreground">{t('payWith')} <span className="font-medium text-orange">{pay.map((m, i) => <span key={m}>{i > 0 && ' '}<span className="whitespace-nowrap">{m}{i < pay.length - 1 && ' ·'}</span></span>)}</span></p>
          <p className="mt-6 text-xl font-bold text-brand">{t('ecosystem')}</p>
          <ul className="mt-3 grid gap-1 text-[15px]">
            <li><a href="https://rootytrip.com" className={LINK}>{t('rootyTrip')} <ArrowUpRight className="size-3.5" aria-hidden /></a></li>
            <li><a href="https://rivusyacht.com" className={LINK}>{t('rivus')} <ArrowUpRight className="size-3.5" aria-hidden /></a></li>
          </ul>
        </div>
      </div>
      <div className={`${CONTAINER} border-t border-border py-8 text-center`}>
        <p className="text-lg font-bold text-brand sm:text-xl">{t('company')}</p>
        <p className="mt-2 text-[14px] text-muted-foreground">{t('address')}</p>
      </div>
      <div className="bg-brand py-4 text-center text-[13px] text-white">{t('copyright')}</div>
    </footer>
  )
}

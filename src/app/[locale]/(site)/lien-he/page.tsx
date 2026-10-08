// Liên hệ: kênh trực tiếp (Zalo/hotline, email) · chọn việc cần hỗ trợ → email soạn sẵn tiêu đề + mẫu nội dung · địa chỉ 2 khách sạn · pháp nhân.
// Không có form gửi (chưa có backend nhận) — email/Zalo là kênh khách sạn đang trực.
import { ArrowRight, CalendarPlus, CalendarSync, Mail, MapPin, MessageCircle, Navigation, Phone, ReceiptText, MessagesSquare } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { repo } from '@/lib/repo'
import type { Locale } from '@/lib/types'
import { BTN, BTN_OUT, CONTAINER, Photo, TEXT_LINK } from '@/components/site/kit'
import { PageHero } from '@/components/site/policy-page'

export async function generateMetadata({ params }: PageProps<'/[locale]/lien-he'>) {
  const p = repo.page('lien-he', (await params).locale as Locale)
  return { title: p.title, description: p.lead }
}

const TOPICS = [['new', CalendarPlus], ['change', CalendarSync], ['invoice', ReceiptText], ['other', MessagesSquare]] as const

export default async function ContactPage({ params }: PageProps<'/[locale]/lien-he'>) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
  const t = await getTranslations('Pages.contact')
  const site = repo.site(locale as Locale)
  const hotels = repo.listHotels(locale as Locale)
  const mail = (subject: string, body: string) => `mailto:${site.email}?${new URLSearchParams({ subject, body }).toString().replace(/\+/g, '%20')}`
  const h2 = 'text-[26px] font-bold text-brand'

  return (
    <>
      <PageHero page={repo.page('lien-he', locale as Locale)} />
      <div className={`${CONTAINER} grid gap-14 py-12`}>
        <section aria-labelledby="kenh" className="grid gap-4 md:grid-cols-2">
          <h2 id="kenh" className="sr-only">{t('channels')}</h2>
          <div className="rounded-2xl border border-border bg-white p-6 shadow-card">
            <p className="inline-flex items-center gap-2 text-[14px] text-muted-foreground"><MessageCircle className="size-4 text-orange" aria-hidden />{t('zaloLabel')}</p>
            <p className="mt-2 text-[28px] font-bold text-brand tabular-nums">{site.phone_display}</p>
            <p className="mt-1 text-[15px] text-muted-foreground">{t('zaloBody')}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a href={site.zalo} target="_blank" rel="noopener" className={BTN}><MessageCircle className="size-4" aria-hidden />{t('zaloCta')}</a>
              <a href={`tel:${site.phone}`} className={BTN_OUT}><Phone className="size-4" aria-hidden />{t('callCta')}</a>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-white p-6 shadow-card">
            <p className="inline-flex items-center gap-2 text-[14px] text-muted-foreground"><Mail className="size-4 text-orange" aria-hidden />Email</p>
            <p className="mt-2 text-[22px] font-bold break-all text-brand sm:text-[28px]">{site.email}</p>
            <p className="mt-1 text-[15px] text-muted-foreground">{t('emailBody')}</p>
            <div className="mt-5"><a href={`mailto:${site.email}`} className={BTN_OUT}><Mail className="size-4" aria-hidden />{t('emailCta')}</a></div>
          </div>
        </section>

        <section aria-labelledby="viec">
          <h2 id="viec" className={h2}>{t('topicsTitle')}</h2>
          <p className="mt-1 text-[15px] text-muted-foreground">{t('topicsLead')}</p>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TOPICS.map(([k, Icon]) => (
              <li key={k} className="flex flex-col rounded-2xl border border-border bg-white p-5">
                <span className="grid size-10 place-items-center rounded-lg bg-mint text-brand"><Icon className="size-5" aria-hidden /></span>
                <p className="mt-4 font-semibold text-brand">{t(`topics.${k}.title`)}</p>
                <p className="mt-1 flex-1 text-[14px] text-muted-foreground">{t(`topics.${k}.prep`)}</p>
                <a href={mail(t(`topics.${k}.subject`), t(`topics.${k}.template`))} className={`${TEXT_LINK} mt-3 text-[14px]`}>{t('writeEmail')}<ArrowRight className="size-4" aria-hidden /></a>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="ks">
          <h2 id="ks" className={h2}>{t('hotelsTitle')}</h2>
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {hotels.map(h => (
              <li key={h.slug} className="grid gap-4 rounded-2xl border border-border bg-white p-4 sm:grid-cols-[160px_1fr]">
                <Photo src={h.cover} alt={h.name} sizes="160px" className="aspect-[4/3] w-full rounded-xl sm:aspect-auto sm:h-full" />
                <div className="min-w-0">
                  <Link href={`/hotel/${h.slug}`} className="text-lg font-bold text-brand hover:underline">{h.name}</Link>
                  <p className="mt-1 flex gap-1.5 text-[14px] text-muted-foreground"><MapPin className="mt-0.5 size-4 shrink-0 text-orange" aria-hidden />{h.address}</p>
                  <div className="mt-2 flex flex-wrap gap-x-5">
                    <a href={h.map_url} target="_blank" rel="noopener" className={`${TEXT_LINK} text-[14px]`}><Navigation className="size-4" aria-hidden />{t('directions')}</a>
                    <Link href={`/hotel/${h.slug}`} className={`${TEXT_LINK} text-[14px]`}>{t('viewHotel')}<ArrowRight className="size-4" aria-hidden /></Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="cty" className="rounded-2xl bg-mint px-6 py-5">
          <h2 id="cty" className="text-[13px] font-semibold tracking-wide text-muted-foreground uppercase">{t('companyTitle')}</h2>
          <p className="mt-2 text-lg font-bold text-brand">{site.owner.name}</p>
          <p className="text-[15px]">{t('companyId', { id: site.owner.id })} · {site.owner.address}</p>
          <p className="mt-2 text-[14px] text-muted-foreground">{t('companyNote')}</p>
        </section>
      </div>
    </>
  )
}

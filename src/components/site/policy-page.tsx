// Khung trang tĩnh (liên hệ, chính sách): dải đầu trang nền mint · mục lục dính bên trái · các mục đánh số · thẻ "Cần hỗ trợ?".
import type { ReactNode } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { ArrowRight, FileClock, Mail, MessageCircle } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { fmtDate } from '@/lib/format'
import type { Contact, Page } from '@/lib/types'
import { CONTAINER, EYEBROW, TEXT_LINK } from './kit'

export function PageHero({ page }: { page: Page }) {
  const t = useTranslations('Pages')
  const locale = useLocale()
  return (
    <div className="bg-mint">
      <div className={`${CONTAINER} py-10 sm:py-14`}>
        <nav aria-label={t('breadcrumb')} className="text-[14px]">
          <ol className="flex flex-wrap items-center gap-2 text-primary">
            <li><Link href="/" className="inline-flex min-h-8 items-center hover:underline">{t('home')}</Link></li>
            <li aria-hidden>—</li>
            <li className="font-semibold text-brand" aria-current="page">{page.title}</li>
          </ol>
        </nav>
        <p className={`${EYEBROW} mt-4`}>{page.eyebrow}</p>
        <h1 className="mt-2 text-[32px] leading-tight font-bold text-brand sm:text-[42px]">{page.title}</h1>
        <p className="mt-3 max-w-2xl text-[16px] leading-relaxed">{page.lead}</p>
        <p className="mt-4 flex flex-wrap items-center gap-3 text-[13px] text-muted-foreground">
          {t('updated', { date: fmtDate(page.updated, locale) })}
          {page.draft && <span className="inline-flex h-7 items-center gap-1.5 rounded-md bg-yellow px-2.5 font-semibold text-yellow-foreground"><FileClock className="size-3.5" aria-hidden />{t('draft')}</span>}
        </p>
      </div>
    </div>
  )
}

export function HelpCard({ contact }: { contact: Contact }) {
  const t = useTranslations('Pages')
  return (
    <aside className="rounded-2xl border border-border bg-white p-6 shadow-card">
      <h2 className="text-xl font-bold text-brand">{t('helpTitle')}</h2>
      <p className="mt-1 text-[15px] text-muted-foreground">{t('helpBody')}</p>
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1">
        <a href={contact.zalo} target="_blank" rel="noopener" className={TEXT_LINK}><MessageCircle className="size-4" aria-hidden />Zalo {contact.phone_display}</a>
        <a href={`mailto:${contact.email}`} className={TEXT_LINK}><Mail className="size-4" aria-hidden />{contact.email}</a>
        <Link href="/lien-he" className={TEXT_LINK}>{t('allChannels')}<ArrowRight className="size-4" aria-hidden /></Link>
      </div>
    </aside>
  )
}

/** `extra[id]`: khối riêng chèn vào cuối mục đó (vd bảng phí huỷ theo khách sạn). */
export function PolicyPage({ page, contact, extra = {} }: { page: Page; contact: Contact; extra?: Record<string, ReactNode> }) {
  const t = useTranslations('Pages')
  return (
    <>
      <PageHero page={page} />
      <div className={`${CONTAINER} grid grid-cols-1 gap-10 py-12 lg:grid-cols-[220px_minmax(0,1fr)]`}>
        <nav aria-label={t('toc')} className="hidden lg:block">
          <div className="sticky top-[calc(var(--header-offset)+24px)] transition-[top] duration-300">
            <p className="text-[13px] font-semibold tracking-wide text-muted-foreground uppercase">{t('toc')}</p>
            <ol className="mt-3 grid gap-1 border-l border-border">
              {page.sections.map((s, i) => (
                <li key={s.id}><a href={`#${s.id}`} className="-ml-px flex min-h-9 items-center gap-2 border-l-2 border-transparent pl-3 text-[14px] text-muted-foreground hover:border-primary hover:text-brand">
                  <span className="tabular-nums">{String(i + 1).padStart(2, '0')}</span>{s.title}
                </a></li>
              ))}
            </ol>
          </div>
        </nav>
        <div className="min-w-0 max-w-[780px]">
          {page.sections.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-28 border-b border-border pb-10 not-first:pt-10">
              <p className="text-[14px] font-semibold text-orange tabular-nums">{String(i + 1).padStart(2, '0')}</p>
              <h2 className="mt-1 text-[24px] leading-snug font-bold text-brand">{s.title}</h2>
              {s.body.map(b => <p key={b} className="mt-3 text-[16px] leading-relaxed">{b}</p>)}
              {s.list && (
                <ul className="mt-4 grid gap-2.5">
                  {s.list.map(x => <li key={x} className="flex gap-3 text-[16px] leading-relaxed"><span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-brand-accent" aria-hidden />{x}</li>)}
                </ul>
              )}
              {extra[s.id]}
              {s.link && <Link href={s.link.href} className={`${TEXT_LINK} mt-4`}>{s.link.label}<ArrowRight className="size-4" aria-hidden /></Link>}
            </section>
          ))}
          <div className="mt-10"><HelpCard contact={contact} /></div>
        </div>
      </div>
    </>
  )
}

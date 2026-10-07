'use client'
// Nút "🌐 VI · VND" ở header, mở hộp hai tab Ngôn ngữ / Tiền tệ (khuôn của Klook). Bấm một mục là áp dụng và đóng.
import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Check, Globe } from 'lucide-react'
import { cn } from 'cn'
import { useRouter } from 'next/navigation'
import { usePathname } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'
import { Dialog } from '@/components/ui/overlay'
import { CURRENCIES, setCurrency, useCurrency } from './currency'

const LANGS: Record<(typeof routing.locales)[number], string> = { vi: 'Tiếng Việt', en: 'English' }

export function LocalePicker({ className }: { className?: string }) {
  const t = useTranslations('Picker')
  const locale = useLocale()
  const currency = useCurrency()
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'lang' | 'cur'>('lang')

  // Giữ ngày ở / số khách trên URL khi đổi ngôn ngữ (đọc lúc bấm để header không phải chờ useSearchParams).
  // Tự ghép URL: tiếng Việt không tiền tố (/hotel/…), tiếng Anh thêm /en — tránh sinh ra /vi/… trùng lặp.
  const pickLang = (l: (typeof routing.locales)[number]) => {
    setOpen(false)
    if (l === locale) return
    const path = l === routing.defaultLocale ? pathname : `/${l}${pathname === '/' ? '' : pathname}`
    router.replace(`${path}${window.location.search}`, { scroll: false })
  }

  const option = (active: boolean) => cn(
    'flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-lg px-3 text-left text-[15px] transition-colors hover:bg-item-hover',
    active && 'bg-mint font-semibold text-brand hover:bg-mint',
  )
  const tabBtn = (active: boolean) => cn('-mb-px cursor-pointer border-b-2 px-1 py-3 text-[15px]', active ? 'border-brand font-semibold text-brand' : 'border-transparent text-muted-foreground hover:text-brand')

  return (
    <>
      <button type="button" onClick={() => { setTab('lang'); setOpen(true) }} aria-label={t('trigger', { lang: LANGS[locale], currency })}
        className={cn('inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full px-3 text-[14px] font-semibold transition-colors', className)}>
        <Globe className="size-4" aria-hidden />{locale.toUpperCase()}<span className="opacity-50" aria-hidden>·</span>{currency}
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} title={t('title')}>
        <div role="tablist" className="-mt-4 mb-4 flex gap-6 border-b border-border">
          <button type="button" role="tab" aria-selected={tab === 'lang'} onClick={() => setTab('lang')} className={tabBtn(tab === 'lang')}>{t('language')}</button>
          <button type="button" role="tab" aria-selected={tab === 'cur'} onClick={() => setTab('cur')} className={tabBtn(tab === 'cur')}>{t('currency')}</button>
        </div>
        {tab === 'lang' ? (
          <ul role="tabpanel" className="grid gap-1 sm:grid-cols-2">
            {routing.locales.map(l => (
              <li key={l}>
                <button type="button" lang={l} onClick={() => pickLang(l)} aria-current={l === locale || undefined} className={option(l === locale)}>
                  <span className="w-8 text-[13px] font-semibold text-muted-foreground uppercase">{l}</span>
                  <span className="flex-1">{LANGS[l]}</span>
                  {l === locale && <Check className="size-4 text-primary" aria-hidden />}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div role="tabpanel">
            <ul className="grid gap-1 sm:grid-cols-2">
              {CURRENCIES.map(c => (
                <li key={c.code}>
                  <button type="button" onClick={() => { setCurrency(c.code); setOpen(false) }} aria-current={c.code === currency || undefined} className={option(c.code === currency)}>
                    <span className="w-9 text-[13px] font-semibold text-muted-foreground">{c.code}</span>
                    <span className="flex-1">{t(c.code)}</span>
                    {c.code === currency && <Check className="size-4 text-primary" aria-hidden />}
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[14px] text-muted-foreground">{t('rateNote')}</p>
          </div>
        )}
      </Dialog>
    </>
  )
}

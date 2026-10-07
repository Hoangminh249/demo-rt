'use client'
// Nút "🌐 VI" ở header, mở hộp chọn ngôn ngữ. Giá luôn hiện VND (Gohost tính và thu bằng VND), nên không có chọn tiền tệ.
import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Check, Globe } from 'lucide-react'
import { cn } from 'cn'
import { useRouter } from 'next/navigation'
import { usePathname } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'
import { Dialog } from '@/components/ui/overlay'

const LANGS: Record<(typeof routing.locales)[number], string> = { vi: 'Tiếng Việt', en: 'English' }

export function LocalePicker({ className }: { className?: string }) {
  const t = useTranslations('Picker')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

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

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label={t('trigger', { lang: LANGS[locale] })}
        className={cn('inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full px-3 text-[14px] font-semibold transition-colors', className)}>
        <Globe className="size-4" aria-hidden />{locale.toUpperCase()}
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} title={t('title')}>
        <ul className="grid gap-1 sm:grid-cols-2">
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
      </Dialog>
    </>
  )
}

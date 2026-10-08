import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Be_Vietnam_Pro } from 'next/font/google'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import type { Locale } from '@/types/global'
import '../globals.css'

// rootytrip.com dùng SF Pro Display (không có giấy phép web) và lùi về Be Vietnam Pro → dùng thẳng Be Vietnam Pro.
const font = Be_Vietnam_Pro({ variable: '--font-be-vietnam', subsets: ['latin', 'vietnamese'], weight: ['400', '500', '600', '700'], style: ['normal', 'italic'] })

export const generateStaticParams = () => routing.locales.map(locale => ({ locale }))

export async function generateMetadata({ params }: LayoutProps<'/[locale]'>): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale as Locale, namespace: 'Meta' })
  return {
    title: { default: t('title'), template: '%s · Rooty Hospitality' },
    description: t('description'),
    alternates: { languages: { vi: '/', en: '/en' } },
  }
}

export default async function LocaleLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  setRequestLocale(locale)
  return (
    <html lang={locale} className={font.variable}>
      <body className="min-h-screen font-sans">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  )
}

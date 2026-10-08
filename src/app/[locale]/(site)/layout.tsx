import { setRequestLocale } from 'next-intl/server'
import { SiteHeader } from '@/components/site/header'
import { SiteFooter } from '@/components/site/footer'
import { QueryProvider } from '@/components/query-provider'
import type { Locale } from '@/types/global'

export default async function SiteLayout({ children, params }: LayoutProps<'/[locale]'>) {
  setRequestLocale((await params).locale as Locale) // giữ trang dựng tĩnh
  return (
    <QueryProvider>
      <SiteHeader />
      <main id="main" className="min-h-[60vh]">{children}</main>
      <SiteFooter />
    </QueryProvider>
  )
}

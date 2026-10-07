import { setRequestLocale } from 'next-intl/server'
import { SiteHeader } from '@/components/site/header'
import { SiteFooter } from '@/components/site/footer'
import type { Locale } from '@/lib/types'

export default async function SiteLayout({ children, params }: LayoutProps<'/[locale]'>) {
  setRequestLocale((await params).locale as Locale) // giữ trang dựng tĩnh
  return (
    <>
      <SiteHeader />
      <main id="main" className="min-h-[60vh]">{children}</main>
      <SiteFooter />
    </>
  )
}

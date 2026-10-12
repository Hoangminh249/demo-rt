import { setRequestLocale } from 'next-intl/server'
import { SiteHeader } from '@/components/site/header'
import { SiteFooter } from '@/components/site/footer'
import { QueryProvider } from '@/components/query-provider'
import { LoginProvider } from '@/components/auth/login'
import type { Locale } from '@/types/global'

export default async function SiteLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const locale = (await params).locale as Locale
  setRequestLocale(locale) // giữ trang dựng tĩnh
  // Modal đăng nhập toàn site (Google / email + mã). Phiên đọc ở trình duyệt nên trang vẫn tĩnh.
  return (
    <QueryProvider>
      <LoginProvider lang={locale}>
        <SiteHeader />
        <main id="main" className="min-h-[60vh]">{children}</main>
        <SiteFooter />
      </LoginProvider>
    </QueryProvider>
  )
}

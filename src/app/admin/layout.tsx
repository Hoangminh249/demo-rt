// Root layout riêng của /admin (ngoài [locale], chỉ tiếng Việt). Chặn bằng Basic Auth ở src/proxy.ts.
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Be_Vietnam_Pro } from 'next/font/google'
import '../globals.css'

const font = Be_Vietnam_Pro({ variable: '--font-be-vietnam', subsets: ['latin', 'vietnamese'], weight: ['400', '500', '600', '700'] })

// Mọi trang admin render theo request: không dựng sẵn lúc build (sẽ gọi Gohost), không cache (dữ liệu khách), không prefetch.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s · Admin Rooty Hospitality' },
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" className={`admin ${font.variable}`}>
      <body className="min-h-screen bg-muted font-sans text-foreground antialiased">{children}</body>
    </html>
  )
}

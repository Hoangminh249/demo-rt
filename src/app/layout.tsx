import type { Metadata } from 'next'
import { Be_Vietnam_Pro } from 'next/font/google'
import './globals.css'
import { DemoProvider } from '@/store/provider'
import { DemoBanner } from '@/components/demo-banner'
import { Toaster } from '@/components/ui/overlay'
const font = Be_Vietnam_Pro({ variable: '--font-be-vietnam', subsets: ['latin', 'vietnamese'], weight: ['400', '500', '600', '700'] })

export const metadata: Metadata = {
  title: { default: 'Rooty Hospitality — Đặt phòng trực tiếp tại Phú Quốc', template: '%s · Rooty Hospitality' },
  description: 'Bản demo nền tảng đặt phòng trực tiếp Rooty Hospitality (dữ liệu giả lập).',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="vi" className={font.variable}>
      <body className="min-h-screen font-sans">
        <DemoProvider>
          <DemoBanner />
          {children}
          <Toaster />
        </DemoProvider>
      </body>
    </html>
  )
}

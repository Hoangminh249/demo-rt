import type { Metadata } from 'next'
import { Be_Vietnam_Pro } from 'next/font/google'
import './globals.css'

// rootytrip.com dùng SF Pro Display (không có giấy phép web) và lùi về Be Vietnam Pro → dùng thẳng Be Vietnam Pro.
const font = Be_Vietnam_Pro({ variable: '--font-be-vietnam', subsets: ['latin', 'vietnamese'], weight: ['400', '500', '600', '700'], style: ['normal', 'italic'] })

export const metadata: Metadata = {
  title: { default: 'Rooty Hospitality — Khách sạn Rooty tại Phú Quốc', template: '%s · Rooty Hospitality' },
  description: 'Khách sạn của Rooty tại Phú Quốc. Đặt trực tiếp để có giá tốt và xe đón sân bay. (Bản demo, dữ liệu mẫu)',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="vi" className={font.variable}>
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  )
}

import Link from 'next/link'
import { SiteHeader, Logo } from '@/components/site/site-header'
import { AiAssistant } from '@/components/ai/assistant'

const COLS = [
  { title: 'Khám phá', links: [['/khach-san', 'Khách sạn & Resort'], ['/diem-den', 'Điểm đến'], ['/uu-dai', 'Ưu đãi'], ['/trai-nghiem', 'Trải nghiệm'], ['/cam-nang', 'Cẩm nang']] },
  { title: 'Dịch vụ', links: [['/hoi-nghi-su-kien', 'Hội nghị & Sự kiện'], ['/wedding', 'Wedding'], ['/trai-nghiem/transfer', 'Xe sân bay'], ['/trai-nghiem/rivus', 'Du thuyền RIVUS']] },
  { title: 'Khách hàng', links: [['/my-booking', 'My Booking'], ['/thanh-vien', 'Thành viên / Loyalty'], ['/agent', 'Cổng đại lý (B2B)'], ['/kien-truc', 'Kiến trúc hệ thống (demo)']] },
]

export default function SiteLayout({ children }: LayoutProps<'/'>) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="min-h-[60vh]">{children}</main>
      <footer className="no-print mt-16 border-t border-border bg-card">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-3 text-sm text-muted-foreground">Một website – nhiều khách sạn – một hệ thống đặt phòng. Thành viên hệ sinh thái Rooty: Rooty Trip · RIVUS.</p>
            <p className="mt-3 text-xs text-muted-foreground">CÔNG TY CỔ PHẦN ROOTY TRIP PHÚ QUỐC · Bản demo, không nhận đặt phòng thật.</p>
          </div>
          {COLS.map(c => (
            <div key={c.title}>
              <p className="text-sm font-semibold">{c.title}</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {c.links.map(([href, label]) => <li key={href}><Link href={href} className="hover:text-primary">{label}</Link></li>)}
              </ul>
            </div>
          ))}
        </div>
      </footer>
      <AiAssistant />
    </>
  )
}

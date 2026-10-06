'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, UserRound, Ticket, Scale } from 'lucide-react'
import { useDemo } from '@/store/provider'
import { repo } from '@/lib/repo'
import { cn } from '../ui'
import { Dialog, toast } from '../ui/overlay'

const NAV = [
  { href: '/khach-san', vi: 'Khách sạn & Resort', en: 'Hotels & Resorts' },
  { href: '/diem-den', vi: 'Điểm đến', en: 'Destinations' },
  { href: '/uu-dai', vi: 'Ưu đãi', en: 'Offers' },
  { href: '/trai-nghiem', vi: 'Trải nghiệm', en: 'Experiences' },
  { href: '/hoi-nghi-su-kien', vi: 'Hội nghị & Sự kiện', en: 'Meetings & Events' },
  { href: '/wedding', vi: 'Wedding', en: 'Wedding' },
  { href: '/cam-nang', vi: 'Cẩm nang', en: 'Travel Guide' },
]

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn('flex items-baseline gap-1 font-bold tracking-tight text-brand dark:text-accent', className)} aria-label="Rooty Hospitality — trang chủ">
      <span className="text-xl">Rooty</span><span className="text-xl font-medium text-accent">Hospitality</span>
    </Link>
  )
}

export function SiteHeader() {
  const { overlay, update } = useDemo()
  const path = usePathname()
  const [menu, setMenu] = useState(false)
  const lang = overlay.session.lang
  const me = overlay.session.customerId ? repo.customerBrief(overlay.session.customerId) : null
  const compare = overlay.compare.length

  const toggleLang = () => {
    update(o => ({ session: { ...o.session, lang: o.session.lang === 'vi' ? 'en' : 'vi' } }))
    toast(lang === 'vi' ? 'English (giả lập): mới dịch menu, nội dung vẫn tiếng Việt' : 'Đã chuyển về tiếng Việt', 'info')
  }

  const links = NAV.map(n => (
    <Link key={n.href} href={n.href} onClick={() => setMenu(false)}
      className={cn('rounded-md px-2.5 py-2 text-sm font-medium hover:text-primary', path.startsWith(n.href) ? 'text-primary' : 'text-fg')}>
      {n[lang]}
    </Link>
  ))

  return (
    <header className="no-print sticky top-9 z-40 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <Logo />
        <nav aria-label="Chính" className="ml-4 hidden items-center xl:flex">{links}</nav>
        <div className="ml-auto flex items-center gap-1">
          {compare > 0 && (
            <Link href="/so-sanh" className="relative hidden items-center gap-1 rounded-md px-2 py-2 text-sm font-medium text-fg hover:bg-surface-2 sm:inline-flex">
              <Scale className="size-4" /> So sánh <span className="rounded-full bg-primary px-1.5 text-xs text-white">{compare}</span>
            </Link>
          )}
          <button type="button" onClick={toggleLang} className="rounded-md px-2 py-2 text-sm font-semibold text-muted hover:bg-surface-2" aria-label="Đổi ngôn ngữ">
            {lang === 'vi' ? 'VI' : 'EN'}<span className="text-border"> | </span>{lang === 'vi' ? 'EN' : 'VI'}
          </button>
          <Link href="/my-booking" className="hidden items-center gap-1 rounded-md px-2 py-2 text-sm font-medium hover:bg-surface-2 md:inline-flex">
            <Ticket className="size-4" /> My Booking
          </Link>
          <Link href={me ? '/tai-khoan' : '/thanh-vien'} className="inline-flex items-center gap-1 rounded-md px-2 py-2 text-sm font-medium hover:bg-surface-2">
            <UserRound className="size-4" /> <span className="hidden sm:inline">{me ? me.name : lang === 'vi' ? 'Thành viên' : 'Members'}</span>
          </Link>
          <button type="button" onClick={() => setMenu(true)} className="rounded-md p-2 hover:bg-surface-2 xl:hidden" aria-label="Mở menu"><Menu className="size-5" /></button>
        </div>
      </div>
      <Dialog open={menu} onClose={() => setMenu(false)} title="Menu" side="right">
        <nav aria-label="Menu di động" className="flex flex-col">
          {links}
          <Link href="/my-booking" onClick={() => setMenu(false)} className="rounded-md px-2.5 py-2 text-sm font-medium">My Booking</Link>
          <Link href="/thanh-vien" onClick={() => setMenu(false)} className="rounded-md px-2.5 py-2 text-sm font-medium">Thành viên / Loyalty</Link>
          {compare > 0 && <Link href="/so-sanh" onClick={() => setMenu(false)} className="rounded-md px-2.5 py-2 text-sm font-medium">So sánh ({compare})</Link>}
        </nav>
      </Dialog>
    </header>
  )
}

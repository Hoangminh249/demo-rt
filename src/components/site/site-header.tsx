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
  { href: '/khach-san', vi: 'Khách sạn', en: 'Hotels' },
  { href: '/diem-den', vi: 'Điểm đến', en: 'Destinations' },
  { href: '/uu-dai', vi: 'Ưu đãi', en: 'Offers' },
  { href: '/trai-nghiem', vi: 'Trải nghiệm', en: 'Experiences' },
  { href: '/hoi-nghi-su-kien', vi: 'Sự kiện', en: 'Events' },
  { href: '/wedding', vi: 'Wedding', en: 'Wedding' },
  { href: '/cam-nang', vi: 'Cẩm nang', en: 'Guide' },
]

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn('flex shrink-0 items-center gap-2 text-brand dark:text-brand-accent', className)} aria-label="Rooty Hospitality — trang chủ">
      {/* Dấu chữ R trong ô bo — chưa có logo thật */}
      <span className="grid size-8 place-items-center rounded-lg bg-brand text-sm font-bold text-brand-foreground" aria-hidden>R</span>
      <span className="text-base font-semibold leading-tight">Rooty <span className="font-normal text-primary dark:text-brand-accent">Hospitality</span></span>
    </Link>
  )
}

const ACTION = 'inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground'

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
  const link = (n: (typeof NAV)[number], mobile = false) => {
    const active = path.startsWith(n.href)
    return (
      <Link key={n.href} href={n.href} onClick={() => setMenu(false)} aria-current={active ? 'page' : undefined}
        className={cn('rounded-xl text-sm font-medium transition-colors', mobile ? 'flex h-11 items-center px-3 hover:bg-item-hover' : 'px-3 py-2 hover:text-foreground',
          active ? 'text-foreground' : 'text-muted-foreground', mobile && active && 'bg-secondary')}>
        {n[lang]}
      </Link>
    )
  }

  return (
    <header className="no-print sticky top-9 z-40 border-b border-border bg-card">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:px-6">
        <Logo />
        <nav aria-label="Chính" className="ml-6 hidden items-center lg:flex">{NAV.map(n => link(n))}</nav>
        <div className="ml-auto flex items-center gap-1">
          {compare > 0 && (
            <Link href="/so-sanh" className={cn(ACTION, 'hidden sm:inline-flex')}>
              <Scale className="size-4" aria-hidden />So sánh <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-xs text-primary-foreground">{compare}</span>
            </Link>
          )}
          <button type="button" onClick={toggleLang} className={cn(ACTION, 'px-2.5')} aria-label={lang === 'vi' ? 'Switch to English' : 'Chuyển sang tiếng Việt'}>
            {lang === 'vi' ? 'VI' : 'EN'}
          </button>
          <Link href="/my-booking" className={cn(ACTION, 'hidden md:inline-flex')}><Ticket className="size-4" aria-hidden />My Booking</Link>
          <Link href={me ? '/tai-khoan' : '/thanh-vien'} className={cn(ACTION, 'max-w-48')}>
            <UserRound className="size-4 shrink-0" aria-hidden /><span className="hidden truncate sm:inline">{me ? me.name : lang === 'vi' ? 'Đăng nhập' : 'Sign in'}</span>
          </Link>
          <button type="button" onClick={() => setMenu(true)} className={cn(ACTION, 'px-2.5 lg:hidden')} aria-label="Mở menu"><Menu className="size-5" /></button>
        </div>
      </div>
      <Dialog open={menu} onClose={() => setMenu(false)} title="Menu" side="right">
        <nav aria-label="Menu di động" className="flex flex-col gap-1">
          {NAV.map(n => link(n, true))}
          <div className="my-2 border-t border-border" />
          <Link href="/my-booking" onClick={() => setMenu(false)} className="flex h-11 items-center rounded-xl px-3 text-sm font-medium hover:bg-item-hover">My Booking</Link>
          <Link href="/thanh-vien" onClick={() => setMenu(false)} className="flex h-11 items-center rounded-xl px-3 text-sm font-medium hover:bg-item-hover">Thành viên</Link>
          {compare > 0 && <Link href="/so-sanh" onClick={() => setMenu(false)} className="flex h-11 items-center rounded-xl px-3 text-sm font-medium hover:bg-item-hover">So sánh ({compare})</Link>}
        </nav>
      </Dialog>
    </header>
  )
}

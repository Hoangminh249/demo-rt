'use client'
// Header theo hành vi rootytrip.com: trang chủ trong suốt đè lên banner (chữ, logo trắng), cuộn xuống thì nền trắng.
// Thêm: cuộn xuống quá banner thì header ẩn, kéo lên lại thì hiện — trang khách sạn có thêm chỗ cho thanh mục lục.
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ArrowUpRight, Menu } from 'lucide-react'
import { cn } from 'cn'
import { Link, usePathname } from '@/i18n/navigation'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { CONTAINER } from './kit'
import { LocalePicker } from './locale-picker'

export function Logo({ className = 'h-9 lg:h-10', white }: { className?: string; white?: boolean }) {
  return <Image src="/images/brand/rooty-trip-logo.png" alt="Rooty Trip" width={286} height={84} className={cn('w-auto', !white && 'logo-green', className)} />
}

function useScrollState() {
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  useEffect(() => {
    let last = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 8)
      if (Math.abs(y - last) < 6) return
      setHidden(y > 400 && y > last)
      last = y
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  // Thanh mục lục và thẻ giá dính đọc biến --header-offset để dời lên khi header ẩn (globals.css).
  useEffect(() => { document.documentElement.toggleAttribute('data-header-hidden', hidden) }, [hidden])
  return [scrolled, hidden] as const
}

export function SiteHeader() {
  const t = useTranslations('Header')
  const overlay = usePathname() === '/'
  const [scrolled, hidden] = useScrollState()
  const [open, setOpen] = useState(false)
  const clear = overlay && !scrolled && !open

  const NAV = [[t('hotels'), '/#khach-san'], [t('direct'), '/#vi-sao'], [t('experiences'), '/#trai-nghiem'], [t('contact'), '#lien-he']] as const
  const link = cn('rounded-md px-3 py-2 text-[14px] font-medium uppercase transition-colors', clear ? 'text-white hover:text-yellow' : 'text-foreground hover:text-primary')
  const icon = clear ? 'text-white hover:bg-white/15' : 'text-brand hover:bg-mint'

  return (
    <header className={cn(
      'top-0 z-40 border-b transition-[background-color,border-color,translate] duration-300',
      overlay ? 'fixed inset-x-0' : 'sticky',
      clear ? 'border-transparent bg-transparent' : 'border-border bg-white',
      hidden && !open && '-translate-y-full',
    )}>
      <div className={`${CONTAINER} flex h-16 items-center gap-6 lg:h-[72px]`}>
        <Link href="/" className="flex shrink-0 items-center gap-3" aria-label={t('home')}>
          <Logo white={clear} />
          <span className={cn('h-7 w-px', clear ? 'bg-white/50' : 'bg-border-strong')} aria-hidden />
          <span className={cn('text-[15px] font-semibold tracking-wide', clear ? 'text-white' : 'text-primary')}>Hospitality</span>
        </Link>
        <nav aria-label={t('mainNav')} className="ml-4 hidden items-center gap-1 lg:flex">
          {NAV.map(([label, href]) => <Link key={href} href={href} className={link}>{label}</Link>)}
          <a href="https://rootytrip.com" className={cn(link, 'inline-flex items-center gap-1')}>Rooty Trip <ArrowUpRight className="size-3.5" aria-hidden /></a>
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <LocalePicker className={cn('hidden lg:inline-flex', icon)} />
          <button type="button" onClick={() => setOpen(true)} className={cn('inline-flex size-10 cursor-pointer items-center justify-center rounded-lg transition-colors lg:hidden', icon)} aria-label={t('openMenu')}>
            <Menu className="size-6" aria-hidden />
          </button>
        </div>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[280px] gap-1 bg-white p-4 shadow-modal data-closed:duration-350 data-open:duration-500">
          <SheetTitle className="sr-only">{t('menu')}</SheetTitle>
          <SheetDescription className="sr-only">{t('menuDesc')}</SheetDescription>
          <Logo className="mb-4 h-9 self-start" />
          {NAV.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)} className="flex h-11 items-center rounded-lg px-3 text-[15px] font-medium uppercase hover:bg-mint">{label}</Link>)}
          <a href="https://rootytrip.com" className="flex h-11 items-center gap-1 rounded-lg px-3 text-[15px] font-medium uppercase hover:bg-mint">Rooty Trip <ArrowUpRight className="size-3.5" aria-hidden /></a>
          <div className="mt-4 border-t border-border pt-4"><LocalePicker className="w-full justify-start rounded-lg border border-border-strong text-brand hover:bg-mint" /></div>
        </SheetContent>
      </Sheet>
    </header>
  )
}

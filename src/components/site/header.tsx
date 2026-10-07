'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { ArrowUpRight, Menu, Phone } from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { BTN, CONTAINER } from './kit'

const NAV = [['Khách sạn', '/#khach-san'], ['Đặt trực tiếp', '/#vi-sao'], ['Trải nghiệm', '/#trai-nghiem'], ['Liên hệ', '#lien-he']] as const
export const HOTLINE = '0886 068 886'

export function Logo({ className = 'h-9 lg:h-10' }: { className?: string }) {
  return <Image src="/images/brand/rooty-trip-logo.png" alt="Rooty Trip" width={286} height={84} className={`logo-green w-auto ${className}`} />
}

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const link = 'text-[14px] font-medium uppercase text-foreground transition-colors hover:text-primary'
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white">
      <div className={`${CONTAINER} flex h-16 items-center gap-6 lg:h-[72px]`}>
        <Link href="/" className="flex shrink-0 items-center gap-3" aria-label="Rooty Hospitality, trang chủ">
          <Logo />
          <span className="h-7 w-px bg-border-strong" aria-hidden />
          <span className="text-[15px] font-semibold tracking-wide text-primary">Hospitality</span>
        </Link>
        <nav aria-label="Chính" className="ml-4 hidden items-center gap-1 lg:flex">
          {NAV.map(([t, h]) => <Link key={h} href={h} className={`${link} rounded-md px-3 py-2`}>{t}</Link>)}
          <a href="https://rootytrip.com" className={`${link} inline-flex items-center gap-1 rounded-md px-3 py-2`}>Rooty Trip <ArrowUpRight className="size-3.5" aria-hidden /></a>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <a href="tel:0886068886" className="hidden h-10 items-center gap-2 rounded-lg px-3 text-[15px] font-semibold text-brand transition-colors hover:bg-mint sm:inline-flex">
            <Phone className="size-4 text-orange" aria-hidden />{HOTLINE}
          </a>
          <button type="button" onClick={() => setOpen(true)} className="inline-flex size-10 items-center justify-center rounded-lg text-brand hover:bg-mint lg:hidden" aria-label="Mở menu">
            <Menu className="size-6" aria-hidden />
          </button>
        </div>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[280px] gap-1 bg-white p-4 shadow-modal data-closed:duration-350 data-open:duration-500">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SheetDescription className="sr-only">Điều hướng chính</SheetDescription>
          <Logo className="mb-4 h-9 self-start" />
          {NAV.map(([t, h]) => <Link key={h} href={h} onClick={() => setOpen(false)} className="flex h-11 items-center rounded-lg px-3 text-[15px] font-medium uppercase hover:bg-mint">{t}</Link>)}
          <a href="https://rootytrip.com" className="flex h-11 items-center gap-1 rounded-lg px-3 text-[15px] font-medium uppercase hover:bg-mint">Rooty Trip <ArrowUpRight className="size-3.5" aria-hidden /></a>
          <a href="tel:0886068886" className={`${BTN} mt-4`}><Phone className="size-4" aria-hidden />Gọi {HOTLINE}</a>
        </SheetContent>
      </Sheet>
    </header>
  )
}

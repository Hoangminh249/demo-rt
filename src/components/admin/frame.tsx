'use client'
// Khung app admin (nằm ở layout nên giữ nguyên khi chuyển trang): sidebar trắng không viền phải trên nền xám,
// thanh header h-16 trắng, một đường kẻ border-border chạy liền dưới đầu sidebar và dưới header.
// Từ lg: sidebar thu về dải icon w-16 (nút ở đầu header, nhớ bằng cookie). Dưới lg: sidebar thành panel trượt (☰).
// "Khách sạn" là mục cha có menu con (từng khách sạn); lúc thu gọn, bấm icon thì menu con bật ra bên phải.
import { useId, useState, type ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { CalendarCheck, ChevronDown, Hotel, LayoutDashboard, LogOut, PanelLeftClose, PanelLeftOpen, type LucideIcon } from 'lucide-react'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useAdminOverview, useLogout } from '@/hooks/use-admin'
import { MobileNav } from './mobile-nav'
import { SIDEBAR_COOKIE } from './ui'

export interface FrameHotel { slug: string; name: string }

const ROW = 'relative flex h-10 w-full shrink-0 items-center gap-2.5 rounded-xl px-3 text-sm whitespace-nowrap text-foreground/70 outline-hidden transition-colors'
const IDLE = 'hover:bg-item-hover hover:text-foreground'
const ON = 'bg-tab-selected font-medium text-foreground'
const fade = (hidden: boolean) => cn('transition-opacity duration-150 motion-reduce:transition-none', hidden && 'opacity-0')

/** Tooltip tên mục, chỉ bật lúc thu gọn (lúc mở chữ đã hiện). Luôn bọc để thu/mở không gắn lại link. */
function Tip({ label, collapsed, children }: { label: string; collapsed: boolean; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right" className={cn(!collapsed && 'hidden')}>{label}</TooltipContent>
    </Tooltip>
  )
}

function NavItem({ href, icon: Icon, label, active, collapsed, count }: { href: string; icon: LucideIcon; label: string; active: boolean; collapsed: boolean; count?: number }) {
  return (
    <Tip label={count ? `${label} · ${count} việc cần xử lý` : label} collapsed={collapsed}>
      <Link href={href} aria-current={active ? 'page' : undefined} className={cn(ROW, active ? ON : IDLE)}>
        <Icon className="size-4 shrink-0" aria-hidden />
        <span className={cn('min-w-0 flex-1 truncate', fade(collapsed))}>{label}</span>
        {!!count && (
          <>
            {/* Lúc mở: số trơn. Lúc thu: chấm xám ở góc icon. Số đọc cho trình đọc màn hình nằm ở sr-only. */}
            <span aria-hidden className={cn('shrink-0 text-xs tabular-nums', active ? 'text-foreground' : 'text-muted-foreground', fade(collapsed))}>{count}</span>
            <span aria-hidden className={cn('absolute top-2 left-6 size-1.5 rounded-full bg-foreground/50', fade(!collapsed))} />
            <span className="sr-only">, {count} việc cần xử lý</span>
          </>
        )}
      </Link>
    </Tip>
  )
}

/** Mục cha "Khách sạn": lúc mở là nút mở/đóng menu con (trượt bằng grid-rows); lúc thu là nút bật menu con sang phải. */
function HotelsGroup({ hotels, pathname, collapsed }: { hotels: FrameHotel[]; pathname: string; collapsed: boolean }) {
  const [open, setOpen] = useState(true) // mặc định mở: trang đang xem nằm trong nhóm thì không bị giấu lúc tải
  const [flyout, setFlyout] = useState(false)
  const id = useId()
  const inGroup = pathname.startsWith('/admin/hotels/')
  const child = (h: FrameHotel, className?: string) => {
    const active = pathname === `/admin/hotels/${h.slug}`
    return (
      <Link key={h.slug} href={`/admin/hotels/${h.slug}`} aria-current={active ? 'page' : undefined} onClick={() => setFlyout(false)}
        className={cn(ROW, active ? ON : IDLE, className)}>
        <span className="min-w-0 flex-1 truncate">{h.name}</span>
      </Link>
    )
  }

  return (
    <div>
      {collapsed ? (
        <Popover open={flyout} onOpenChange={setFlyout}>
          <Tip label="Khách sạn" collapsed>
            <PopoverTrigger className={cn(ROW, 'cursor-pointer', inGroup ? ON : IDLE)} aria-label="Khách sạn">
              <Hotel className="size-4 shrink-0" aria-hidden />
            </PopoverTrigger>
          </Tip>
          <PopoverContent side="right" align="start" sideOffset={12} className="w-60 gap-1 p-1">
            <p className="px-3 pt-2 pb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">Khách sạn</p>
            {hotels.map(h => child(h))}
          </PopoverContent>
        </Popover>
      ) : (
        <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(o => !o)} className={cn(ROW, 'cursor-pointer', IDLE)}>
          <Hotel className="size-4 shrink-0" aria-hidden />
          <span className="min-w-0 flex-1 truncate text-left">Khách sạn</span>
          <ChevronDown className={cn('size-4 shrink-0 transition-transform duration-200 motion-reduce:transition-none', !open && '-rotate-90')} aria-hidden />
        </button>
      )}
      {/* Menu con: thụt cho chữ thẳng mép chữ mục cha, đường dọc ở tâm icon cha; mục đang chọn thì đoạn đường của nó đậm lên. */}
      <div id={id} inert={collapsed || !open}
        className={cn('grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none', !collapsed && open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
        <div className="relative min-h-0 overflow-hidden">
          <div className="relative mt-1 flex flex-col gap-1 before:absolute before:inset-y-0 before:left-5 before:w-px before:bg-border-strong">
            {hotels.map(h => (
              <div key={h.slug} className="relative ml-[26px]">
                {pathname === `/admin/hotels/${h.slug}` && <span aria-hidden className="absolute inset-y-1 -left-1.5 w-px bg-foreground" />}
                {child(h)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function LogoutItem({ collapsed }: { collapsed: boolean }) {
  const logout = useLogout()
  return (
    <Tip label="Đăng xuất" collapsed={collapsed}>
      <button type="button" disabled={logout.isPending} onClick={() => logout.mutate()}
        className={cn(ROW, 'cursor-pointer hover:bg-rose-500/10 hover:text-rose-700 disabled:opacity-60')}>
        <LogOut className="size-4 shrink-0" aria-hidden />
        <span className={cn('min-w-0 flex-1 truncate text-left', fade(collapsed))}>Đăng xuất</span>
      </button>
    </Tip>
  )
}

function SidebarBody({ hotels, pathname, collapsed }: { hotels: FrameHotel[]; pathname: string; collapsed: boolean }) {
  const { data } = useAdminOverview() // dùng chung cache với trang Tổng quan: không gọi thêm
  return (
    <>
      <div className="relative flex h-16 shrink-0 items-center border-b border-border px-4">
        <span className={cn('flex items-center gap-3 whitespace-nowrap', fade(collapsed))}>
          <Image src="/images/brand/rooty-trip-logo.png" alt="Rooty Trip" width={286} height={84} className="logo-green h-8 w-auto" />
          <span className="text-sm font-semibold text-brand">Admin</span>
        </span>
        {/* Dải thu gọn không đủ chỗ cho logo chữ: thay bằng ô chữ cái, cùng tâm 32px với icon bên dưới. */}
        <span aria-hidden className={cn('absolute left-4 grid size-8 place-items-center rounded-lg bg-brand text-sm font-bold text-white', fade(!collapsed))}>R</span>
      </div>
      <nav aria-label="Admin" className={cn('flex flex-1 flex-col gap-1 overflow-x-hidden overflow-y-auto px-3 py-3', collapsed && '[scrollbar-width:none]')}>
        <NavItem href="/admin" icon={LayoutDashboard} label="Tổng quan" active={pathname === '/admin'} collapsed={collapsed} count={data?.issues.length} />
        <HotelsGroup hotels={hotels} pathname={pathname} collapsed={collapsed} />
        <NavItem href="/admin/bookings" icon={CalendarCheck} label="Booking" active={pathname.startsWith('/admin/bookings')} collapsed={collapsed} />
      </nav>
      <div className="shrink-0 px-3 pb-3"><LogoutItem collapsed={collapsed} /></div>
    </>
  )
}

/** Tên trang trên thanh header, suy từ đường dẫn. Trang có đầu trang riêng (khách sạn, chi tiết booking) chỉ ghi cấp cha. */
function HeaderTitle() {
  const pathname = usePathname()
  const sp = useSearchParams()
  if (pathname === '/admin') return <h1 className="min-w-0 truncate text-base font-semibold">Tổng quan</h1>
  if (pathname === '/admin/bookings') return <h1 className="min-w-0 truncate text-base font-semibold">Booking</h1>
  const parent = pathname.startsWith('/admin/bookings/')
    ? { label: 'Booking', href: sp.get('property') ? `/admin/bookings?property=${encodeURIComponent(sp.get('property')!)}` : '/admin/bookings' }
    : pathname.startsWith('/admin/hotels/') ? { label: 'Khách sạn', href: '/admin' } : { label: 'Tổng quan', href: '/admin' }
  return <p className="min-w-0 truncate text-sm text-muted-foreground"><Link href={parent.href} className="hover:text-foreground">{parent.label}</Link></p>
}

export function AdminFrame({ hotels, defaultCollapsed, children }: { hotels: FrameHotel[]; defaultCollapsed: boolean; children: ReactNode }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const toggle = () => {
    setCollapsed(!collapsed)
    document.cookie = `${SIDEBAR_COOKIE}=${collapsed ? 0 : 1}; path=/admin; max-age=31536000; samesite=lax`
  }
  return (
    <div className="flex min-h-screen">
      <aside className={cn('sticky top-0 hidden h-screen shrink-0 flex-col overflow-hidden bg-card transition-[width] duration-200 ease-out motion-reduce:transition-none lg:flex', collapsed ? 'w-16' : 'w-60')}>
        <SidebarBody hotels={hotels} pathname={pathname} collapsed={collapsed} />
      </aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-border bg-card px-4 lg:px-6">
          <MobileNav><div className="flex h-full flex-col"><SidebarBody hotels={hotels} pathname={pathname} collapsed={false} /></div></MobileNav>
          <Button type="button" variant="ghost" size="icon" onClick={toggle} className="-ml-2 hidden aria-expanded:bg-transparent aria-expanded:hover:bg-foreground/5 lg:inline-flex"
            aria-label={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'} aria-expanded={!collapsed} title={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}>
            {collapsed ? <PanelLeftOpen className="size-5" aria-hidden /> : <PanelLeftClose className="size-5" aria-hidden />}
          </Button>
          <HeaderTitle />
        </header>
        <div className="p-4 lg:p-6">{children}</div>
      </div>
    </div>
  )
}

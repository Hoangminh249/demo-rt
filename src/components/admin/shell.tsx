// Khung app admin (wireframe A): sidebar trắng w-60 không viền phải trên nền trang xám, thanh header h-16 trắng,
// một đường kẻ border-border chạy liền dưới đầu sidebar và dưới header. Dưới lg: sidebar thành panel trượt (☰).
import { Suspense, type ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CalendarCheck, ExternalLink, Hotel, LayoutDashboard, type LucideIcon } from 'lucide-react'
import { cn } from 'cn'
import { repo } from '@/lib/repo'
import { overview } from '@/lib/repo/admin'
import { GROUP_LABEL } from './ui'
import { MobileNav } from './mobile-nav'

export type AdminActive = 'overview' | 'bookings' | `hotel:${string}`

function NavLink({ href, icon: Icon, active, count, children }: { href: string; icon: LucideIcon; active: boolean; count?: ReactNode; children: ReactNode }) {
  return (
    <Link href={href} aria-current={active ? 'page' : undefined}
      className={cn('flex h-10 w-full items-center gap-2.5 rounded-xl px-3 text-sm text-foreground/70 transition-colors', active ? 'bg-tab-selected font-medium text-foreground' : 'hover:bg-item-hover hover:text-foreground')}>
      <Icon className="size-4 shrink-0" aria-hidden />
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {count}
    </Link>
  )
}

/** Số việc cần xử lý cạnh "Tổng quan": tải sau, không bắt cả trang chờ Gohost. */
async function IssueCount({ active }: { active: boolean }) {
  const { issues } = await overview()
  return issues.length ? <span className={cn('shrink-0 text-xs tabular-nums', active ? 'text-foreground' : 'text-muted-foreground')}>{issues.length}</span> : null
}

function Sidebar({ active }: { active?: AdminActive }) {
  return (
    <>
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-border px-4">
        <Image src="/images/brand/rooty-trip-logo.png" alt="Rooty Trip" width={286} height={84} className="logo-green h-8 w-auto" />
        <span className="text-sm font-semibold text-brand">Admin</span>
      </div>
      <nav aria-label="Admin" className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-3">
        <NavLink href="/admin" icon={LayoutDashboard} active={active === 'overview'} count={<Suspense fallback={null}><IssueCount active={active === 'overview'} /></Suspense>}>Tổng quan</NavLink>
        <p className={cn('mt-4 flex h-10 items-center px-3', GROUP_LABEL)}>Khách sạn</p>
        {repo.listHotels('vi').map(h => <NavLink key={h.slug} href={`/admin/hotels/${h.slug}`} icon={Hotel} active={active === `hotel:${h.slug}`}>{h.name}</NavLink>)}
        <div className="mt-4"><NavLink href="/admin/bookings" icon={CalendarCheck} active={active === 'bookings'}>Booking</NavLink></div>
      </nav>
      <div className="shrink-0 px-3 pb-3">
        <a href="/" target="_blank" rel="noopener" className="flex h-10 w-full items-center gap-2.5 rounded-xl px-3 text-sm text-foreground/70 transition-colors hover:bg-item-hover hover:text-foreground">
          <ExternalLink className="size-4 shrink-0" aria-hidden />Xem website
        </a>
      </div>
    </>
  )
}

/** `title`: tên trang là <h1> trên thanh header. `parent`: trang có đầu trang riêng → thanh header chỉ ghi cấp cha (link).
 *  `active` bỏ trống (trang 404) thì không mục nào sáng. */
export function AdminShell({ active, title, parent, headerRight, children }: {
  active?: AdminActive; title?: string; parent?: { label: string; href: string }; headerRight?: ReactNode; children: ReactNode
}) {
  const sidebar = <Sidebar active={active} />
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-card lg:flex">{sidebar}</aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-card px-4 lg:px-6">
          <MobileNav>{sidebar}</MobileNav>
          {parent
            ? <p className="min-w-0 truncate text-sm text-muted-foreground"><Link href={parent.href} className="hover:text-foreground">{parent.label}</Link></p>
            : <h1 className="min-w-0 truncate text-base font-semibold">{title}</h1>}
          <div className="ml-auto flex items-center gap-2">{headerRight}</div>
        </header>
        <div className="p-4 lg:p-6">{children}</div>
      </div>
    </div>
  )
}

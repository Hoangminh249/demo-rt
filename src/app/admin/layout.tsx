'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { LayoutDashboard, Hotel, BedDouble, Tags, Grid3x3, CalendarCheck2, Users, Briefcase, Percent, Wallet, BarChart3, FileText, ShieldCheck, Moon, Sun, Menu, Lock, ExternalLink } from 'lucide-react'
import { ADMIN_MODULES, ROLE_LABEL, type ModuleKey } from '@/lib/permissions'
import { useAdmin } from '@/components/admin/use-admin'
import { PeriodPicker } from '@/components/admin/period-picker'
import { Empty, cn } from '@/components/ui'
import { Dialog } from '@/components/ui/overlay'

const ICONS: Record<ModuleKey, typeof Hotel> = {
  dashboard: LayoutDashboard, hotels: Hotel, rooms: BedDouble, rates: Tags, inventory: Grid3x3, bookings: CalendarCheck2, customers: Users,
  agents: Briefcase, promotions: Percent, payments: Wallet, reports: BarChart3, content: FileText, users: ShieldCheck,
}
const moduleOf = (path: string): ModuleKey => (ADMIN_MODULES.find(m => m.href !== '/admin' && path.startsWith(m.href))?.key ?? 'dashboard')

export default function AdminLayout({ children }: LayoutProps<'/admin'>) {
  const a = useAdmin()
  const path = usePathname()
  const [menu, setMenu] = useState(false)
  const current = moduleOf(path)
  const nav = (
    <nav aria-label="Admin" className="space-y-0.5">
      {ADMIN_MODULES.map(m => {
        const Icon = ICONS[m.key]
        const allowed = a.can(m.key)
        return (
          <Link key={m.key} href={m.href} onClick={() => setMenu(false)}
            className={cn('flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium', current === m.key ? 'bg-primary text-white' : 'text-fg hover:bg-surface-2', !allowed && 'opacity-45')}>
            <Icon className="size-4" />{m.label}{!allowed && <Lock className="ml-auto size-3.5" />}
          </Link>
        )
      })}
    </nav>
  )
  return (
    <div className={cn('min-h-[calc(100vh-2.25rem)] bg-bg text-fg', a.dark && 'dark')}>
      <div className="flex">
        <aside className="no-print sticky top-9 hidden h-[calc(100vh-2.25rem)] w-60 shrink-0 flex-col border-r border-border bg-surface p-3 lg:flex">
          <Link href="/admin" className="mb-4 px-3 pt-1">
            <p className="font-bold text-brand dark:text-accent">Rooty Hospitality</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Admin</p>
          </Link>
          <div className="flex-1 overflow-y-auto">{nav}</div>
          <Link href="/" className="mt-2 flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted hover:bg-surface-2"><ExternalLink className="size-3.5" /> Xem website khách</Link>
        </aside>
        <div className="min-w-0 flex-1">
          <header className="no-print sticky top-9 z-30 flex flex-wrap items-center gap-2 border-b border-border bg-surface/95 px-4 py-2 backdrop-blur">
            <button type="button" className="rounded-md p-2 hover:bg-surface-2 lg:hidden" onClick={() => setMenu(true)} aria-label="Mở menu admin"><Menu className="size-5" /></button>
            <label className="sr-only" htmlFor="admin-hotel">Khách sạn</label>
            <select id="admin-hotel" value={a.hotelId} disabled={!!a.locked} onChange={e => a.setHotel(e.target.value)} className="h-9 rounded-lg border border-border bg-surface px-2 text-sm disabled:opacity-80">
              {!a.locked && <option value="all">Tất cả khách sạn</option>}
              {a.hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
            {a.locked && <span className="flex items-center gap-1 text-xs text-muted"><Lock className="size-3" />Chỉ KS của bạn</span>}
            <PeriodPicker />
            <div className="ml-auto flex items-center gap-2">
              <button type="button" onClick={a.toggleDark} className="rounded-md p-2 hover:bg-surface-2" aria-label={a.dark ? 'Chế độ sáng' : 'Chế độ tối'}>{a.dark ? <Sun className="size-4" /> : <Moon className="size-4" />}</button>
              <div className="text-right text-xs leading-tight"><p className="font-semibold">{a.user.name}</p><p className="text-muted">{ROLE_LABEL[a.user.role]}</p></div>
            </div>
          </header>
          <main className="p-4 md:p-6">
            {a.can(current) ? children : (
              <Empty icon={<Lock className="size-10" />} title={`${ROLE_LABEL[a.user.role]} không có quyền xem module này`}>
                Đổi vai trò ở banner demo để xem module này.
              </Empty>
            )}
          </main>
        </div>
      </div>
      <Dialog open={menu} onClose={() => setMenu(false)} title="Rooty Hospitality Admin" side="right">{nav}</Dialog>
    </div>
  )
}

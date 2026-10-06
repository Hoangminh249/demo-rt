'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Briefcase, LogOut } from 'lucide-react'
import { repo } from '@/lib/repo'
import { useDemo } from '@/store/provider'
import { Logo } from '@/components/site/site-header'
import { cn } from '@/components/ui'
import { AgentLogin } from '@/components/agent/login'

const NAV = [
  ['/agent/tim-phong', 'Tìm phòng'], ['/agent/booking', 'Booking của tôi'], ['/agent/cong-no', 'Công nợ'], ['/agent/hoa-hong', 'Hoa hồng'], ['/agent/bao-cao', 'Báo cáo tháng'],
] as const

export default function AgentLayout({ children }: LayoutProps<'/agent'>) {
  const { overlay, update } = useDemo()
  const path = usePathname()
  const router = useRouter()
  const agent = overlay.session.agentId ? repo.agentsSync().find(a => a.id === overlay.session.agentId) : undefined
  const open = path === '/agent/dang-ky'

  return (
    <div className="min-h-screen bg-bg">
      <header className="no-print sticky top-9 z-40 border-b border-border bg-surface">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
          <Logo />
          <span className="flex items-center gap-1 rounded-md bg-warn-bg px-2 py-0.5 text-xs font-semibold text-warn"><Briefcase className="size-3.5" />Agent Portal</span>
          {agent && (
            <nav aria-label="Agent" className="ml-4 hidden gap-1 lg:flex">
              {NAV.map(([href, label]) => <Link key={href} href={href} className={cn('rounded-md px-3 py-1.5 text-sm font-medium', path.startsWith(href) ? 'bg-mint text-primary' : 'text-muted hover:text-fg')}>{label}</Link>)}
            </nav>
          )}
          {agent && (
            <div className="ml-auto flex items-center gap-2 text-sm">
              <span className="hidden font-semibold sm:inline">AGENT {agent.name.toUpperCase()}</span>
              <button type="button" onClick={() => { update(o => ({ session: { ...o.session, agentId: undefined } })); router.push('/agent') }} className="rounded-md p-2 text-muted hover:bg-surface-2" aria-label="Đăng xuất"><LogOut className="size-4" /></button>
            </div>
          )}
        </div>
        {agent && (
          <nav aria-label="Agent (di động)" className="flex gap-1 overflow-x-auto border-t border-border px-4 py-1 lg:hidden">
            {NAV.map(([href, label]) => <Link key={href} href={href} className={cn('shrink-0 rounded-md px-3 py-1.5 text-sm', path.startsWith(href) ? 'bg-mint text-primary' : 'text-muted')}>{label}</Link>)}
          </nav>
        )}
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{agent || open ? children : <AgentLogin />}</main>
    </div>
  )
}

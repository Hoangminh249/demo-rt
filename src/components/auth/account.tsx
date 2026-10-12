'use client'
// Nút tài khoản trên header: chưa đăng nhập → "Đăng nhập" (mở modal); đã đăng nhập → menu email + Đăng xuất.
// OpenLoginButton: nút mở modal đăng nhập đặt ở bất cứ đâu (vd thẻ "Đăng nhập để đặt phòng").
import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { signOut } from 'next-auth/react'
import { DropdownMenu } from 'radix-ui'
import { LogIn, LogOut, UserRound } from 'lucide-react'
import { cn } from 'cn'
import { useAuthSession } from '@/hooks/use-auth'
import { useLoginModal } from './login'

export function OpenLoginButton({ className, children, callbackUrl }: { className?: string; children: ReactNode; callbackUrl?: string }) {
  const { open } = useLoginModal()
  return <button type="button" onClick={() => open({ callbackUrl })} className={className}>{children}</button>
}

export function AccountButton({ className, full }: { className?: string; full?: boolean }) {
  const t = useTranslations('Header')
  const { open } = useLoginModal()
  const { data: user, isPending } = useAuthSession()
  if (isPending) return <span className={cn('inline-block size-10', full && 'h-11 w-full')} aria-hidden />
  if (!user) {
    return (
      <button type="button" onClick={() => open()} className={cn('inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg px-3 text-[14px] font-semibold transition-colors', className)}>
        <LogIn className="size-4" aria-hidden />{t('login')}
      </button>
    )
  }
  const label = user.name || user.email || t('account')
  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger className={cn('inline-flex h-10 max-w-56 cursor-pointer items-center gap-2 rounded-lg px-3 text-[14px] font-semibold outline-none focus-visible:ring-4 focus-visible:ring-focus', className)} aria-label={`${t('account')}: ${label}`}>
        <UserRound className="size-4 shrink-0" aria-hidden /><span className="truncate">{label}</span>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={6} className="z-50 w-64 rounded-xl border border-border bg-white p-1.5 shadow-popover">
          {user.email && <p className="truncate px-3 py-2 text-[13px] text-muted-foreground">{user.email}</p>}
          <DropdownMenu.Item onSelect={() => signOut({ redirectTo: `${window.location.pathname}${window.location.search}` })}
            className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 text-[15px] outline-none data-highlighted:bg-mint data-highlighted:text-brand">
            <LogOut className="size-4 text-brand" aria-hidden />{t('logout')}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

// Khung chung các bước đặt phòng: thanh bước · tiêu đề · nội dung + cột tóm tắt dính.
import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Check, SearchX } from 'lucide-react'
import { cn } from 'cn'
import { Link } from '@/i18n/navigation'
import { BTN, CONTAINER } from '@/components/site/kit'

const STEPS = ['room', 'guest', 'payment', 'done'] as const

export function Steps({ current }: { current: 1 | 2 | 3 }) {
  const t = useTranslations('Booking.steps')
  return (
    <nav aria-label={t('aria')} className="border-b border-border bg-white">
      <ol className={`${CONTAINER} flex h-14 items-center gap-2 sm:gap-4`}>
        {STEPS.map((s, i) => {
          const done = i < current
          const on = i === current
          return (
            <li key={s} className={cn('flex min-w-0 items-center gap-2', on ? 'flex-1 sm:flex-none' : 'shrink-0')} aria-current={on ? 'step' : undefined}>
              <span className={cn('grid size-7 shrink-0 place-items-center rounded-full text-[13px] font-semibold',
                done ? 'bg-primary text-primary-foreground' : on ? 'bg-brand text-white' : 'border border-border-strong text-muted-foreground')}>
                {done ? <Check className="size-4" strokeWidth={3} aria-hidden /> : i + 1}
              </span>
              <span className={cn('truncate text-[14px]', on ? 'font-semibold text-brand' : 'hidden text-muted-foreground sm:inline')}>{t(s)}</span>
              {i < STEPS.length - 1 && <span className="hidden h-px w-10 bg-border-strong md:block" aria-hidden />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}


export function BookingShell({ step, title, lead, aside, children }: {
  step: 1 | 2 | 3; title: string; lead: string; aside?: ReactNode; children: ReactNode
}) {
  return (
    <>
      <Steps current={step} />
      <div className={`${CONTAINER} pt-8 pb-16`}>
        <h1 className="text-[28px] leading-tight font-bold text-brand sm:text-[34px]">{title}</h1>
        <p className="mt-1.5 text-[16px] text-muted-foreground">{lead}</p>
        <div className={cn('mt-8 grid grid-cols-1 gap-8', aside && 'lg:grid-cols-[minmax(0,1fr)_380px]')}>
          <div className="min-w-0">{children}</div>
          {aside && <aside className="hidden lg:block"><div className="sticky top-[calc(var(--header-offset)+24px)] transition-[top] duration-300">{aside}</div></aside>}
        </div>
      </div>
    </>
  )
}

/** URL thiếu / sai khách sạn, phòng; hoặc vào thẳng bước sau khi chưa qua bước trước. */
export function BookingMissing({ title, body, href, cta }: { title: string; body: string; href: string; cta: string }) {
  return (
    <div className={`${CONTAINER} flex flex-col items-center py-24 text-center`}>
      <SearchX className="size-10 text-muted-foreground" aria-hidden />
      <h1 className="mt-4 text-2xl font-bold text-brand">{title}</h1>
      <p className="mt-2 max-w-md text-[15px] text-muted-foreground">{body}</p>
      <Link href={href} className={`${BTN} mt-6`}>{cta}</Link>
    </div>
  )
}

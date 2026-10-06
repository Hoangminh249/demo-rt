// Component nền kiểu shadcn/ui — tự viết, chỉ những gì demo cần.
import Link from 'next/link'
import Image from 'next/image'
import type { ComponentProps, ReactNode } from 'react'
import { Star } from 'lucide-react'

export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

const BTN = {
  base: 'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap',
  variant: {
    primary: 'bg-primary text-white hover:bg-primary-hover',
    secondary: 'border border-border bg-surface text-fg hover:bg-surface-2',
    ghost: 'text-fg hover:bg-surface-2',
    danger: 'bg-danger text-white hover:opacity-90',
    brand: 'bg-brand text-white hover:opacity-90',
  },
  size: { sm: 'h-8 px-3 text-sm', md: 'h-10 px-4 text-sm', lg: 'h-12 px-6 text-base' },
}
type BtnProps = { variant?: keyof typeof BTN.variant; size?: keyof typeof BTN.size }

export function Button({ variant = 'primary', size = 'md', className, ...p }: ComponentProps<'button'> & BtnProps) {
  return <button type="button" className={cn(BTN.base, BTN.variant[variant], BTN.size[size], className)} {...p} />
}
export function ButtonLink({ variant = 'primary', size = 'md', className, ...p }: ComponentProps<typeof Link> & BtnProps) {
  return <Link className={cn(BTN.base, BTN.variant[variant], BTN.size[size], className)} {...p} />
}

export function Card({ className, ...p }: ComponentProps<'div'>) {
  return <div className={cn('rounded-xl border border-border bg-surface', className)} {...p} />
}

const TONES = {
  neutral: 'bg-surface-2 text-muted',
  brand: 'bg-mint text-brand dark:text-accent',
  ok: 'bg-ok-bg text-ok',
  warn: 'bg-warn-bg text-warn',
  danger: 'bg-danger-bg text-danger',
  info: 'bg-info-bg text-info',
}
export type Tone = keyof typeof TONES
export function Badge({ tone = 'neutral', className, ...p }: ComponentProps<'span'> & { tone?: Tone }) {
  return <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap', TONES[tone], className)} {...p} />
}

const FIELD = 'w-full rounded-lg border border-border bg-surface px-3 h-10 text-sm text-fg placeholder:text-muted focus:border-accent focus:outline-none'
export const Input = ({ className, ...p }: ComponentProps<'input'>) => <input className={cn(FIELD, className)} {...p} />
export const Select = ({ className, ...p }: ComponentProps<'select'>) => <select className={cn(FIELD, 'pr-8', className)} {...p} />
export const Textarea = ({ className, ...p }: ComponentProps<'textarea'>) => <textarea className={cn(FIELD, 'h-auto min-h-20 py-2', className)} {...p} />

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn('block space-y-1', className)}>
      <span className="text-sm font-medium text-fg">{label}</span>
      {children}
      {hint && <span className="block text-xs text-muted">{hint}</span>}
    </label>
  )
}

export const Skeleton = ({ className }: { className?: string }) => <div className={cn('skeleton rounded-lg', className)} aria-hidden />

export function SkeletonList({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('space-y-3', className)} role="status" aria-label="Đang tải">
      {Array.from({ length: rows }, (_, i) => <Skeleton key={i} className="h-24 w-full" />)}
    </div>
  )
}

export function Empty({ icon, title, children }: { icon?: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-surface px-6 py-10 text-center">
      {icon && <div className="mb-3 text-muted">{icon}</div>}
      <p className="font-semibold">{title}</p>
      {children && <div className="mt-2 text-sm text-muted">{children}</div>}
    </div>
  )
}

export function ErrorBox({ children }: { children: ReactNode }) {
  return <div role="alert" className="rounded-lg border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger">{children}</div>
}

export function Stars({ n, className }: { n: number; className?: string }) {
  return (
    <span className={cn('inline-flex text-amber-500', className)} aria-label={`${n} sao`}>
      {Array.from({ length: n }, (_, i) => <Star key={i} className="size-3.5 fill-current" />)}
    </span>
  )
}

/** Ảnh placeholder trong /public/images — thay file cùng tên bằng ảnh thật. */
export function Photo({ src, alt, className, sizes = '100vw', priority }: { src: string; alt: string; className?: string; sizes?: string; priority?: boolean }) {
  return (
    <div className={cn(!/\b(absolute|fixed)\b/.test(className ?? '') && 'relative', 'overflow-hidden bg-surface-2', className)}>
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
    </div>
  )
}

export function PageTitle({ title, sub, children }: { title: string; sub?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg md:text-3xl">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
      </div>
      {children}
    </div>
  )
}

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && <span aria-hidden>/</span>}
            {it.href ? <Link href={it.href} className="hover:text-primary hover:underline">{it.label}</Link> : <span className="text-fg">{it.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export function Stat({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: ReactNode; tone?: 'up' | 'down' }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold text-fg">{value}</p>
      {sub && <p className={cn('mt-1 text-xs', tone === 'up' ? 'text-ok' : tone === 'down' ? 'text-danger' : 'text-muted')}>{sub}</p>}
    </Card>
  )
}

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('overflow-x-auto rounded-xl border border-border bg-surface', className)}>
      <table className="w-full text-sm [&_td]:px-3 [&_td]:py-2.5 [&_th]:px-3 [&_th]:py-2.5 [&_th]:text-left [&_th]:text-xs [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-wide [&_th]:text-muted [&_thead]:bg-surface-2 [&_tbody_tr]:border-t [&_tbody_tr]:border-border">
        {children}
      </table>
    </div>
  )
}

export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-lg border border-border bg-surface p-0.5">
      {options.map(o => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)}
          className={cn('rounded-md px-3 py-1.5 text-sm font-medium', value === o.value ? 'bg-primary text-white' : 'text-muted hover:text-fg')}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

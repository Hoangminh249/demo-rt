// Lớp mỏng trên shadcn/ui: giữ API cũ (Button variant="primary"…) cho các màn đã có,
// màn mới dùng thẳng component shadcn trong thư mục này (button.tsx, select.tsx, popover.tsx…).
import Link from 'next/link'
import Image from 'next/image'
import type { ComponentProps, ReactNode } from 'react'
import { ChevronLeft, ImageOff, Star } from 'lucide-react'
import { cn } from 'cn'
import { Button as UIButton, buttonVariants } from './button'
import { Input as UIInput } from './input'
import { Textarea as UITextarea } from './textarea'

export { cn }

// API cũ → biến thể shadcn. secondary (cũ) = nút viền.
const VARIANT = { primary: 'default', secondary: 'outline', outline: 'outline', soft: 'secondary', ghost: 'ghost', danger: 'destructive', brand: 'default' } as const
const SIZE = { sm: 'sm', md: 'default', lg: 'lg' } as const
type BtnProps = { variant?: keyof typeof VARIANT; size?: keyof typeof SIZE }

export function Button({ variant = 'primary', size = 'md', type = 'button', ...p }: ComponentProps<'button'> & BtnProps) {
  return <UIButton type={type} variant={VARIANT[variant]} size={SIZE[size]} {...p} />
}
export function ButtonLink({ variant = 'primary', size = 'md', className, ...p }: ComponentProps<typeof Link> & BtnProps) {
  return <Link className={cn(buttonVariants({ variant: VARIANT[variant], size: SIZE[size] }), className)} {...p} />
}

/** Card: đường tóc + bo 16px, không bóng (M13, M15). */
export function Card({ className, ...p }: ComponentProps<'div'>) {
  return <div className={cn('rounded-2xl border border-border bg-card', className)} {...p} />
}

const TONES = {
  neutral: 'bg-muted text-muted-foreground',
  brand: 'bg-accent text-accent-foreground',
  ok: 'bg-ok-bg text-ok',
  warn: 'bg-warn-bg text-warn',
  danger: 'bg-danger-bg text-danger',
  info: 'bg-info-bg text-info',
}
export type Tone = keyof typeof TONES
export function Badge({ tone = 'neutral', className, ...p }: ComponentProps<'span'> & { tone?: Tone }) {
  return <span className={cn('inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-xs font-medium whitespace-nowrap', TONES[tone], className)} {...p} />
}

export const Input = (p: ComponentProps<'input'>) => <UIInput {...p} />
export const Textarea = (p: ComponentProps<'textarea'>) => <UITextarea {...p} />
/** <select> gốc, cùng dáng ô nhập. Màn bán phòng dùng Select của shadcn; admin còn dùng bản này. */
export const Select = ({ className, ...p }: ComponentProps<'select'>) => (
  <select
    className={cn(
      "h-11 w-full cursor-pointer appearance-none rounded-xl border border-border-strong bg-card bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2024%2024%22%20fill=%22none%22%20stroke=%22%235b6866%22%20stroke-width=%222%22%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22%3E%3Cpath%20d=%22m6%209%206%206%206-6%22/%3E%3C/svg%3E')] bg-[length:16px] bg-[position:right_14px_center] bg-no-repeat pr-10 pl-4 text-base text-foreground outline-none focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus md:h-10 md:text-sm",
      className,
    )}
    {...p}
  />
)

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn('block space-y-1.5', className)}>
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
      {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
    </label>
  )
}

export const Skeleton = ({ className }: { className?: string }) => <div className={cn('skeleton rounded-xl', className)} aria-hidden />

export function SkeletonList({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('space-y-3', className)} role="status" aria-label="Đang tải">
      {Array.from({ length: rows }, (_, i) => <Skeleton key={i} className="h-24 w-full" />)}
    </div>
  )
}

export function Empty({ icon, title, children }: { icon?: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-border bg-card px-6 py-12 text-center">
      {icon && <div className="mb-3 text-muted-foreground">{icon}</div>}
      <p className="text-base font-semibold">{title}</p>
      {children && <div className="mt-2 max-w-md text-sm text-muted-foreground">{children}</div>}
    </div>
  )
}

export function ErrorBox({ children }: { children: ReactNode }) {
  return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">{children}</div>
}

export function Stars({ n, className }: { n: number; className?: string }) {
  return (
    <span className={cn('inline-flex text-amber-500', className)} role="img" aria-label={`${n} sao`}>
      {Array.from({ length: n }, (_, i) => <Star key={i} className="size-3.5 fill-current" aria-hidden />)}
    </span>
  )
}

/** Ảnh trong /public/images. Không có ảnh thì hiện khung "Chưa có ảnh" (ca biên S8). */
export function Photo({ src, alt, className, sizes = '100vw', priority }: { src?: string; alt: string; className?: string; sizes?: string; priority?: boolean }) {
  return (
    <div className={cn(!/\b(absolute|fixed)\b/.test(className ?? '') && 'relative', 'overflow-hidden bg-muted', className)}>
      {src ? <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
        : <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-xs text-muted-foreground"><ImageOff className="size-5" aria-hidden />Chưa có ảnh</div>}
    </div>
  )
}

/** Tên trang text-xl (budgets.md, luật khoá 11). */
export function PageTitle({ title, sub, children }: { title: string; sub?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
      </div>
      {children}
    </div>
  )
}

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  const back = [...items].reverse().find(it => it.href)
  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted-foreground">
      {/* Màn hẹp: một link quay về cấp trên, không để đường dẫn rớt dòng (R3) */}
      {back && <Link href={back.href!} className="inline-flex min-h-8 items-center gap-1 hover:text-foreground sm:hidden"><ChevronLeft className="size-4" aria-hidden />{back.label}</Link>}
      <ol className="hidden flex-wrap items-center gap-1.5 sm:flex">
        {items.map((it, i) => (
          <li key={i} className="flex min-w-0 items-center gap-1.5">
            {i > 0 && <span aria-hidden className="text-muted-foreground">/</span>}
            {it.href ? <Link href={it.href} className="inline-flex min-h-6 items-center hover:text-foreground">{it.label}</Link> : <span className="truncate text-foreground" aria-current="page">{it.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export function Stat({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: ReactNode; tone?: 'up' | 'down' }) {
  return (
    <Card className="p-4 sm:p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold text-foreground sm:text-2xl">{value}</p>
      {sub && <p className={cn('mt-1 text-xs', tone === 'up' ? 'text-ok' : tone === 'down' ? 'text-danger' : 'text-muted-foreground')}>{sub}</p>}
    </Card>
  )
}

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('overflow-x-auto rounded-2xl border border-border bg-card', className)}>
      <table className="w-full text-sm [&_td]:px-4 [&_td]:py-3 [&_th]:px-4 [&_th]:py-3 [&_th]:text-left [&_th]:text-xs [&_th]:font-medium [&_th]:text-muted-foreground [&_tbody_tr]:border-t [&_tbody_tr]:border-border [&_tbody_tr:hover]:bg-surface-hover">
        {children}
      </table>
    </div>
  )
}

/** Tab segmented: rãnh xám, ô đang chọn trắng nổi nhẹ (small-controls.md). */
export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex gap-0.5 rounded-xl bg-secondary p-1">
      {options.map(o => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)}
          className={cn('h-8 rounded-lg px-3 text-sm font-medium transition-colors', value === o.value ? 'bg-card text-foreground shadow-[0_0_0_1px_rgb(0_0_0/0.04),0_1px_2px_rgb(0_0_0/0.06)]' : 'text-muted-foreground hover:text-foreground')}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

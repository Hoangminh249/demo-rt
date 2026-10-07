// Mảnh dùng chung của admin — chép từ wireframe phương án A (đã duyệt), theo hợp đồng nguyên tố: card viền mảnh không bóng,
// badge pill nền nhạt 4 tông (M7), trạng thái rỗng là một câu mờ, khung chờ đúng hình dòng thật.
import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CircleAlert, ImageOff } from 'lucide-react'
import { cn } from 'cn'
import { buttonVariants } from '@/components/ui/button'
import type { GohostErrorCode } from '@/lib/repo/admin'

export const CARD = 'rounded-2xl border border-border bg-card'
export const TEXT_LINK = 'inline-flex h-8 cursor-pointer items-center text-sm font-medium text-foreground/70 underline-offset-4 hover:text-foreground hover:underline'
export const ROW_LINK = 'group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-item-hover'
export const GROUP_LABEL = 'text-xs font-medium tracking-wide text-muted-foreground uppercase'

export type Tone = 'ok' | 'warn' | 'err' | 'neutral'
const TONE: Record<Tone, string> = {
  ok: 'bg-emerald-50 text-emerald-700',
  warn: 'bg-amber-50 text-amber-700',
  err: 'bg-red-50 text-red-700',
  neutral: 'bg-zinc-100 text-zinc-600',
}

export function Badge({ tone, icon, children }: { tone: Tone; icon?: ReactNode; children: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ring-1 ring-black/5 ring-inset', TONE[tone])}>
      {icon ?? <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  )
}

export const Empty = ({ children }: { children: ReactNode }) => <p className="py-6 text-center text-sm text-muted-foreground">{children}</p>
export const Skel = ({ className }: { className?: string }) => <div className={cn('animate-pulse rounded-lg bg-border', className)} />

export function Dl({ rows }: { rows: [label: string, value: ReactNode][] }) {
  return (
    <dl className="grid gap-2 text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">{k}</dt>
          <dd className="text-right font-medium tabular-nums">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Ảnh trong /public/images; chưa có thì khung "Ảnh đang cập nhật" (như website). */
export function Photo({ src, className, sizes }: { src: string | null; className?: string; sizes: string }) {
  return (
    <div className={cn('relative overflow-hidden bg-border', className)}>
      {src
        ? <Image src={src} alt="" fill sizes={sizes} className="object-cover" />
        : <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-xs text-muted-foreground"><ImageOff className="size-5" aria-hidden />Ảnh đang cập nhật</div>}
    </div>
  )
}

const ERROR_TEXT: Record<GohostErrorCode, string> = {
  NOT_CONFIGURED: 'Thiếu GOHOST_API_KEY hoặc GOHOST_API_SECRET trong .env.local.',
  RATE_LIMITED: 'Đã dùng hết lượt gọi (Gohost cho 60 lượt / 5 phút cho cả key). Thử lại sau ít phút.',
  UPSTREAM: 'Gohost không phản hồi hoặc trả lỗi. Thử lại sau ít phút.',
}

/** Thanh báo lỗi (banner tông Lỗi, không ✕): đứng đó tới khi xử lý xong. */
export function GohostError({ code, note }: { code: GohostErrorCode; note?: string }) {
  return (
    <div role="alert" className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
      <CircleAlert className="mt-0.5 size-5 shrink-0 text-red-600" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-red-700">Chưa đọc được dữ liệu Gohost</p>
        <p className="mt-0.5 text-sm text-pretty text-foreground/80">{ERROR_TEXT[code]}{note && ` ${note}`}</p>
      </div>
    </div>
  )
}

/** 404 trong khung admin: khối căn giữa không card, dòng "404" mờ, một nút đặc về danh sách của loại đó. */
export function NotFound({ title, desc, href, label }: { title: string; desc: string; href: string; label: string }) {
  return (
    <div className="mx-auto max-w-md pt-16 pb-16 text-center sm:pt-24">
      <p className="text-sm font-medium text-muted-foreground tabular-nums">404</p>
      <h1 className="mt-1 text-xl font-semibold text-balance">{title}</h1>
      <p className="mt-2 text-sm text-pretty text-muted-foreground">{desc}</p>
      <div className="mt-6 flex justify-center">
        <Link href={href} className={cn(buttonVariants({ variant: 'default' }), 'min-h-11 w-full sm:w-auto md:min-h-10')}>{label}</Link>
      </div>
    </div>
  )
}

/** 2.500.000 đ — tiền trong admin viết kiểu Việt Nam (khác "đ 2,500,000" của website theo khuôn rootytrip). */
export const vnd = (n: number) => `${new Intl.NumberFormat('vi-VN').format(Math.round(n))} đ`
export const vndPlain = (n: number) => new Intl.NumberFormat('vi-VN').format(Math.round(n))
/** Giá một đêm gọn: 2,5 tr · 2,48 tr · 900 k */
export const shortVnd = (n: number) => (n >= 1e6 ? `${(n / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} tr` : `${Math.round(n / 1000)} k`)
/** Giờ:phút theo giờ Việt Nam */
export const hhmm = (t: number) => new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' }).format(t)

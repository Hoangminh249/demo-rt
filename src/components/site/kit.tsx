// Mảnh dùng chung của website, theo nhận diện rootytrip.com (chép từ wireframe phương án A).
import Image from 'next/image'
import type { ReactNode } from 'react'
import {
  Baby, CableCar, Car, Check, Clock, DoorOpen, Dumbbell, Flower2, ImageOff, MapPin, Martini, Plane, SquareParking, Star, Store,
  Umbrella, Utensils, Waves, Wifi, type LucideIcon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from 'cn'
import type { IconKey } from '@/lib/types'

export const CONTAINER = 'mx-auto w-full max-w-[1200px] px-4 sm:px-6'
export const BTN = 'inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-5 text-[15px] font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50'
export const BTN_OUT = 'inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg border border-primary bg-white px-5 text-[15px] font-semibold text-primary transition-colors hover:bg-mint'
/** Nhãn nhỏ in hoa màu cam kiểu rootytrip ("ĐẶT TOUR / COMBO") */
export const EYEBROW = 'text-[13px] font-semibold uppercase tracking-wide text-orange'
export const TEXT_LINK = 'inline-flex min-h-8 items-center gap-1 text-[15px] font-semibold text-primary underline-offset-4 hover:underline'

export const ICONS: Record<IconKey, LucideIcon> = {
  'map-pin': MapPin, clock: Clock, 'cable-car': CableCar, 'door-open': DoorOpen, plane: Plane, waves: Waves, umbrella: Umbrella,
  baby: Baby, flower: Flower2, dumbbell: Dumbbell, utensils: Utensils, martini: Martini, wifi: Wifi, car: Car, parking: SquareParking, store: Store,
}

export function Stars({ n }: { n: number }) {
  const t = useTranslations('Common')
  return (
    <span className="inline-flex text-star" role="img" aria-label={t('stars', { n })}>
      {Array.from({ length: n }, (_, i) => <Star key={i} className="size-4 fill-current" aria-hidden />)}
    </span>
  )
}

/** Tiêu đề section kiểu rootytrip: xanh rêu đậm, chữ cuối xanh ngọc. */
export function SectionTitle({ lead, accent, className }: { lead: string; accent: string; className?: string }) {
  return <h2 className={cn('text-[28px] leading-tight font-bold text-brand sm:text-[36px]', className)}>{lead} <span className="text-brand-accent">{accent}</span></h2>
}

export const CheckItem = ({ children }: { children: ReactNode }) => (
  <li className="flex gap-2.5 text-[15px] text-foreground italic"><Check className="mt-1 size-4 shrink-0 text-brand" aria-hidden /><span>{children}</span></li>
)

/** Ảnh trong /public/images. Không có ảnh thì hiện khung "Chưa có ảnh". */
export function Photo({ src, alt, className, sizes = '100vw', priority }: { src?: string; alt: string; className?: string; sizes?: string; priority?: boolean }) {
  const t = useTranslations('Common')
  return (
    <div className={cn('relative overflow-hidden bg-muted', className)}>
      {src
        ? <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
        : <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-sm text-muted-foreground"><ImageOff className="size-6" aria-hidden />{t('noPhoto')}</div>}
    </div>
  )
}

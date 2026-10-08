// Trang chi tiết phòng — nơi khách chốt phòng: ảnh · thông số · gói giá · thẻ đặt phòng dính (ngày, khách, giá từng đêm, tổng)
// → "Đặt phòng" sang luồng /dat-phong (bản minh hoạ). Chưa có giá trực tuyến (Calista) thì thẻ chuyển sang "Liên hệ đặt phòng".
import { notFound } from 'next/navigation'
import { Suspense, type ReactNode } from 'react'
import { ArrowRight, BedDouble, CalendarClock, Eye, Info, LogIn, LogOut, Maximize2 } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { repo } from '@/lib/repo'
import { roomHref } from '@/lib/booking'
import type { Locale } from '@/lib/types'
import { CheckItem, CONTAINER, EYEBROW, Photo, TEXT_LINK } from '@/components/site/kit'
import { Gallery } from '@/components/hotel/gallery'
import { InfoTable } from '@/components/hotel/info-table'
import { BookingCard, PlanPicker, RoomMobileBar } from '@/components/room/room-booking'

export const dynamicParams = false
export const generateStaticParams = () => repo.roomParams()
export const revalidate = 600

export async function generateMetadata({ params }: PageProps<'/[locale]/hotel/[slug]/[room]'>) {
  const { locale, slug, room } = await params
  const h = repo.getHotel(slug, locale as Locale)
  const r = h?.rooms.find(x => x.slug === room)
  return h && r ? { title: `${r.name} — ${h.name}`, description: r.description } : {}
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return <section id={id} className="scroll-mt-28 border-t border-border pt-10"><h2 className="text-[26px] font-bold text-brand">{title}</h2>{children}</section>
}

export default async function RoomPage({ params }: PageProps<'/[locale]/hotel/[slug]/[room]'>) {
  const { locale, slug, room: roomSlug } = await params
  setRequestLocale(locale as Locale)
  const h = repo.getHotel(slug, locale as Locale)
  const room = h?.rooms.find(r => r.slug === roomSlug)
  if (!h || !room) notFound()
  const t = await getTranslations()
  const contact = repo.site(locale as Locale)
  const hotel = { slug: h.slug, code: h.code, name: h.name, online: h.online, opening: h.opening, cancel_summary: h.cancel_summary }
  const others = h.rooms.filter(r => r.slug !== room.slug)
  // File khách sạn luôn mở đầu chính sách bằng Nhận phòng, Trả phòng (src/content/*.ts).
  const [checkin, checkout] = h.policies
  const card = (prefix: string) => <Suspense fallback={<div className="h-[420px] animate-pulse rounded-2xl bg-muted" />}><BookingCard hotel={hotel} room={room} contact={contact} idPrefix={prefix} /></Suspense>

  return (
    <>
      <nav aria-label={t('Hotel.breadcrumb')} className={`${CONTAINER} py-4 text-[14px]`}>
        <ol className="flex flex-wrap items-center gap-2 text-primary">
          <li><Link href="/" className="inline-flex min-h-8 items-center hover:underline">{t('Hotel.home')}</Link></li>
          <li aria-hidden>—</li>
          <li><Link href={`/hotel/${h.slug}`} className="inline-flex min-h-8 items-center hover:underline">{h.name}</Link></li>
          <li aria-hidden>—</li>
          <li className="font-semibold text-brand" aria-current="page">{room.name}</li>
        </ol>
      </nav>

      <div className={CONTAINER}><Gallery name={room.name} images={room.images} /></div>

      <div className={`${CONTAINER} grid grid-cols-1 gap-10 pt-8 lg:grid-cols-[minmax(0,1fr)_360px]`}>
        <div className="grid min-w-0 grid-cols-1 gap-12">
          <section id="tong-quan">
            <Link href={`/hotel/${h.slug}`} className={`${EYEBROW} hover:underline`}>{h.name} · {h.area}</Link>
            <h1 className="mt-2 text-[32px] leading-tight font-bold text-brand sm:text-[40px]">{room.name}</h1>
            <ul className="mt-4 flex flex-wrap gap-2 text-[14px]">
              <li className="inline-flex h-9 items-center gap-2 rounded-lg bg-mint px-3 text-brand"><Maximize2 className="size-4" aria-hidden />{room.size}</li>
              {room.beds && <li className="inline-flex h-9 items-center gap-2 rounded-lg bg-mint px-3 text-brand"><BedDouble className="size-4" aria-hidden />{room.beds}</li>}
              {room.view && <li className="inline-flex h-9 items-center gap-2 rounded-lg bg-mint px-3 text-brand"><Eye className="size-4" aria-hidden />{room.view}</li>}
            </ul>

            {/* Điện thoại: thẻ đặt phòng ngay dưới tên phòng — chọn ngày là việc đầu tiên */}
            <div id="dat-phong" className="mt-6 scroll-mt-24 lg:hidden">{card('m')}</div>

            <p className="mt-6 text-[16px] leading-relaxed">{room.description}</p>
            {room.features.length > 0 && <>
              <p className="mt-6 font-semibold text-brand">{t('Room.inRoom')}</p>
              <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">{room.features.map(f => <CheckItem key={f}>{f}</CheckItem>)}</ul>
            </>}
            {room.note && <p className="mt-6 flex gap-2.5 rounded-xl bg-muted px-4 py-3 text-[15px]"><Info className="mt-0.5 size-4 shrink-0 text-orange" aria-hidden />{room.note}</p>}
          </section>

          <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-muted" />}><PlanPicker hotel={hotel} room={room} /></Suspense>

          <Section id="chinh-sach" title={t('Room.beforeBooking')}>
            <ul className="mt-6 grid gap-3 sm:grid-cols-3">
              {[[LogIn, checkin], [LogOut, checkout], [CalendarClock, [t('Room.cancel'), h.cancel_summary]]].map(([Icon, row]) => {
                const I = Icon as typeof LogIn
                const [k, v] = row as [string, string]
                return (
                  <li key={k} className="rounded-xl border border-border px-4 py-3">
                    <p className="inline-flex items-center gap-2 text-[14px] text-muted-foreground"><I className="size-4 text-brand" aria-hidden />{k}</p>
                    <p className="mt-1 text-[15px] font-semibold">{v}</p>
                  </li>
                )
              })}
            </ul>
            {h.children && <InfoTable table={h.children} />}
            <div className="mt-4 flex flex-wrap gap-x-6">
              <Link href={`/hotel/${h.slug}#chinh-sach`} className={TEXT_LINK}>{t('Room.allPolicies')}<ArrowRight className="size-4" aria-hidden /></Link>
              <Link href="/chinh-sach-huy" className={TEXT_LINK}>{t('Room.cancelPolicy')}<ArrowRight className="size-4" aria-hidden /></Link>
            </div>
          </Section>

          {others.length > 0 && (
            <Section id="phong-khac" title={t('Room.others', { hotel: h.name })}>
              <ul className="mt-6 grid gap-4 sm:grid-cols-3">
                {others.map(r => (
                  <li key={r.slug}>
                    <Link href={roomHref(h.slug, r.slug)} className="group block">
                      <Photo src={r.images[0]} alt={r.name} sizes="(min-width: 640px) 250px, 100vw" className="aspect-[4/3] w-full rounded-xl" />
                      <p className="mt-2 font-semibold text-brand group-hover:underline">{r.name}</p>
                      <p className="text-[14px] text-muted-foreground">{r.size}{r.view ? ` · ${r.view}` : ''}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>

        <aside className="hidden lg:block" aria-label={t('Hotel.bookAria')}>
          <div className="sticky top-[calc(var(--header-offset)+24px)] transition-[top] duration-300">{card('d')}</div>
        </aside>
      </div>

      <Suspense><RoomMobileBar hotel={hotel} room={room} /></Suspense>
    </>
  )
}

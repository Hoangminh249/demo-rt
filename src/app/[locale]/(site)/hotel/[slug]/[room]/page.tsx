// Trang chi tiết phòng (thiết kế canvas "Chi tiết phòng", 08/10/2026) — nơi khách chốt phòng:
// mosaic ảnh · khung tên phòng đè mép ảnh (thông số) · đã gồm trong giá (khối xanh) · điểm nổi bật · trước khi đặt · phòng khác
// · thẻ đặt phòng dính → "Đặt phòng" sang /dat-phong (bản minh hoạ). Chưa có giá trực tuyến (Calista): thẻ "Liên hệ đặt phòng".
// Thang chữ cố định 12 · 14 · 16 · 20 · 28 · 44 (giá 32); màu chữ: brand (tiêu đề), foreground, muted-foreground, orange (nhãn nhấn).
import { notFound } from 'next/navigation'
import { Suspense, type ReactNode } from 'react'
import { Info } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { hotelApi } from '@/api/hotel'
import { siteApi } from '@/api/site'
import { roomHref } from '@/lib/booking'
import type { Locale } from '@/types/global'
import { CONTAINER, ICONS, Photo } from '@/components/site/kit'
import { Gallery } from '@/components/hotel/gallery'
import { BookingCard, LABEL, RoomCapacity, RoomMobileBar } from '@/components/room/room-booking'

export const dynamicParams = false
export const generateStaticParams = () => hotelApi.roomParams()
export const revalidate = 600

export async function generateMetadata({ params }: PageProps<'/[locale]/hotel/[slug]/[room]'>) {
  const { locale, slug, room } = await params
  const h = hotelApi.get(slug, locale as Locale)
  const r = h?.rooms.find(x => x.slug === room)
  return h && r ? { title: `${r.name} — ${h.name}`, description: r.description } : {}
}

const CARD = 'rounded-3xl bg-white p-6 sm:p-9'
const LINK = 'inline-flex min-h-8 items-center text-[14px] font-semibold text-primary underline-offset-4 hover:underline'
// Màu từng mốc phí huỷ (theo thứ tự trong cancel_summary): sớm → muộn → lễ Tết.
const CANCEL_TONE = ['bg-mint text-brand', 'bg-orange/10 text-orange', 'bg-muted text-foreground']
const time = (s: string) => s.match(/\d{1,2}:\d{2}/)?.[0] ?? s

function Stat({ label, children, first }: { label: string; children: ReactNode; first?: boolean }) {
  return (
    <div className={first ? 'pr-4 pt-4' : 'border-l border-border px-4 pt-4'}>
      <dt className="text-[12px] text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-[16px] leading-snug font-semibold sm:text-[20px]">{children}</dd>
    </div>
  )
}

export default async function RoomPage({ params }: PageProps<'/[locale]/hotel/[slug]/[room]'>) {
  const { locale, slug, room: roomSlug } = await params
  setRequestLocale(locale as Locale)
  const h = hotelApi.get(slug, locale as Locale)
  const room = h?.rooms.find(r => r.slug === roomSlug)
  if (!h || !room) notFound()
  const t = await getTranslations()
  const contact = siteApi.info(locale as Locale)
  const hotel = { slug: h.slug, code: h.code, name: h.name, online: h.online, opening: h.opening, cancel_summary: h.cancel_summary }
  const others = h.rooms.filter(r => r.slug !== room.slug)
  // File khách sạn luôn mở đầu chính sách bằng Nhận phòng, Trả phòng (src/content/*.ts).
<<<<<<< Updated upstream
  const [[, checkin], [, checkout]] = h.policies
  const cancel = h.cancel_summary.split(' · ').map(x => x.split(': '))
  const included = h.included.filter(i => i.desc)
  const extras = h.included.filter(i => !i.desc).map(i => i.label)
  const vatIncluded = h.included.some(i => i.icon === 'receipt')
  const card = (prefix: string) => (
    <Suspense fallback={<div className="h-[520px] animate-pulse rounded-3xl bg-white" />}>
      <BookingCard hotel={hotel} room={room} contact={contact} idPrefix={prefix} vatIncluded={vatIncluded} />
    </Suspense>
  )
=======
  const [checkin, checkout] = h.policies
  const card = (prefix: string) => <Suspense fallback={<div className="h-[420px] animate-pulse rounded-2xl bg-muted" />}><BookingCard hotel={hotel} room={room} contact={contact} idPrefix={prefix} included={h.included} /></Suspense>
>>>>>>> Stashed changes

  return (
    <div className="bg-[#f7f9f8] pb-24">
      <nav aria-label={t('Hotel.breadcrumb')} className={`${CONTAINER} py-4 text-[14px]`}>
        <ol className="flex flex-wrap items-center gap-2 text-muted-foreground">
          <li><Link href="/" className="inline-flex min-h-8 items-center hover:text-brand">{t('Hotel.home')}</Link></li>
          <li aria-hidden>/</li>
          <li><Link href={`/hotel/${h.slug}`} className="inline-flex min-h-8 items-center hover:text-brand">{h.name}</Link></li>
          <li aria-hidden>/</li>
          <li className="text-foreground" aria-current="page">{room.name}</li>
        </ol>
      </nav>

      <div className={CONTAINER}><Gallery name={room.name} images={room.images} /></div>

      <div className={`${CONTAINER} relative mt-6 flex flex-col gap-5 lg:-mt-[72px] lg:flex-row lg:items-start lg:gap-12`}>
        <main className="flex min-w-0 flex-1 flex-col gap-5">
          <header className="rounded-3xl bg-white px-6 pt-7 pb-6 shadow-[0_24px_48px_-32px_rgba(6,40,34,0.45)] sm:px-9 sm:pt-8 lg:mx-8">
            <Link href={`/hotel/${h.slug}`} className="inline-flex items-center gap-2.5 text-[12px] font-semibold tracking-[0.12em] text-orange uppercase hover:underline">
              <span className="h-px w-6 bg-orange" aria-hidden />{h.name} · {h.area}
            </Link>
            <h1 className="mt-3 text-[32px] leading-[1.05] font-bold tracking-[-0.02em] text-brand sm:text-[44px]">{room.name}</h1>
            <p className="mt-3 max-w-xl text-[16px] leading-relaxed">{room.description}</p>
            <dl className="mt-6 grid grid-cols-3 border-t border-border">
              <Stat first label={t('Room.statSize')}>{room.size}</Stat>
              <Stat label={t('Room.statView')}>{room.view ?? '—'}</Stat>
              <Stat label={t('Room.statCapacity')}><Suspense fallback="—"><RoomCapacity hotel={hotel} room={room} /></Suspense></Stat>
            </dl>
          </header>

          {/* Điện thoại: thẻ đặt phòng ngay dưới tên phòng — chọn ngày là việc đầu tiên */}
          <div id="dat-phong" className="scroll-mt-24 lg:hidden">{card('m')}</div>

          {included.length > 0 && (
            <section className="rounded-3xl bg-brand p-6 text-white sm:p-9">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-[12px] font-semibold tracking-[0.12em] text-[#9fd8cb] uppercase">{t('Room.included')}</h2>
                  <p className="mt-2.5 text-[28px] leading-tight font-semibold tracking-[-0.02em]">{t('Room.includedTitle')}</p>
                </div>
                <p className="text-[14px] text-white/80">{t('Room.includedNote')}</p>
              </div>
              <ul className="mt-7 grid gap-px overflow-hidden rounded-2xl bg-white/15 sm:grid-cols-2">
                {included.map(i => {
                  const Icon = ICONS[i.icon]
                  return (
                    <li key={i.label} className="flex gap-3.5 bg-brand p-5">
                      <Icon className="size-6 shrink-0 text-[#9fd8cb]" strokeWidth={1.7} aria-hidden />
                      <span><span className="block text-[16px] font-semibold">{i.label}</span><span className="mt-1 block text-[14px] leading-relaxed text-white/80">{i.desc}</span></span>
                    </li>
                  )
                })}
              </ul>
              {extras.length > 0 && <p className="mt-5 text-[14px] text-white/80">{t('Room.includedMore', { list: extras.join(' · ').toLowerCase() })}</p>}
            </section>
          )}

          {(room.features.length > 0 || room.note) && (
            <section className={CARD}>
              <h2 className={LABEL}>{t('Room.highlights')}</h2>
              {room.features.length > 0 && (
                <ol className="mt-5 grid gap-6 sm:grid-cols-3">
                  {room.features.map((f, i) => (
                    <li key={f} className="flex flex-col gap-2">
                      <span className="text-[28px] leading-none font-semibold text-orange tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                      <span className="text-[16px] font-semibold">{f}</span>
                    </li>
                  ))}
                </ol>
              )}
              {room.note && (
                <p className="mt-6 flex gap-3 rounded-2xl bg-orange/[0.06] px-4 py-3.5 text-[14px] leading-relaxed">
                  <Info className="mt-0.5 size-5 shrink-0 text-orange" aria-hidden />{room.note}
                </p>
              )}
            </section>
          )}

          <section className={CARD}>
            <h2 className={LABEL}>{t('Room.beforeBooking')}</h2>
            <div className="mt-6 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4">
              <div><p className="text-[12px] text-muted-foreground">{t('Booking.checkin')}</p><p className="mt-0.5 text-[28px] leading-tight font-semibold tracking-[-0.02em]">{time(checkin)}</p></div>
              <div className="relative border-t-2 border-dashed border-border-strong" aria-hidden>
                <span className="absolute -top-[7px] left-0 size-3 rounded-full bg-brand-accent" />
                <span className="absolute -top-[7px] right-0 size-3 rounded-full border-2 border-brand-accent bg-white" />
                <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[12px] whitespace-nowrap text-muted-foreground">{t('Room.yourStay')}</span>
              </div>
              <div className="text-right"><p className="text-[12px] text-muted-foreground">{t('Booking.checkout')}</p><p className="mt-0.5 text-[28px] leading-tight font-semibold tracking-[-0.02em]">{time(checkout)}</p></div>
            </div>

            <h3 className="mt-9 mb-3 text-[16px] font-semibold">{t('Room.cancelFees')}</h3>
            <ul className="grid overflow-hidden rounded-2xl sm:grid-cols-3">
              {cancel.map(([k, v], i) => (
                <li key={k} className={`px-4 py-3.5 text-[14px] ${CANCEL_TONE[i] ?? CANCEL_TONE[2]}`}>
                  <span className="block font-semibold first-letter:uppercase">{k}</span>{v && <span className="mt-0.5 block text-foreground first-letter:uppercase">{v}</span>}
                </li>
              ))}
            </ul>

            {h.children && (
              <>
                <h3 className="mt-9 mb-3 text-[16px] font-semibold">{t('Room.kids')}</h3>
                <ul className="grid gap-3 sm:grid-cols-3">
                  {h.children.rows.map(r => (
                    <li key={r[0]} className="rounded-2xl border border-border p-5">
                      <span className="block text-[20px] font-semibold tracking-[-0.01em]">{r[0]}</span>
                      <span className="mt-2 block text-[14px] leading-relaxed text-muted-foreground">{r[1]} · {h.children!.head[2]}: {r[2]}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <div className="mt-6 flex flex-wrap gap-x-7 gap-y-1">
              <Link href={`/hotel/${h.slug}#chinh-sach`} className={LINK}>{t('Room.allPolicies')} →</Link>
              <Link href="/chinh-sach-huy" className={LINK}>{t('Room.cancelPolicy')} →</Link>
            </div>
          </section>

          {others.length > 0 && (
            <section className={CARD}>
              <div className="flex items-baseline justify-between gap-3">
                <h2 className={LABEL}>{t('Room.others', { hotel: h.name })}</h2>
                <Link href={`/hotel/${h.slug}#phong`} className={LINK}>{t('Room.seeAll')} →</Link>
              </div>
              <ul className="mt-5 grid gap-4 sm:grid-cols-3">
                {others.map(r => (
                  <li key={r.slug}>
                    <Link href={roomHref(h.slug, r.slug)} className="group flex flex-col gap-2.5">
                      <span className="block overflow-hidden rounded-2xl">
                        <Photo src={r.images[0]} alt={r.name} sizes="(min-width: 640px) 250px, 100vw" className="aspect-[4/3] w-full transition-transform duration-700 ease-out group-hover:scale-[1.05]" />
                      </span>
                      <span className="text-[16px] font-semibold text-brand decoration-1 underline-offset-4 group-hover:underline">{r.name}</span>
                      <span className="text-[14px] text-muted-foreground">{r.size}{r.view ? ` · ${r.view}` : ''}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </main>

        <aside className="hidden w-[380px] shrink-0 lg:mt-24 lg:block lg:self-stretch" aria-label={t('Hotel.bookAria')}>
          <div className="sticky top-[calc(var(--header-offset)+24px)] transition-[top] duration-300">{card('d')}</div>
        </aside>
      </div>

      <Suspense><RoomMobileBar hotel={hotel} room={room} /></Suspense>
    </div>
  )
}

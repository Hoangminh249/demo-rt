// Trang "Đơn của tôi" (/don-cua-toi) và chi tiết đơn (/don-cua-toi/{mã}) — render ở server, dữ liệu do trang đọc qua
// bookingApi (chỉ đơn của chính khách). Phần cần JS trình duyệt (đếm ngược giữ phòng, huỷ đơn) ở orders-actions.tsx.
import type { ReactNode } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { ArrowLeft, Check } from 'lucide-react'
import { cn } from 'cn'
import { Link } from '@/i18n/navigation'
import { addDays, diffDays, fmtDate, fmtPrice, fmtWeekday, today } from '@/lib/format'
import type { LiveBooking, MyBooking } from '@/types/booking'
import { BTN, CONTAINER, EYEBROW, Photo } from '@/components/site/kit'
import { CancelBooking, HoldLeft } from './orders-actions'

type Status = LiveBooking['status']
export const ORDER_TABS = { upcoming: ['PENDING_PAYMENT', 'CONFIRMED', 'CHECKED_IN'], stayed: ['CHECKED_OUT', 'NO_SHOW'], cancelled: ['CANCELLED', 'EXPIRED'] } as const satisfies Record<string, readonly Status[]>
export type OrderTab = keyof typeof ORDER_TABS

const TONE: Record<Status, string> = {
  PENDING_PAYMENT: 'bg-orange/10 text-orange', CONFIRMED: 'bg-mint text-brand', CHECKED_IN: 'bg-mint text-brand', CHECKED_OUT: 'bg-muted text-muted-foreground',
  CANCELLED: 'bg-muted text-muted-foreground', EXPIRED: 'bg-muted text-muted-foreground', NO_SHOW: 'bg-muted text-muted-foreground',
}
const CARD = 'rounded-[20px] border border-border bg-white'

function StatusBadge({ status, children }: { status: Status; children: ReactNode }) {
  return <span className={cn('inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-semibold', TONE[status])}><span className="size-1.5 rounded-full bg-current" aria-hidden />{children}</span>
}

// ---------- Danh sách ----------

export function OrdersList({ items, tab, covers }: { items: MyBooking[]; tab: OrderTab; covers: Record<string, string | null> }) {
  const t = useTranslations('Orders')
  const locale = useLocale()
  const shown = items.filter(b => (ORDER_TABS[tab] as readonly Status[]).includes(b.status))
  const day = (iso: string) => `${fmtWeekday(iso, locale)}, ${fmtDate(iso, locale)}`
  return (
    <div className="bg-muted/60">
      <div className={`${CONTAINER} grid max-w-[960px] gap-5 pt-10 pb-16`}>
        <div>
          <p className={EYEBROW}>{t('eyebrow')}</p>
          <h1 className="mt-1.5 text-[30px] leading-tight font-bold text-brand sm:text-[34px]">{t('title')}</h1>
        </div>

        <nav aria-label={t('filter')} className="flex flex-wrap gap-2">
          {(Object.keys(ORDER_TABS) as OrderTab[]).map(k => {
            const n = items.filter(b => (ORDER_TABS[k] as readonly Status[]).includes(b.status)).length
            const on = k === tab
            return (
              <Link key={k} href={`/don-cua-toi?tab=${k}`} aria-current={on ? 'page' : undefined}
                className={cn('inline-flex h-11 items-center rounded-full border px-[18px] text-[14px] transition-colors', on ? 'border-brand bg-brand font-semibold text-white' : 'border-border-strong bg-white font-medium hover:bg-item-hover')}>
                {t(`tab.${k}`)} · {n}
              </Link>
            )
          })}
        </nav>

        {shown.length === 0 && <p className={`${CARD} px-6 py-10 text-center text-[15px] text-muted-foreground`}>{t('empty')}</p>}

        {shown.map(b => b.status === 'PENDING_PAYMENT' ? (
          <article key={b.code} className={`${CARD} grid gap-3 border-orange/30 px-5 py-5 sm:px-6`}>
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <StatusBadge status={b.status}>{b.holdExpiresAt ? <HoldLeft until={b.holdExpiresAt} /> : t('status.PENDING_PAYMENT')}</StatusBadge>
              <span className="text-[13px] text-muted-foreground">{t('code')} <b className="text-foreground tabular-nums">{b.code}</b></span>
            </div>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-[20px] font-bold text-brand">{b.hotel.name} · {b.room}</h2>
                <p className="mt-1 text-[14px] text-muted-foreground tabular-nums">{fmtDate(b.checkIn, locale)} → {fmtDate(b.checkOut, locale)} · {t('guests', { adults: b.adults, children: b.children })} · {t('totalOf', { total: fmtPrice(b.total) })}</p>
              </div>
              <Link href={`/dat-phong/thanh-toan?code=${encodeURIComponent(b.code)}`} className={`${BTN} h-11 rounded-xl`}>{t('payNow')}</Link>
            </div>
            <p className="text-[13px] text-muted-foreground">{t('holdNote')}</p>
          </article>
        ) : (
          <article key={b.code} className={`${CARD} grid overflow-hidden sm:grid-cols-[220px_minmax(0,1fr)]`}>
            <Photo src={covers[b.hotel.slug] ?? null} alt={b.hotel.name} sizes="(min-width: 640px) 220px, 100vw" className="min-h-[180px]" />
            <div className="grid min-w-0 gap-3 px-5 py-5 sm:px-6">
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <StatusBadge status={b.status}>{t(`status.${b.status}`)}</StatusBadge>
                <span className="text-[13px] text-muted-foreground">{t('code')} <b className="text-foreground tabular-nums">{b.code}</b></span>
              </div>
              <div>
                <h2 className="text-[22px] font-bold text-brand">{b.hotel.name}</h2>
                <p className="mt-0.5 text-[15px]">{b.rooms > 1 ? `${b.rooms} × ` : ''}{b.room} · {b.planName}</p>
              </div>
              <dl className="grid grid-cols-3 gap-3 rounded-2xl bg-muted/70 px-4 py-3">
                <div><dt className="text-[12px] text-muted-foreground">{t('checkin')}</dt><dd className="text-[15px] font-semibold">{day(b.checkIn)}</dd></div>
                <div><dt className="text-[12px] text-muted-foreground">{t('checkout')}</dt><dd className="text-[15px] font-semibold">{day(b.checkOut)}</dd></div>
                <div><dt className="text-[12px] text-muted-foreground">{t('guestsLabel')}</dt><dd className="text-[15px] font-semibold">{t('nightsGuests', { nights: diffDays(b.checkIn, b.checkOut), adults: b.adults, children: b.children })}</dd></div>
              </dl>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[14px] text-muted-foreground">{t('paid')} <b className="text-[18px] text-foreground tabular-nums">{fmtPrice(b.paidAmount)}</b></p>
                <Link href={`/don-cua-toi/${encodeURIComponent(b.code)}`} className="inline-flex h-11 items-center rounded-xl border border-primary px-5 text-[14px] font-semibold text-primary transition-colors hover:bg-mint">{t('detail')}</Link>
              </div>
            </div>
          </article>
        ))}

        <p className="mt-2 text-center text-[14px] text-muted-foreground">{t('help')}</p>
      </div>
    </div>
  )
}

// ---------- Chi tiết ----------

/** Các mốc huỷ kèm ngày cụ thể: "Huỷ đến hết 05/10" → phí 50%, "Từ 06/10" → 100%, không đến → %. */
function cancelRows(b: LiveBooking, locale: string, t: ReturnType<typeof useTranslations<'Orders'>>) {
  if (!b.cancel.refundable) return [{ label: t('nonRefundable'), pct: 100, now: true }]
  const tiers = [...b.cancel.tiers].sort((x, y) => y.daysBefore - x.daysBefore)
  const left = diffDays(today(), b.checkIn)
  const current = tiers.find(x => x.daysBefore <= left) ?? tiers[tiers.length - 1]
  return [
    ...tiers.map((x, i) => ({
      label: i === 0 ? t('tierUntil', { date: fmtDate(addDays(b.checkIn, -x.daysBefore), locale) }) : t('tierFrom', { date: fmtDate(addDays(b.checkIn, -tiers[i - 1].daysBefore + 1), locale) }),
      pct: x.penaltyPercent, now: x === current,
    })),
    { label: t('noShow'), pct: b.cancel.noShowPercent, now: false },
  ]
}

export function OrderDetail({ b, address }: { b: LiveBooking; address: string | null }) {
  const t = useTranslations('Orders')
  const locale = useLocale()
  const nights = diffDays(b.checkIn, b.checkOut)
  const longDay = (iso: string) => `${fmtWeekday(iso, locale)}, ${fmtDate(iso, locale)}`
  const short = (iso: string) => fmtDate(iso, locale).slice(0, 5)
  const max = Math.max(...b.nights.map(n => n.total))
  const varied = new Set(b.nights.map(n => n.total)).size > 1
  const done = (s: Status[]) => s.includes(b.status)
  const steps: [string, string, boolean][] = [
    [t('step.booked'), short(b.createdAt.slice(0, 10)), true],
    [t('step.paid'), b.payment ? short(b.payment.paidAt.slice(0, 10)) : '—', !!b.payment],
    [t('step.checkin'), `${short(b.checkIn)} · ${b.checkInTime}`, done(['CHECKED_IN', 'CHECKED_OUT'])],
    [t('step.checkout'), `${short(b.checkOut)} · ${b.checkOutTime}`, done(['CHECKED_OUT'])],
  ]
  const live = done(['PENDING_PAYMENT', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'])
  const badge = b.status === 'CONFIRMED' && b.balanceDue === 0 ? t('confirmedPaid') : t(`status.${b.status}`)

  return (
    <div className="bg-muted/60">
      <div className={`${CONTAINER} grid max-w-[1120px] gap-5 pt-8 pb-16`}>
        <Link href="/don-cua-toi" className="inline-flex h-11 w-fit items-center gap-1.5 text-[14px] font-medium text-foreground/70 hover:text-foreground"><ArrowLeft className="size-4" aria-hidden />{t('back')}</Link>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[14px] text-muted-foreground tabular-nums">{t('bookedOn', { code: b.code, date: fmtDate(b.createdAt.slice(0, 10), locale) })}</p>
            <h1 className="mt-1.5 text-[30px] leading-tight font-bold text-brand sm:text-[32px]">{b.hotel.name}</h1>
          </div>
          <span className={cn('inline-flex items-center gap-2 rounded-full px-4 py-2 text-[14px] font-semibold', TONE[b.status])}>{b.status === 'CONFIRMED' && <Check className="size-4" aria-hidden />}{badge}</span>
        </div>

        {live && (
          <ol aria-label={t('progress')} className={`${CARD} grid grid-cols-2 gap-4 px-6 py-[18px] sm:grid-cols-4`}>
            {steps.map(([label, when, ok]) => (
              <li key={label} className="grid gap-2">
                <span className={cn('h-1.5 rounded-full', ok ? 'bg-primary' : 'bg-border-strong')} aria-hidden />
                <span className={cn('text-[14px] font-semibold', !ok && 'text-muted-foreground')}>{label}{ok && <span className="sr-only"> ✓</span>}</span>
                <span className="text-[12px] text-muted-foreground tabular-nums">{when}</span>
              </li>
            ))}
          </ol>
        )}

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="grid min-w-0 gap-5">
            <section className={`${CARD} grid gap-4 p-6`}>
              <h2 className="text-lg font-bold">{t('stay')}</h2>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div><dt className="text-[13px] text-muted-foreground">{t('checkin')}</dt><dd className="text-[17px] font-semibold">{longDay(b.checkIn)}</dd><dd className="text-[13px] text-muted-foreground">{t('fromTime', { time: b.checkInTime })}</dd></div>
                <div><dt className="text-[13px] text-muted-foreground">{t('checkout')}</dt><dd className="text-[17px] font-semibold">{longDay(b.checkOut)}</dd><dd className="text-[13px] text-muted-foreground">{t('beforeTime', { time: b.checkOutTime })}</dd></div>
                <div><dt className="text-[13px] text-muted-foreground">{t('room')}</dt><dd className="text-[15px] font-semibold">{b.rooms} × {b.room.name} · {b.planName}</dd></div>
                <div><dt className="text-[13px] text-muted-foreground">{t('guestsLabel')}</dt><dd className="text-[15px] font-semibold">{t('guests', { adults: b.adults, children: b.children })}</dd></div>
              </dl>
              {address && <p className="border-t border-border pt-3.5 text-[14px] text-foreground/80">{address} · <Link href={`/hotel/${b.hotel.slug}#di-lai`} className="font-medium text-primary hover:underline">{t('directions')}</Link></p>}
            </section>

            <section className={`${CARD} overflow-hidden`}>
              <h2 className="px-6 pt-5 pb-3 text-lg font-bold">{t('nightly')}</h2>
              {b.nights.map(n => {
                const high = varied && n.total === max
                return (
                  <div key={n.date} className={cn('flex justify-between gap-4 border-t border-border px-6 py-3 text-[15px] tabular-nums', high && 'bg-orange/[0.06]')}>
                    <span>{fmtWeekday(n.date, locale)}, {short(n.date)}{high && <span className="text-[12px] font-semibold text-orange"> · {t('higher')}</span>}</span>
                    <span className={cn(high && 'font-semibold text-orange')}>{fmtPrice(n.total)}</span>
                  </div>
                )
              })}
              <div className="flex justify-between gap-4 border-t border-border-strong px-6 py-3.5 text-base font-bold tabular-nums"><span>{t('roomTotal', { n: nights })}</span><span className="text-brand">{fmtPrice(b.total)}</span></div>
              <p className="px-6 pb-5 text-[13px] text-muted-foreground">{t('priceNote')}</p>
            </section>

            <section className={`${CARD} grid gap-3.5 p-6`}>
              <h2 className="text-lg font-bold">{t('cancelTitle')}</h2>
              <ul className="grid gap-2 text-[14px]">
                {cancelRows(b, locale, t).map(r => (
                  <li key={r.label} className={cn('flex justify-between gap-3', r.now && live ? 'font-semibold' : 'text-muted-foreground')}><span>{r.label}</span><span className="shrink-0">{t('fee', { pct: r.pct })}</span></li>
                ))}
              </ul>
              {b.cancel.now && (
                <>
                  <p className="rounded-2xl bg-muted/70 px-4 py-3.5 text-[14px] leading-relaxed">
                    {b.status === 'PENDING_PAYMENT' ? t('cancelUnpaid') : t.rich('cancelNow', { penalty: fmtPrice(b.cancel.now.penalty), refund: fmtPrice(b.cancel.now.refund), b: c => <b>{c}</b> })} {t('changeDates')}
                  </p>
                  <CancelBooking code={b.code} penalty={b.cancel.now.penalty} refund={b.cancel.now.refund} unpaid={b.status === 'PENDING_PAYMENT'} />
                </>
              )}
              {b.cancelledAt && <p className="text-[14px] text-muted-foreground">{t('cancelledOn', { date: fmtDate(b.cancelledAt.slice(0, 10), locale) })}{b.needsRefund ? ` ${t('refundPending')}` : ''}</p>}
            </section>
          </div>

          <aside className="grid gap-5">
            <section className={`${CARD} grid gap-2.5 p-6 text-[14px] tabular-nums`}>
              <h2 className="mb-1 text-lg font-bold">{t('payTitle')}</h2>
              <div className="flex justify-between gap-3"><span className="text-muted-foreground">{t('orderTotal')}</span><span>{fmtPrice(b.total)}</span></div>
              <div className="flex justify-between gap-3"><span className="text-muted-foreground">{b.payment ? t('paidOn', { date: short(b.payment.paidAt.slice(0, 10)) }) : t('paid')}</span><span className="font-semibold text-brand">{fmtPrice(b.paidAmount)}</span></div>
              <div className="flex justify-between gap-3 border-t border-border pt-2.5 text-base font-bold"><span>{t('remaining')}</span><span>{fmtPrice(live ? b.balanceDue : 0)}</span></div>
              {b.payment && <p className="text-[13px] break-all text-muted-foreground">{b.payment.method ? t(`method.${b.payment.method}`) : t('methodOnline')} · {t('txn', { ref: b.payment.ref })}</p>}
            </section>

            <section className={`${CARD} grid gap-2 p-6 text-[14px]`}>
              <h2 className="mb-1 text-lg font-bold">{t('booker')}</h2>
              <p>{b.contact.name}</p>
              <p className="text-muted-foreground">{b.contact.phone} · {b.contact.email}</p>
              {b.contact.guestName && <p className="text-muted-foreground">{t('guestName', { name: b.contact.guestName })}</p>}
              {b.contact.specialRequests && <p className="text-muted-foreground">{t('requests', { text: b.contact.specialRequests })}</p>}
            </section>

            {(b.hotelContact.zalo || b.hotelContact.phone) && (
              <section className="grid gap-3 rounded-[20px] bg-brand p-6 text-white">
                <h2 className="text-lg font-bold">{t('helpTitle')}</h2>
                <p className="text-[14px] leading-relaxed text-white/80">{t('helpBody', { code: b.code })}</p>
                <div className="flex flex-wrap gap-2">
                  {b.hotelContact.zalo && <a href={b.hotelContact.zalo} target="_blank" rel="noopener" className="inline-flex h-11 items-center rounded-xl bg-white px-4 text-[14px] font-semibold text-brand">Zalo</a>}
                  {b.hotelContact.phone && <a href={`tel:${b.hotelContact.phone.replace(/\s/g, '')}`} className="inline-flex h-11 items-center rounded-xl border border-white/50 px-4 text-[14px] font-semibold text-white hover:bg-white/10">{t('call')}</a>}
                </div>
              </section>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}

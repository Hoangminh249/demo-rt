'use client'
// Bước 4 — Đặt phòng thành công (BẢN MINH HOẠ). Đọc bản nháp: giá đã chụp lúc thanh toán, không gọi lại Gohost.
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { CalendarCheck, Check, Copy, IdCard, Mail, MapPin, MessageCircle, Navigation, Phone } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { diffDays, fmtDate, fmtPrice, fmtWeekday } from '@/lib/format'
import { parseStay } from '@/lib/stay'
import type { BookingTarget } from '@/types/booking'
import type { Contact } from '@/types/hotel'
import { BTN, BTN_OUT, Photo } from '@/components/site/kit'
import { useDraft } from './draft'
import { BookingMissing, DemoNote } from './shell'

export function Confirmation({ target, contact }: { target: BookingTarget; contact: Contact }) {
  const t = useTranslations()
  const locale = useLocale()
  const sp = useSearchParams()
  const draft = useDraft()
  const [copied, setCopied] = useState(false)
  if (!draft) return <div className="mx-auto mt-10 h-96 max-w-site animate-pulse rounded-2xl bg-muted" />
  const { guest: g, payment: pay } = draft
  if (!g || !pay) return <BookingMissing title={t('Booking.noPayTitle')} body={t('Booking.noPayBody')} href={`/hotel/${target.hotel.slug}`} cta={t('Booking.noPayCta')} />

  const { hotel, room, times } = target
  const stay = parseStay(sp, hotel.opening)
  const nights = diffDays(stay.checkin, stay.checkout)
  const rest = pay.total - pay.paid
  const card = 'rounded-2xl border border-border bg-white p-5 sm:p-6'
  const next = [
    [Mail, t('Booking.next1Title'), t('Booking.next1', { email: g.email })],
    [IdCard, t('Booking.next2Title'), t('Booking.next2')],
    [CalendarCheck, t('Booking.next3Title'), t('Booking.next3', { checkin: times.checkin, checkout: times.checkout })],
  ] as const

  return (
    <div className="container-site pt-8 pb-16">
      <section className="flex flex-col gap-5 rounded-3xl bg-mint p-6 sm:flex-row sm:items-center sm:p-8">
        <span className="grid size-16 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"><Check className="size-8" strokeWidth={3} aria-hidden /></span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold tracking-wide text-orange uppercase">{t('Booking.doneEyebrow')}</p>
          <h1 className="mt-1 text-[28px] leading-tight font-bold text-brand sm:text-[34px]">{t('Booking.doneTitle', { name: g.name })}</h1>
          <p className="mt-1.5 text-[15px]">{t('Booking.doneBody', { email: g.email })}</p>
        </div>
        <div className="rounded-2xl bg-white px-5 py-4 sm:text-right">
          <p className="text-[13px] text-muted-foreground">{t('Booking.code')}</p>
          <p className="text-xl font-bold tracking-wide text-brand tabular-nums">{pay.code}</p>
          <button type="button" onClick={() => navigator.clipboard?.writeText(pay.code).then(() => setCopied(true))} className="mt-1 inline-flex min-h-8 cursor-pointer items-center gap-1.5 text-[13px] font-semibold text-primary">
            {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}{copied ? t('Booking.copied') : t('Booking.copy')}
          </button>
        </div>
      </section>
      <DemoNote className="mt-5" />

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid min-w-0 content-start gap-6">
          <section className={card}>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Photo src={room.images[0]} alt={room.name} sizes="200px" className="aspect-[4/3] w-full shrink-0 rounded-xl sm:w-48" />
              <div className="min-w-0">
                <p className="text-[13px] text-muted-foreground">{hotel.name}</p>
                <h2 className="text-xl font-bold text-brand">{room.name}</h2>
                <p className="mt-1 text-[14px]">{pay.plan}{pay.breakfast ? ` · ${t('Rooms.breakfast')}` : ''}</p>
                <p className="mt-2 flex gap-1.5 text-[14px] text-muted-foreground"><MapPin className="mt-0.5 size-4 shrink-0 text-orange" aria-hidden />{hotel.address}</p>
                <a href={hotel.map_url} target="_blank" rel="noopener" className="mt-1 inline-flex min-h-8 items-center gap-1.5 text-[14px] font-semibold text-primary hover:underline"><Navigation className="size-4" aria-hidden />{t('Hotel.directions')}</a>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {[[t('Booking.checkin'), stay.checkin, times.checkin], [t('Booking.checkout'), stay.checkout, times.checkout]].map(([k, iso, time]) => (
                <div key={k} className="rounded-xl bg-mint px-4 py-3">
                  <p className="text-[13px] text-muted-foreground">{k}</p>
                  <p className="text-lg font-bold text-brand tabular-nums">{fmtDate(iso, locale)}</p>
                  <p className="text-[13px]">{fmtWeekday(iso, locale)} · {time}</p>
                </div>
              ))}
            </div>
            <dl className="mt-4 grid gap-2 text-[14px]">
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground">{t('Booking.stay')}</dt><dd className="text-right font-medium">{t('Common.nights', { n: nights })} · {t('Common.guests', { adults: stay.adults, children: stay.children })}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground">{t('Booking.guestName')}</dt><dd className="text-right font-medium">{g.self ? g.name : g.guest}</dd></div>
              {g.arrival && <div className="flex justify-between gap-4"><dt className="text-muted-foreground">{t('Booking.arrivalTitle')}</dt><dd className="text-right font-medium">{t(`Booking.arrivals.${g.arrival}`)}</dd></div>}
              {g.requests.length > 0 && <div className="flex justify-between gap-4"><dt className="text-muted-foreground">{t('Booking.requestsTitle')}</dt><dd className="text-right font-medium">{g.requests.map(r => t(`Booking.requests.${r}`)).join(', ')}</dd></div>}
            </dl>
            {g.notes && <p className="mt-4 rounded-xl bg-muted px-4 py-3 text-[14px] italic">“{g.notes}”</p>}
          </section>

          <section>
            <h2 className="text-xl font-bold text-brand">{t('Booking.nextTitle')}</h2>
            <ol className="mt-4 grid gap-3 sm:grid-cols-3">
              {next.map(([Icon, title, body], i) => (
                <li key={title} className="rounded-2xl border border-border bg-white p-4">
                  <span className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-lg bg-mint text-brand"><Icon className="size-4" aria-hidden /></span><span className="text-[13px] text-muted-foreground">{i + 1}</span></span>
                  <p className="mt-3 font-semibold text-brand">{title}</p>
                  <p className="mt-1 text-[14px] text-muted-foreground">{body}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <div className="grid content-start gap-6">
          <section className={card}>
            <h2 className="text-lg font-bold text-brand">{t('Booking.payTitle')}</h2>
            <dl className="mt-3 grid gap-2 text-[14px] tabular-nums">
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground">{t('Booking.total')}</dt><dd className="font-medium">{fmtPrice(pay.total)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground">{pay.mode === 'deposit' ? t('Booking.paidDeposit') : t('Booking.paid')}</dt><dd className="font-semibold text-brand">{fmtPrice(pay.paid)}</dd></div>
              <div className="flex justify-between gap-4 border-t border-border pt-2"><dt className="font-semibold">{t('Booking.remaining')}</dt><dd className="font-bold">{fmtPrice(rest)}</dd></div>
            </dl>
            <p className="mt-3 text-[13px] text-muted-foreground">{pay.method === 'qr' ? t('Booking.viaQr') : t('Booking.viaCard')}{rest > 0 ? ` · ${t('Booking.restNote')}` : ''}</p>
          </section>
          <section className={card}>
            <h2 className="text-lg font-bold text-brand">{t('Booking.helpTitle')}</h2>
            <p className="mt-1 text-[14px] text-muted-foreground">{t('Booking.helpBody', { code: pay.code })}</p>
            <div className="mt-3 grid gap-1">
              <a href={contact.zalo} target="_blank" rel="noopener" className="inline-flex min-h-10 items-center gap-2 text-[15px] font-semibold text-primary hover:underline"><MessageCircle className="size-4" aria-hidden />Zalo {contact.phone_display}</a>
              <a href={`tel:${contact.phone}`} className="inline-flex min-h-10 items-center gap-2 text-[15px] font-semibold text-primary hover:underline"><Phone className="size-4" aria-hidden />{contact.phone_display}</a>
              <a href={`mailto:${contact.email}?subject=${encodeURIComponent(pay.code)}`} className="inline-flex min-h-10 items-center gap-2 text-[15px] font-semibold text-primary hover:underline"><Mail className="size-4" aria-hidden />{contact.email}</a>
            </div>
          </section>
          <div className="grid gap-3">
            <Link href={`/hotel/${hotel.slug}`} className={`${BTN} h-12`}>{t('Booking.backHotel')}</Link>
            <Link href="/chinh-sach-huy" className={`${BTN_OUT} h-12`}>{t('Booking.cancelPolicy')}</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

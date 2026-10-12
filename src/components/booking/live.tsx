// Đặt phòng thật (DATA_SOURCE=db) — các khối KHÔNG cần JS trình duyệt: thẻ đăng nhập Google, thẻ "chưa mở",
// tóm tắt booking (cột phải bước thanh toán / kết quả). Phần có tương tác ở live-payment.tsx, live-result.tsx.
import type { ReactNode } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Lock, LogIn, MessageCircle } from 'lucide-react'
import { diffDays, fmtDate, fmtPrice, fmtWeekday } from '@/lib/format'
import type { Contact } from '@/types/hotel'
import type { LiveBooking } from '@/types/booking'
import { BTN, BTN_OUT, Photo } from '@/components/site/kit'
import { OpenLoginButton } from '@/components/auth/account'

/** Chưa đăng nhập: nút mở modal đăng nhập (Google / email + mã); xong quay lại đúng trang này (lựa chọn trên URL). */
export function LoginCard() {
  const t = useTranslations('Live')
  return (
    <section className="rounded-2xl border border-border bg-white p-6 sm:p-8">
      <span className="grid size-11 place-items-center rounded-xl bg-mint"><Lock className="size-5 text-brand" aria-hidden /></span>
      <h2 className="mt-4 text-xl font-bold text-brand">{t('loginTitle')}</h2>
      <p className="mt-2 max-w-prose text-[15px] text-muted-foreground">{t('loginBody')}</p>
      <OpenLoginButton className={`${BTN} mt-6 h-12 px-6`}><LogIn className="size-4" aria-hidden />{t('loginCta')}</OpenLoginButton>
    </section>
  )
}

/** Đặt phòng thật chưa mở (thiếu cấu hình đăng nhập): mời liên hệ. */
export function ClosedCard({ contact }: { contact: Contact }) {
  const t = useTranslations('Live')
  return (
    <section className="rounded-2xl border border-border bg-white p-6 sm:p-8">
      <h2 className="text-xl font-bold text-brand">{t('closedTitle')}</h2>
      <p className="mt-2 max-w-prose text-[15px] text-muted-foreground">{t('closedBody')}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <a href={contact.zalo} target="_blank" rel="noopener" className={`${BTN} h-12`}><MessageCircle className="size-4" aria-hidden />Zalo</a>
        <a href={`tel:${contact.phone}`} className={`${BTN_OUT} h-12`}>{contact.phone_display}</a>
      </div>
    </section>
  )
}

/** Tóm tắt booking đã giữ: ảnh phòng, ngày, khách, tổng, đã trả, còn lại. Số lấy từ server (ảnh chụp lúc giữ phòng). */
export function LiveSummary({ b, image, extra }: { b: LiveBooking; image?: string; extra?: ReactNode }) {
  const t = useTranslations()
  const locale = useLocale()
  const day = (iso: string) => `${fmtWeekday(iso, locale)}, ${fmtDate(iso, locale)}`
  const rows: [string, string][] = [
    [t('Live.bookingCode'), b.code],
    [t('Booking.checkin'), day(b.checkIn)],
    [t('Booking.checkout'), day(b.checkOut)],
    [t('Booking.stay'), `${t('Common.nights', { n: diffDays(b.checkIn, b.checkOut) })} · ${t('Common.guests', { adults: b.adults, children: b.children })}`],
  ]
  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="flex gap-3">
        <Photo src={image ?? null} alt={b.room.name} sizes="96px" className="size-20 shrink-0 rounded-lg" />
        <div className="min-w-0">
          <p className="text-[13px] text-muted-foreground">{b.hotel.name}</p>
          <p className="font-semibold text-brand">{b.rooms > 1 ? `${b.rooms} × ` : ''}{b.room.name}</p>
          <p className="mt-0.5 text-[13px] text-muted-foreground">{b.planName}</p>
        </div>
      </div>
      <dl className="mt-4 grid gap-2.5 border-y border-border py-4 text-[14px]">
        {rows.map(([k, v]) => <div key={k} className="flex justify-between gap-4"><dt className="text-muted-foreground">{k}</dt><dd className="text-right font-medium tabular-nums">{v}</dd></div>)}
      </dl>
      <dl className="mt-4 grid gap-2 text-[15px]">
        <div className="flex justify-between gap-4 text-lg font-bold text-brand"><dt>{t('Live.total')}</dt><dd className="tabular-nums">{fmtPrice(b.total)}</dd></div>
        {b.paidAmount > 0 && <div className="flex justify-between gap-4"><dt className="text-muted-foreground">{t('Live.paid')}</dt><dd className="tabular-nums">{fmtPrice(b.paidAmount)}</dd></div>}
        {b.paidAmount > 0 && b.balanceDue > 0 && (
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{t('Live.balance')}<span className="block text-[13px]">{b.balanceDueAt ? t('Live.balanceBy', { date: fmtDate(b.balanceDueAt, locale) }) : t('Live.balanceAtDesk')}</span></dt>
            <dd className="tabular-nums">{fmtPrice(b.balanceDue)}</dd>
          </div>
        )}
      </dl>
      {extra}
    </div>
  )
}

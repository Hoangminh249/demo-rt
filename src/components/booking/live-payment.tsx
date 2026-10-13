'use client'
// Bước 3 (đặt phòng thật): phòng đang được giữ — đếm ngược, trả đủ một lần (bỏ đặt cọc 12/10/2026), chọn hình thức
// chuyển khoản ngân hàng hoặc OnePay, sang cổng thanh toán. Số tiền do server tính; kết quả CHỈ đến qua webhook.
import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { AlertTriangle, FlaskConical, Timer } from 'lucide-react'
import { cn } from 'cn'
import { Link } from '@/i18n/navigation'
import { fmtPrice } from '@/lib/format'
import { usePay } from '@/hooks/use-booking'
import { PAY_METHODS, type PayMethod } from '@/lib/booking-requests'
import type { LiveBooking } from '@/types/booking'
import { BTN, BTN_OUT } from '@/components/site/kit'
import { Spin } from '@/components/site/spin'

/** Giây còn lại tới `until` (null lúc render server để khỏi lệch giờ khi hydrate). */
export function useSecondsLeft(until: string | null) {
  const [left, setLeft] = useState<number | null>(null)
  useEffect(() => {
    const end = until ? new Date(until).getTime() : 0
    const tick = () => setLeft(Math.max(0, Math.round((end - Date.now()) / 1000)))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [until])
  return left
}
export const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

export function LivePayment({ b, failed, mock }: { b: LiveBooking; failed: boolean; mock: boolean }) {
  const t = useTranslations('Live')
  const locale = useLocale()
  const pay = usePay(b.code)
  const paying = pay.isPending || !!pay.data?.ok // có URL cổng rồi vẫn quay tới khi rời trang
  const [method, setMethod] = useState<PayMethod>('bank')
  const left = useSecondsLeft(b.holdExpiresAt)
  const expired = b.status === 'EXPIRED' || left === 0
  const amount = b.total - b.paidAmount
  const err = pay.data && !pay.data.ok ? pay.data.error : pay.isError ? 'ERROR' : null

  if (b.status !== 'PENDING_PAYMENT' && b.status !== 'EXPIRED') {
    return <Link href={`/don-cua-toi/${encodeURIComponent(b.code)}`} className={`${BTN} h-12 w-fit`}>{t('bookingCode')}: {b.code}</Link>
  }
  if (expired || err === 'EXPIRED') {
    return (
      <section role="alert" className="rounded-2xl border border-border bg-white p-6">
        <p className="flex gap-2 text-lg font-bold text-brand"><Timer className="mt-1 size-5 shrink-0 text-orange" aria-hidden />{t('holdExpired')}</p>
        <Link href={`/hotel/${b.hotel.slug}?room=${b.room.slug}#phong`} className={`${BTN} mt-5 h-12 w-fit`}>{t('rebook')}</Link>
      </section>
    )
  }

  return (
    <div className="grid gap-5">
      <p className={cn('flex w-fit items-center gap-2 rounded-full px-4 py-2 text-[14px] font-semibold tabular-nums', left !== null && left < 120 ? 'bg-orange/10 text-orange' : 'bg-orange/[0.07] text-orange')} aria-live="off">
        <Timer className="size-4 shrink-0" aria-hidden />
        {left === null ? '…' : t('holdLeft', { time: mmss(left) })}
      </p>
      {failed && <p role="alert" className="flex gap-2 rounded-xl bg-destructive/5 px-4 py-3 text-[14px] text-destructive"><AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />{t('payFailed')}</p>}

      <section className="grid gap-5 rounded-2xl border border-border bg-white p-5 sm:p-6">
        <div className="grid gap-3">
          <h2 className="text-lg font-bold">{t('payAmountTitle')}</h2>
          <div className="grid gap-1 rounded-2xl border-2 border-primary bg-mint/40 p-4">
            <span className="text-[14px] font-semibold text-brand">{t('payFullTitle')}</span>
            <span className="text-[30px] leading-tight font-bold tabular-nums">{fmtPrice(amount)}</span>
            <span className="text-[13px] text-muted-foreground">{t('payFullSub')}</span>
          </div>
        </div>

        <fieldset className="grid gap-2.5">
          <legend className="mb-3 text-lg font-bold">{t('methodTitle')}</legend>
          {PAY_METHODS.map(m => (
            <label key={m} className={cn('flex cursor-pointer items-center gap-3 rounded-2xl border bg-white px-4 py-3.5 transition-colors', method === m ? 'border-2 border-primary bg-mint/40' : 'border-border-strong hover:bg-item-hover')}>
              <input type="radio" name="pay-method" value={m} checked={method === m} onChange={() => setMethod(m)} className="size-[18px] accent-primary" />
              <span className="grid gap-0.5"><span className="text-[15px] font-semibold">{t(`method.${m}`)}</span><span className="text-[13px] text-muted-foreground">{t(`methodSub.${m}`)}</span></span>
            </label>
          ))}
        </fieldset>

        {mock && <p className="flex gap-2 rounded-xl border border-dashed border-orange/50 bg-orange/5 px-4 py-3 text-[13px]"><FlaskConical className="mt-0.5 size-4 shrink-0 text-orange" aria-hidden />{t('payMock')}</p>}
        {err && err !== 'EXPIRED' && <p role="alert" className="text-[14px] text-destructive">{t('payError')}</p>}
        <button type="button" disabled={paying} aria-busy={paying}
          onClick={() => pay.mutate({ method, locale: locale === 'en' ? 'en' : 'vi' }, { onSuccess: r => { if (r.ok) window.location.assign(r.url) } })}
          className={`${BTN} h-12 w-full`}><Spin on={paying} />{t('payCta', { amount: fmtPrice(amount) })}</button>
      </section>

      <Link href={`/hotel/${b.hotel.slug}?room=${b.room.slug}#phong`} className={`${BTN_OUT} h-12 w-fit`}>{t('rebook')}</Link>
    </div>
  )
}

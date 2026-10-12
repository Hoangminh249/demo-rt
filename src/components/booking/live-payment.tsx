'use client'
// Bước 3 (đặt phòng thật): phòng đang được giữ — đếm ngược, chọn cọc / trả đủ, sang cổng thanh toán.
// Số tiền do server tính (booking đã lưu); trình duyệt chỉ gửi lựa chọn cọc hay trả đủ. Kết quả CHỈ đến qua webhook.
import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { AlertTriangle, Check, FlaskConical, Timer } from 'lucide-react'
import { cn } from 'cn'
import { Link } from '@/i18n/navigation'
import { fmtPrice } from '@/lib/format'
import { usePay } from '@/hooks/use-booking'
import type { LiveBooking } from '@/types/booking'
import { BTN, BTN_OUT } from '@/components/site/kit'

function Option({ checked, onSelect, title, sub, amount }: { checked: boolean; onSelect: () => void; title: string; sub: string; amount: string }) {
  return (
    <button type="button" role="radio" aria-checked={checked} onClick={onSelect}
      className={cn('flex cursor-pointer items-start gap-3 rounded-2xl border bg-white p-4 text-left transition-colors', checked ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-border-strong hover:bg-item-hover')}>
      <span className={cn('grid size-6 shrink-0 place-items-center rounded-full border', checked ? 'border-primary bg-primary text-primary-foreground' : 'border-border-strong')}>{checked && <Check className="size-4" aria-hidden />}</span>
      <span className="min-w-0 flex-1"><span className="block font-semibold text-brand">{title}</span><span className="block text-[13px] text-muted-foreground">{sub}</span></span>
      <span className="shrink-0 text-right font-bold tabular-nums">{amount}</span>
    </button>
  )
}

export function LivePayment({ b, failed, mock }: { b: LiveBooking; failed: boolean; mock: boolean }) {
  const t = useTranslations('Live')
  const locale = useLocale()
  const pay = usePay(b.code)
  const canDeposit = b.depositAmount < b.total
  const [mode, setMode] = useState<'deposit' | 'full'>(canDeposit ? 'deposit' : 'full')
  const [left, setLeft] = useState<number | null>(null) // giây; null lúc render server (tránh lệch giờ khi hydrate)
  useEffect(() => {
    const end = b.holdExpiresAt ? new Date(b.holdExpiresAt).getTime() : 0
    const tick = () => setLeft(Math.max(0, Math.round((end - Date.now()) / 1000)))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [b.holdExpiresAt])

  const expired = b.status === 'EXPIRED' || left === 0
  const amount = mode === 'deposit' ? b.depositAmount : b.total
  const err = pay.data && !pay.data.ok ? pay.data.error : pay.isError ? 'ERROR' : null

  if (b.status !== 'PENDING_PAYMENT' && b.status !== 'EXPIRED') {
    return <Link href={`/dat-phong/xac-nhan?code=${encodeURIComponent(b.code)}`} className={`${BTN} h-12 w-fit`}>{t('bookingCode')}: {b.code}</Link>
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
      <p className={cn('flex items-center gap-2 rounded-xl px-4 py-3 text-[15px] font-semibold tabular-nums', left !== null && left < 120 ? 'bg-orange/10 text-orange' : 'bg-mint text-brand')} aria-live="off">
        <Timer className="size-5 shrink-0" aria-hidden />
        {left === null ? '…' : t('holdLeft', { time: `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}` })}
      </p>
      {failed && <p role="alert" className="flex gap-2 rounded-xl bg-destructive/5 px-4 py-3 text-[14px] text-destructive"><AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />{t('payFailed')}</p>}

      <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
        <div role="radiogroup" aria-label={t('quoteTitle')} className="grid gap-3 sm:grid-cols-2">
          {canDeposit && <Option checked={mode === 'deposit'} onSelect={() => setMode('deposit')} title={t('payDepositTitle')} sub={t('payDepositSub', { rest: fmtPrice(b.total - b.depositAmount) })} amount={fmtPrice(b.depositAmount)} />}
          <Option checked={mode === 'full'} onSelect={() => setMode('full')} title={t('payFullTitle')} sub={t('payFullSub')} amount={fmtPrice(b.total)} />
        </div>
        {mock && <p className="mt-4 flex gap-2 rounded-xl border border-dashed border-orange/50 bg-orange/5 px-4 py-3 text-[13px]"><FlaskConical className="mt-0.5 size-4 shrink-0 text-orange" aria-hidden />{t('payMock')}</p>}
        {err && err !== 'EXPIRED' && <p role="alert" className="mt-4 text-[14px] text-destructive">{t('payError')}</p>}
        <button type="button" disabled={pay.isPending || (pay.data?.ok ?? false)}
          onClick={() => pay.mutate({ mode, locale: locale === 'en' ? 'en' : 'vi' }, { onSuccess: r => { if (r.ok) window.location.assign(r.url) } })}
          className={`${BTN} mt-5 h-12 w-full`}>{t('payCta', { amount: fmtPrice(amount) })}</button>
      </section>

      <Link href={`/hotel/${b.hotel.slug}?room=${b.room.slug}#phong`} className={`${BTN_OUT} h-12 w-fit`}>{t('rebook')}</Link>
    </div>
  )
}

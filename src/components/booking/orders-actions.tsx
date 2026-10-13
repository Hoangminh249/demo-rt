'use client'
// Phần tương tác của trang đơn: đếm ngược giữ phòng, nút huỷ đơn (hỏi lại kèm phí huỷ / tiền hoàn rồi gọi API).
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { fmtPrice } from '@/lib/format'
import { useCancelBooking } from '@/hooks/use-booking'
import { Dialog } from '@/components/ui/overlay'
import { BTN_OUT } from '@/components/site/kit'
import { Spin } from '@/components/site/spin'
import { mmss, useSecondsLeft } from './live-payment'

export function HoldLeft({ until }: { until: string }) {
  const t = useTranslations('Orders')
  const left = useSecondsLeft(until)
  return <>{t('holding', { time: left === null ? '…' : mmss(left) })}</>
}

export function CancelBooking({ code, penalty, refund, unpaid }: { code: string; penalty: number; refund: number; unpaid: boolean }) {
  const t = useTranslations('Orders')
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const cancel = useCancelBooking(code)
  const failed = cancel.isError || (cancel.data && !cancel.data.ok)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex h-11 w-fit cursor-pointer items-center rounded-xl border border-destructive/30 bg-white px-[18px] text-[14px] font-semibold text-destructive transition-colors hover:bg-destructive/5">{t('cancelCta')}</button>
      <Dialog open={open} onClose={() => setOpen(false)} title={t('cancelConfirmTitle', { code })}
        footer={<>
          <button type="button" onClick={() => setOpen(false)} className={BTN_OUT}>{t('cancelKeep')}</button>
          <button type="button" disabled={cancel.isPending}
            onClick={() => cancel.mutate(undefined, { onSuccess: r => { if (r.ok) { setOpen(false); router.refresh() } } })}
            className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-destructive px-5 text-[15px] font-semibold text-white disabled:opacity-50"><Spin on={cancel.isPending} />{t('cancelDo')}</button>
        </>}>
        <p className="text-[15px] leading-relaxed">{unpaid ? t('cancelUnpaid') : t('cancelConfirmBody', { penalty: fmtPrice(penalty), refund: fmtPrice(refund) })}</p>
        {failed && <p role="alert" className="mt-3 text-[14px] text-destructive">{t('cancelFailed')}</p>}
      </Dialog>
    </>
  )
}

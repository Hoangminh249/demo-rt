'use client'
// Bước 4 (đặt phòng thật): trang trở về từ cổng thanh toán — CHỈ hiển thị. Hỏi lại server mỗi 2 giây tới khi
// booking rời trạng thái chờ (webhook mới là nơi xác nhận). Thôi hỏi sau ~1 phút: hiện nút tiếp tục thanh toán.
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { CircleCheck, CircleX, Hourglass, ReceiptText } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { useLiveBooking } from '@/hooks/use-booking'
import type { LiveBooking } from '@/types/booking'
import { BTN, BTN_OUT, CONTAINER } from '@/components/site/kit'
import { LiveSummary } from './live'

const GIVE_UP_MS = 60_000

export function LiveResult({ initial, image }: { initial: LiveBooking; image?: string }) {
  const t = useTranslations('Live')
  const [gaveUp, setGaveUp] = useState(false)
  useEffect(() => { const id = setTimeout(() => setGaveUp(true), GIVE_UP_MS); return () => clearTimeout(id) }, [])
  const pending = (x: LiveBooking) => x.status === 'PENDING_PAYMENT' && !x.lastPaymentFailed && !gaveUp
  const q = useLiveBooking(initial.code, x => pending(x ?? initial))
  const b = q.data ?? initial
  const waiting = pending(b)

  const view = b.needsRefund
    ? { icon: <ReceiptText className="size-10 text-orange" aria-hidden />, title: t('refundTitle'), body: t('refundBody', { code: b.code }) }
    : b.status === 'CONFIRMED' || b.status === 'CHECKED_IN' || b.status === 'CHECKED_OUT'
      ? { icon: <CircleCheck className="size-10 text-primary" aria-hidden />, title: t('confirmedTitle'), body: t('confirmedBody') }
      : waiting
        ? { icon: <Hourglass className="size-10 animate-pulse text-brand" aria-hidden />, title: t('checking'), body: t('checkingSub') }
        : b.status === 'EXPIRED'
          ? { icon: <CircleX className="size-10 text-destructive" aria-hidden />, title: t('expiredTitle'), body: t('expiredBody') }
          : b.status === 'PENDING_PAYMENT'
            ? { icon: <Hourglass className="size-10 text-orange" aria-hidden />, title: t('pendingTitle'), body: '' }
            : { icon: <CircleX className="size-10 text-muted-foreground" aria-hidden />, title: t('cancelledTitle'), body: '' }

  return (
    <div className={`${CONTAINER} grid gap-8 pt-10 pb-16 lg:grid-cols-[minmax(0,1fr)_380px]`}>
      <section aria-live="polite" className="flex flex-col items-start">
        {view.icon}
        <h1 className="mt-4 text-[28px] leading-tight font-bold text-brand sm:text-[34px]">{view.title}</h1>
        {view.body && <p className="mt-2 max-w-prose text-[16px] text-muted-foreground">{view.body}</p>}
        <p className="mt-6 text-[14px] text-muted-foreground">{t('bookingCode')}</p>
        <p className="text-2xl font-bold tracking-wide text-brand tabular-nums">{b.code}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          {(b.status === 'CONFIRMED' || b.status === 'CHECKED_IN' || b.status === 'CHECKED_OUT') && <Link href={`/don-cua-toi/${encodeURIComponent(b.code)}`} className={`${BTN} h-12`}>{t('viewOrder')}</Link>}
          {b.status === 'PENDING_PAYMENT' && !waiting && <Link href={`/dat-phong/thanh-toan?code=${encodeURIComponent(b.code)}`} className={`${BTN} h-12`}>{t('continuePay')}</Link>}
          {b.status === 'EXPIRED' && !b.needsRefund && <Link href={`/hotel/${b.hotel.slug}?room=${b.room.slug}#phong`} className={`${BTN} h-12`}>{t('rebook')}</Link>}
          <Link href="/" className={`${BTN_OUT} h-12`}>{t('home')}</Link>
        </div>
      </section>
      <aside><LiveSummary b={b} image={image} /></aside>
    </div>
  )
}

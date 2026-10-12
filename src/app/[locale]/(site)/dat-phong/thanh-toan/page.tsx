// Bước 3 đặt phòng — thanh toán.
// Nguồn gohost: BẢN MINH HOẠ (QR Vietcombank / OnePay giả, ?hotel=&room=…). Nguồn db: booking đã giữ (?code=RH-…[&failed=1]) —
// đếm ngược giữ phòng, chọn cọc / trả đủ, sang cổng thanh toán. Chỉ chủ booking xem được.
import { Suspense } from 'react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { bookingApi } from '@/api/booking'
import { hotelApi } from '@/api/hotel'
import { currentUser } from '@/auth'
import type { Locale } from '@/types/global'
import { BookingMissing, BookingShell } from '@/components/booking/shell'
import { MobileSummary, Summary } from '@/components/booking/summary'
import { Payment } from '@/components/booking/payment'
import { LiveSummary } from '@/components/booking/live'
import { LivePayment } from '@/components/booking/live-payment'

export async function generateMetadata() {
  const t = await getTranslations('Booking')
  return { title: t('payPageTitle'), robots: { index: false } }
}

export default async function PaymentPage({ params, searchParams }: PageProps<'/[locale]/dat-phong/thanh-toan'>) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
  const sp = await searchParams
  const t = await getTranslations('Booking')
  const missing = <BookingMissing title={t('missingTitle')} body={t('missingBody')} href="/#khach-san" cta={t('missingCta')} />

  if (bookingApi.enabled()) {
    const tl = await getTranslations('Live')
    const user = await currentUser()
    const b = user && typeof sp.code === 'string' ? await bookingApi.get(user.id, sp.code) : null
    if (!b) return <BookingMissing title={tl('notFoundTitle')} body={tl('notFoundBody')} href="/#khach-san" cta={t('missingCta')} />
    const image = (await hotelApi.bookingTarget(b.hotel.slug, b.room.slug, locale as Locale))?.room.images[0]
    return (
      <BookingShell step={2} title={t('payPageTitle')} lead={t('payPageLead')} aside={<LiveSummary b={b} image={image} />}>
        <div className="mb-5 lg:hidden"><LiveSummary b={b} image={image} /></div>
        <LivePayment b={b} failed={sp.failed === '1'} mock={bookingApi.mockPayments()} />
      </BookingShell>
    )
  }

  const target = await hotelApi.bookingTarget(sp.hotel as string, sp.room as string, locale as Locale)
  if (!target) return missing
  return (
    <BookingShell step={2} title={t('payPageTitle')} lead={t('payPageLead')} demo aside={<Suspense><Summary target={target} /></Suspense>}>
      <Suspense>
        <MobileSummary target={target} />
        <Payment target={target} />
      </Suspense>
    </BookingShell>
  )
}

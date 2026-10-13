// Bước 3 đặt phòng — thanh toán.
// Booking đã giữ (?code=RH-…[&failed=1]) — đếm ngược giữ phòng, trả đủ qua ngân hàng / OnePay. Chỉ chủ booking xem được.
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { bookingApi } from '@/api/booking'
import { hotelApi } from '@/api/hotel'
import { currentUser } from '@/auth'
import type { Locale } from '@/types/global'
import { BookingMissing, BookingShell } from '@/components/booking/shell'
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

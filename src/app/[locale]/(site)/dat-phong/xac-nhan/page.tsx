// Bước 4 — kết quả đặt phòng.
// Nguồn gohost: BẢN MINH HOẠ (chưa gửi email thật, chưa có booking). Nguồn db: trang trở về từ cổng thanh toán (?code=RH-…),
// chỉ hiển thị + hỏi lại trạng thái mỗi 2 giây — booking chỉ được xác nhận qua webhook.
import { Suspense } from 'react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { bookingApi } from '@/api/booking'
import { hotelApi } from '@/api/hotel'
import { siteApi } from '@/api/site'
import { currentUser } from '@/auth'
import type { Locale } from '@/types/global'
import { BookingMissing, Steps } from '@/components/booking/shell'
import { Confirmation } from '@/components/booking/confirmation'
import { LiveResult } from '@/components/booking/live-result'

export async function generateMetadata() {
  const t = await getTranslations('Booking')
  return { title: t('donePageTitle'), robots: { index: false } }
}

export default async function DonePage({ params, searchParams }: PageProps<'/[locale]/dat-phong/xac-nhan'>) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
  const sp = await searchParams
  const t = await getTranslations('Booking')

  if (bookingApi.enabled()) {
    const tl = await getTranslations('Live')
    const user = await currentUser()
    const b = user && typeof sp.code === 'string' ? await bookingApi.get(user.id, sp.code) : null
    if (!b) return <BookingMissing title={tl('notFoundTitle')} body={tl('notFoundBody')} href="/#khach-san" cta={t('missingCta')} />
    return (
      <>
        <Steps current={3} />
        <LiveResult initial={b} image={(await hotelApi.bookingTarget(b.hotel.slug, b.room.slug, locale as Locale))?.room.images[0]} />
      </>
    )
  }

  const target = await hotelApi.bookingTarget(sp.hotel as string, sp.room as string, locale as Locale)
  if (!target) return <BookingMissing title={t('missingTitle')} body={t('missingBody')} href="/#khach-san" cta={t('missingCta')} />
  return (
    <>
      <Steps current={3} />
      <Suspense><Confirmation target={target} contact={siteApi.info(locale as Locale)} /></Suspense>
    </>
  )
}

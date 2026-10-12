// Chi tiết một đơn của khách đang đăng nhập: tiến trình, kỳ ở, giá từng đêm đã chốt, huỷ đơn, thanh toán, liên hệ khách sạn.
// Người khác / mã sai → "Không tìm thấy đặt phòng" (không lộ đơn tồn tại hay không).
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { bookingApi } from '@/api/booking'
import { hotelApi } from '@/api/hotel'
import { currentUser } from '@/auth'
import type { Locale } from '@/types/global'
import { LoginCard } from '@/components/booking/live'
import { OrderDetail } from '@/components/booking/orders'
import { BookingMissing } from '@/components/booking/shell'
import { CONTAINER } from '@/components/site/kit'

export async function generateMetadata({ params }: PageProps<'/[locale]/don-cua-toi/[code]'>) {
  return { title: decodeURIComponent((await params).code), robots: { index: false } }
}

export default async function OrderPage({ params }: PageProps<'/[locale]/don-cua-toi/[code]'>) {
  const { locale, code } = await params
  setRequestLocale(locale as Locale)
  if (!bookingApi.enabled()) notFound()
  const t = await getTranslations('Orders')
  const user = await currentUser()
  if (!user) return <div className={`${CONTAINER} max-w-[720px] py-16`}><LoginCard title={t('loginTitle')} body={t('loginBody')} /></div>
  const b = await bookingApi.get(user.id, decodeURIComponent(code))
  if (!b) {
    const tl = await getTranslations('Live')
    return <BookingMissing title={tl('notFoundTitle')} body={tl('notFoundBody')} href="/don-cua-toi" cta={t('back')} />
  }
  const hotel = await hotelApi.get(b.hotel.slug, locale as Locale)
  return <OrderDetail b={b} address={hotel?.address ?? null} />
}

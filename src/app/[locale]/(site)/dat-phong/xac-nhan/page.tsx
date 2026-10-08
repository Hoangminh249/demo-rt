// Bước 4 — đặt phòng thành công (BẢN MINH HOẠ: chưa gửi email thật, chưa có booking trên Gohost).
import { Suspense } from 'react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { hotelApi } from '@/api/hotel'
import { siteApi } from '@/api/site'
import type { Locale } from '@/types/global'
import { BookingMissing, Steps } from '@/components/booking/shell'
import { Confirmation } from '@/components/booking/confirmation'

export async function generateMetadata() {
  const t = await getTranslations('Booking')
  return { title: t('donePageTitle'), robots: { index: false } }
}

export default async function DonePage({ params, searchParams }: PageProps<'/[locale]/dat-phong/xac-nhan'>) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
  const sp = await searchParams
  const t = await getTranslations('Booking')
  const target = hotelApi.bookingTarget(sp.hotel as string, sp.room as string, locale as Locale)
  if (!target) return <BookingMissing title={t('missingTitle')} body={t('missingBody')} href="/#khach-san" cta={t('missingCta')} />
  return (
    <>
      <Steps current={3} />
      <Suspense><Confirmation target={target} contact={siteApi.info(locale as Locale)} /></Suspense>
    </>
  )
}

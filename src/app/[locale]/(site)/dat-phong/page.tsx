// Bước 2 đặt phòng — thông tin khách & yêu cầu lưu trú (bản minh hoạ, chạy ở trình duyệt). URL: ?hotel=&room=&plan=&in=&out=&a=&c=
import { Suspense } from 'react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { hotelApi } from '@/api/hotel'
import type { Locale } from '@/types/global'
import { BookingMissing, BookingShell } from '@/components/booking/shell'
import { MobileSummary, Summary } from '@/components/booking/summary'
import { GuestForm } from '@/components/booking/guest-form'

export async function generateMetadata() {
  const t = await getTranslations('Booking')
  return { title: t('guestPageTitle'), robots: { index: false } }
}

export default async function GuestPage({ params, searchParams }: PageProps<'/[locale]/dat-phong'>) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
  const sp = await searchParams
  const t = await getTranslations('Booking')
  const target = hotelApi.bookingTarget(sp.hotel as string, sp.room as string, locale as Locale)
  if (!target) return <BookingMissing title={t('missingTitle')} body={t('missingBody')} href="/#khach-san" cta={t('missingCta')} />
  return (
    <BookingShell step={1} title={t('guestPageTitle')} lead={t('guestPageLead')} aside={<Suspense><Summary target={target} /></Suspense>}>
      <Suspense>
        <MobileSummary target={target} />
        <GuestForm target={target} />
      </Suspense>
    </BookingShell>
  )
}

// Bước 3 đặt phòng — thanh toán (BẢN MINH HOẠ: QR Vietcombank / OnePay giả, không có giao dịch thật).
import { Suspense } from 'react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { hotelApi } from '@/api/hotel'
import type { Locale } from '@/types/global'
import { BookingMissing, BookingShell } from '@/components/booking/shell'
import { MobileSummary, Summary } from '@/components/booking/summary'
import { Payment } from '@/components/booking/payment'

export async function generateMetadata() {
  const t = await getTranslations('Booking')
  return { title: t('payPageTitle'), robots: { index: false } }
}

export default async function PaymentPage({ params, searchParams }: PageProps<'/[locale]/dat-phong/thanh-toan'>) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
  const sp = await searchParams
  const t = await getTranslations('Booking')
  const target = hotelApi.bookingTarget(sp.hotel as string, sp.room as string, locale as Locale)
  if (!target) return <BookingMissing title={t('missingTitle')} body={t('missingBody')} href="/#khach-san" cta={t('missingCta')} />
  return (
    <BookingShell step={2} title={t('payPageTitle')} lead={t('payPageLead')} demo aside={<Suspense><Summary target={target} /></Suspense>}>
      <Suspense>
        <MobileSummary target={target} />
        <Payment target={target} />
      </Suspense>
    </BookingShell>
  )
}

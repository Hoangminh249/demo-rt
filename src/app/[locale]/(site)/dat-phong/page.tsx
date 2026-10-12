// Bước 2 đặt phòng — thông tin khách & yêu cầu lưu trú. URL: ?hotel=&room=&plan=&in=&out=&a=&c=
// Nguồn gohost: bản minh hoạ chạy ở trình duyệt. Nguồn db: bắt đăng nhập (modal Google / email + mã, quay lại đúng URL này),
// báo giá server + mã khuyến mãi, bấm nút là giữ phòng.
import { Suspense, type ReactNode } from 'react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { bookingApi } from '@/api/booking'
import { hotelApi } from '@/api/hotel'
import { siteApi } from '@/api/site'
import { authConfigured, currentUser } from '@/auth'
import type { Locale } from '@/types/global'
import { BookingMissing, BookingShell } from '@/components/booking/shell'
import { MobileSummary, Summary } from '@/components/booking/summary'
import { GuestForm, type LiveAccount } from '@/components/booking/guest-form'
import { ClosedCard, LoginCard } from '@/components/booking/live'

export async function generateMetadata() {
  const t = await getTranslations('Booking')
  return { title: t('guestPageTitle'), robots: { index: false } }
}

export default async function GuestPage({ params, searchParams }: PageProps<'/[locale]/dat-phong'>) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
  const sp = await searchParams
  const t = await getTranslations('Booking')
  const target = await hotelApi.bookingTarget(sp.hotel as string, sp.room as string, locale as Locale)
  if (!target) return <BookingMissing title={t('missingTitle')} body={t('missingBody')} href="/#khach-san" cta={t('missingCta')} />
  const shell = (body: ReactNode) => (
    <BookingShell step={1} title={t('guestPageTitle')} lead={t('guestPageLead')} aside={<Suspense><Summary target={target} /></Suspense>}>
      <Suspense><MobileSummary target={target} />{body}</Suspense>
    </BookingShell>
  )

  let live: LiveAccount | undefined
  if (bookingApi.enabled()) {
    if (!authConfigured()) return shell(<ClosedCard contact={siteApi.info(locale as Locale)} />)
    const user = await currentUser()
    if (!user) return shell(<LoginCard />)
    live = { name: user.name ?? null, email: user.email ?? null }
  }
  return shell(<GuestForm target={target} live={live} />)
}

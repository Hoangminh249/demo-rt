// Đơn đặt phòng của tôi — mọi booking của khách đang đăng nhập. ?tab=upcoming|stayed|cancelled.
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { bookingApi } from '@/api/booking'
import { hotelApi } from '@/api/hotel'
import { currentUser } from '@/auth'
import type { Locale } from '@/types/global'
import { LoginCard } from '@/components/booking/live'
import { ORDER_TABS, OrdersList, type OrderTab } from '@/components/booking/orders'
import { CONTAINER } from '@/components/site/kit'

export async function generateMetadata() {
  const t = await getTranslations('Orders')
  return { title: t('title'), robots: { index: false } }
}

export default async function OrdersPage({ params, searchParams }: PageProps<'/[locale]/don-cua-toi'>) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
  const t = await getTranslations('Orders')
  const user = await currentUser()
  if (!user) return <div className={`${CONTAINER} max-w-[720px] py-16`}><LoginCard title={t('loginTitle')} body={t('loginBody')} /></div>

  const tabParam = (await searchParams).tab
  const tab: OrderTab = typeof tabParam === 'string' && tabParam in ORDER_TABS ? (tabParam as OrderTab) : 'upcoming'
  const items = await bookingApi.list(user.id)
  const slugs = [...new Set(items.map(b => b.hotel.slug))]
  const covers = Object.fromEntries(await Promise.all(slugs.map(async s => [s, (await hotelApi.get(s, locale as Locale))?.cover ?? null] as const)))
  return <OrdersList items={items} tab={tab} covers={covers} />
}

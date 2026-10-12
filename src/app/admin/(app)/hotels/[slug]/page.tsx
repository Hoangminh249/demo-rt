import { notFound } from 'next/navigation'
import { hotelApi } from '@/api/hotel'
import { catalogApi } from '@/api/catalog'
import { requireAdmin } from '@/lib/admin-actor'
import { isDbSource } from '@/lib/db'
import { HotelView } from '@/components/admin/views/hotel'

export async function generateMetadata({ params }: PageProps<'/admin/hotels/[slug]'>) {
  return { title: (await hotelApi.get((await params).slug, 'vi'))?.name ?? 'Khách sạn' }
}

export default async function AdminHotelPage({ params }: PageProps<'/admin/hotels/[slug]'>) {
  await requireAdmin()
  const { slug } = await params
  if (!(await catalogApi.contents(true)).some(h => h.slug === slug)) notFound()
  return <HotelView slug={slug} db={isDbSource()} />
}

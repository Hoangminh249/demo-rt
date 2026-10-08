import { notFound } from 'next/navigation'
import { hotelApi } from '@/api/hotel'
import { HotelView } from '@/components/admin/views/hotel'

export async function generateMetadata({ params }: PageProps<'/admin/hotels/[slug]'>) {
  return { title: hotelApi.get((await params).slug, 'vi')?.name ?? 'Khách sạn' }
}

export default async function AdminHotelPage({ params }: PageProps<'/admin/hotels/[slug]'>) {
  const { slug } = await params
  if (!hotelApi.slugs().includes(slug)) notFound()
  return <HotelView slug={slug} />
}

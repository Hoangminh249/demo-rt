import { notFound } from 'next/navigation'
import { repo } from '@/lib/repo'
import { HotelView } from '@/components/admin/views/hotel'

export async function generateMetadata({ params }: PageProps<'/admin/hotels/[slug]'>) {
  return { title: repo.getHotel((await params).slug, 'vi')?.name ?? 'Khách sạn' }
}

export default async function AdminHotelPage({ params }: PageProps<'/admin/hotels/[slug]'>) {
  const { slug } = await params
  if (!repo.hotelSlugs().includes(slug)) notFound()
  return <HotelView slug={slug} />
}

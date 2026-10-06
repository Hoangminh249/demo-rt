import { repo } from '@/lib/repo'
import { HotelPromos } from '@/components/site/room-view'

export const dynamicParams = false
export const generateStaticParams = () => repo.hotelSlugs().map(hotel => ({ hotel }))

export default async function HotelPromosPage({ params }: PageProps<'/[hotel]/uu-dai'>) {
  const { hotel } = await params
  return <HotelPromos slug={hotel} />
}

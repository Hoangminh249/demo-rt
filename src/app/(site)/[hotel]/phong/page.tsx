import { Suspense } from 'react'
import { repo } from '@/lib/repo'
import { RoomsView } from '@/components/site/room-view'

export const dynamicParams = false
export const generateStaticParams = () => repo.hotelSlugs().map(hotel => ({ hotel }))

export default async function RoomsPage({ params }: PageProps<'/[hotel]/phong'>) {
  const { hotel } = await params
  return <Suspense><RoomsView slug={hotel} /></Suspense>
}

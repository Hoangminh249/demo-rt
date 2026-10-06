import { Suspense } from 'react'
import { repo } from '@/lib/repo'
import { RoomView } from '@/components/site/room-view'

export const dynamicParams = false
export const generateStaticParams = () => repo.roomParams()

export default async function RoomPage({ params }: PageProps<'/[hotel]/phong/[room]'>) {
  const { hotel, room } = await params
  return <Suspense><RoomView slug={hotel} roomSlug={room} /></Suspense>
}

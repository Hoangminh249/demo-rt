import { Suspense } from 'react'
import { repo } from '@/lib/repo'
import { BookingFlow } from '@/components/site/booking-flow'
import { SkeletonList } from '@/components/ui'

export const dynamicParams = false
export const generateStaticParams = () => repo.hotelSlugs().map(hotel => ({ hotel }))
export const metadata = { title: 'Đặt phòng' }

export default async function BookingPage({ params }: PageProps<'/[hotel]/dat-phong'>) {
  const { hotel } = await params
  return <Suspense fallback={<div className="mx-auto max-w-5xl px-4 py-8"><SkeletonList /></div>}><BookingFlow slug={hotel} /></Suspense>
}

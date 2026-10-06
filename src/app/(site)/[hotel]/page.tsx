import { Suspense } from 'react'
import type { Metadata } from 'next'
import { repo } from '@/lib/repo'
import { HotelView } from '@/components/site/hotel-view'
import { SkeletonList } from '@/components/ui'

// Mỗi khách sạn = 1 đường dẫn rootyhospitality.com/{slug}. Slug lạ → 404.
export const dynamicParams = false
export const generateStaticParams = () => repo.hotelSlugs().map(hotel => ({ hotel }))

export async function generateMetadata({ params }: PageProps<'/[hotel]'>): Promise<Metadata> {
  const { hotel } = await params
  const h = repo.hotelsSync().find(x => x.slug === hotel)
  return { title: h?.name, description: h?.tagline }
}

export default async function HotelPage({ params }: PageProps<'/[hotel]'>) {
  const { hotel } = await params
  return <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-8"><SkeletonList /></div>}><HotelView slug={hotel} /></Suspense>
}

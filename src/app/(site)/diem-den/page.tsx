'use client'
import Link from 'next/link'
import { repo } from '@/lib/repo'
import { useAsync } from '@/store/provider'
import { PageTitle, Photo, Skeleton } from '@/components/ui'

export default function DestinationsPage() {
  const d = useAsync(() => repo.listDestinations(), [])
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageTitle title="Điểm đến" sub="Phú Quốc / Bắc đảo / Trung tâm / Nam đảo" />
      <div className="grid gap-5 md:grid-cols-2">
        {!d.data ? <Skeleton className="h-72" /> : d.data.map(x => (
          <Link key={x.slug} href={`/diem-den/${x.slug}`} className="group relative block overflow-hidden rounded-2xl">
            <Photo src={x.image} alt={x.name} className="aspect-[16/9] transition-transform group-hover:scale-105" sizes="50vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-0 p-5 text-white"><p className="text-2xl font-bold">{x.name}</p><p className="mt-1 line-clamp-2 text-sm text-white/85">{x.desc}</p></div>
          </Link>
        ))}
      </div>
    </div>
  )
}

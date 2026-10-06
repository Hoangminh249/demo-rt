'use client'
import { use } from 'react'
import { Check } from 'lucide-react'
import { repo } from '@/lib/repo'
import { useAsync } from '@/store/provider'
import { DEFAULT_SEARCH, searchToParams } from '@/lib/search-params'
import { HotelCard } from '@/components/site/cards'
import { Breadcrumb, ButtonLink, Empty, Photo, SkeletonList } from '@/components/ui'

export default function DestinationPage({ params }: PageProps<'/diem-den/[khu]'>) {
  const { khu } = use(params)
  const dests = useAsync(() => repo.listDestinations(), [])
  const res = useAsync(() => repo.search({ ...DEFAULT_SEARCH, dest: khu, sort: 'stars' }), [khu])
  const d = dests.data?.find(x => x.slug === khu)
  if (dests.data && !d) return <div className="mx-auto max-w-3xl px-4 py-10"><Empty title="Không có điểm đến này" /></div>
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumb items={[{ label: 'Trang chủ', href: '/' }, { label: 'Điểm đến', href: '/diem-den' }, { label: d?.name ?? '…' }]} />
      {d && (
        <div className="grid gap-6 md:grid-cols-2">
          <Photo src={d.image} alt={d.name} className="aspect-[16/10] rounded-2xl" sizes="50vw" priority />
          <div>
            <h1 className="text-3xl font-bold">{d.name}</h1>
            <p className="mt-3 text-muted-foreground">{d.desc}</p>
            <ul className="mt-4 space-y-2">{d.highlights.map(h => <li key={h} className="flex items-center gap-2"><Check className="size-4 text-ok" />{h}</li>)}</ul>
            <ButtonLink href={`/tim-kiem?${searchToParams({ ...DEFAULT_SEARCH, dest: khu })}`} className="mt-5">Tìm phòng tại {d.name}</ButtonLink>
          </div>
        </div>
      )}
      <h2 className="mb-4 mt-10 text-xl font-bold">Khách sạn tại {d?.name}</h2>
      {!res.data ? <SkeletonList /> : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{res.data.map(r => <HotelCard key={r.hotel.id} hotel={r.hotel} fromPrice={r.fromPrice} />)}</div>
      )}
    </div>
  )
}

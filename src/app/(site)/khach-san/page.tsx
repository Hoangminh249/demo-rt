'use client'
import { repo } from '@/lib/repo'
import { useAsync } from '@/store/provider'
import { DEFAULT_SEARCH, searchToParams } from '@/lib/search-params'
import { AREA_LABEL } from '@/lib/labels'
import type { Area } from '@/lib/types'
import { HotelCard } from '@/components/site/cards'
import { PageTitle, Skeleton } from '@/components/ui'

export default function HotelsPage() {
  const res = useAsync(() => repo.search({ ...DEFAULT_SEARCH, dest: '', sort: 'stars' }), [])
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageTitle title="Khách sạn & Resort" sub="Mỗi khách sạn một trang riêng trên rootyhospitality.com — cùng một hệ thống đặt phòng. Giá tham khảo cho 12–15/10/2026." />
      {(['nam-dao', 'trung-tam', 'bac-dao'] as Area[]).map(area => (
        <section key={area} className="mb-10">
          <h2 className="mb-4 text-lg font-bold">{AREA_LABEL[area]}</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {!res.data ? <Skeleton className="h-80" /> : res.data.filter(r => r.hotel.area === area).map(r => (
              <HotelCard key={r.hotel.id} hotel={r.hotel} fromPrice={r.fromPrice} href={`/${r.hotel.slug}?${searchToParams({ ...DEFAULT_SEARCH })}`}>
                <p className="text-xs text-muted">rootyhospitality.com/{r.hotel.slug}</p>
              </HotelCard>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

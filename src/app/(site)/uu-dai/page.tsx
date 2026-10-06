'use client'
import { repo } from '@/lib/repo'
import { useAsync } from '@/store/provider'
import { PromoCard } from '@/components/site/cards'
import { PageTitle, Skeleton } from '@/components/ui'

export default function OffersPage() {
  const p = useAsync(() => repo.listPromotions(), [])
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageTitle title="Ưu đãi" sub="Early Bird / Stay Longer / Family / Honeymoon / Package — tự áp dụng khi đủ điều kiện, không cộng dồn" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {!p.data ? Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-72" />) : p.data.map(x => <PromoCard key={x.id} promo={x} />)}
      </div>
    </div>
  )
}

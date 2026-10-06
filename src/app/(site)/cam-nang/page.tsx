'use client'
import { repo } from '@/lib/repo'
import { useAsync } from '@/store/provider'
import { ArticleCard } from '@/components/site/cards'
import { PageTitle, Skeleton } from '@/components/ui'

export default function GuidePage() {
  const a = useAsync(() => repo.listArticles(), [])
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageTitle title="Cẩm nang Phú Quốc" sub="Kinh nghiệm, lịch trình, ẩm thực — viết bởi đội Rooty" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{!a.data ? <Skeleton className="h-64" /> : a.data.map(x => <ArticleCard key={x.slug} a={x} />)}</div>
    </div>
  )
}

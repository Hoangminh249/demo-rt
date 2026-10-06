'use client'
import Link from 'next/link'
import { repo } from '@/lib/repo'
import { useAsync } from '@/store/provider'
import { PageTitle, Photo, Skeleton } from '@/components/ui'

export default function ExperiencesPage() {
  const e = useAsync(() => repo.listExperiences(), [])
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageTitle title="Trải nghiệm" sub="Ẩm thực / Spa / Hồ bơi / Hoạt động / Tour / Transfer / RIVUS — đặt cùng phòng ở bước Dịch vụ thêm" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {!e.data ? <Skeleton className="h-64" /> : e.data.map(x => (
          <Link key={x.slug} href={`/trai-nghiem/${x.slug}`} className="group overflow-hidden rounded-xl border border-border bg-card">
            <Photo src={x.image} alt={x.name} className="aspect-[16/10]" sizes="33vw" />
            <div className="p-4"><p className="text-lg font-semibold group-hover:text-primary">{x.name}</p><p className="mt-1 text-sm text-muted-foreground">{x.desc}</p></div>
          </Link>
        ))}
      </div>
    </div>
  )
}

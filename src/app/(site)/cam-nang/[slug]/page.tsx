'use client'
import { use } from 'react'
import { repo } from '@/lib/repo'
import { useAsync } from '@/store/provider'
import { fmtDate } from '@/lib/format'
import { Breadcrumb, ButtonLink, Empty, Photo, SkeletonList } from '@/components/ui'

export default function ArticlePage({ params }: PageProps<'/cam-nang/[slug]'>) {
  const { slug } = use(params)
  const a = useAsync(() => repo.getArticle(slug), [slug])
  if (a.loading && !a.data) return <div className="mx-auto max-w-3xl px-4 py-8"><SkeletonList /></div>
  if (!a.data || !a.data.published) return <div className="mx-auto max-w-3xl px-4 py-10"><Empty title="Bài viết không tồn tại hoặc đã ẩn" /></div>
  const x = a.data
  return (
    <article className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumb items={[{ label: 'Trang chủ', href: '/' }, { label: 'Cẩm nang', href: '/cam-nang' }, { label: x.title }]} />
      <p className="text-sm text-muted">{x.category} · {fmtDate(x.date)} · {x.read_min} phút đọc</p>
      <h1 className="mt-2 text-3xl font-bold">{x.title}</h1>
      <Photo src={x.image} alt={x.title} className="mt-6 aspect-[16/9] rounded-2xl" sizes="768px" priority />
      <div className="mt-6 space-y-4 text-lg leading-relaxed">{x.body.map((p, i) => <p key={i}>{p}</p>)}</div>
      <div className="mt-10 rounded-2xl bg-mint p-6">
        <p className="font-semibold text-brand dark:text-accent">Sẵn sàng đi Phú Quốc?</p>
        <ButtonLink href="/tim-kiem" className="mt-3">Tìm phòng</ButtonLink>
      </div>
    </article>
  )
}

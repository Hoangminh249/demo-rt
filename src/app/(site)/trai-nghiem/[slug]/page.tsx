'use client'
import { use } from 'react'
import { repo } from '@/lib/repo'
import { useAsync } from '@/store/provider'
import { fmtVND } from '@/lib/format'
import { Badge, Breadcrumb, ButtonLink, Card, Empty, Photo, SkeletonList } from '@/components/ui'

export default function ExperiencePage({ params }: PageProps<'/trai-nghiem/[slug]'>) {
  const { slug } = use(params)
  const e = useAsync(() => repo.getExperience(slug), [slug])
  if (e.loading && !e.data) return <div className="mx-auto max-w-5xl px-4 py-8"><SkeletonList /></div>
  if (!e.data) return <div className="mx-auto max-w-3xl px-4 py-10"><Empty title="Không có trải nghiệm này" /></div>
  const x = e.data
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Breadcrumb items={[{ label: 'Trang chủ', href: '/' }, { label: 'Trải nghiệm', href: '/trai-nghiem' }, { label: x.name }]} />
      <Photo src={x.image} alt={x.name} className="aspect-[21/9] rounded-2xl" sizes="100vw" priority />
      <h1 className="mt-6 text-3xl font-bold">{x.name}</h1>
      <p className="mt-2 text-muted-foreground">{x.desc}</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">{x.items.map(i => <Card key={i.name} className="p-4"><p className="font-semibold">{i.name}</p><p className="text-sm text-muted-foreground">{i.desc}</p></Card>)}</div>
      {x.addons.length > 0 && (
        <>
          <h2 className="mb-3 mt-10 text-xl font-bold">Đặt kèm khi đặt phòng</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {x.addons.map(a => (
              <Card key={a.id} className="flex gap-4 p-4">
                <Photo src={a.image} alt={a.name} className="size-24 shrink-0 rounded-lg" sizes="96px" />
                <div className="min-w-0">
                  <Badge tone={a.provider === 'RIVUS' ? 'info' : 'brand'}>{a.provider}</Badge>
                  <p className="mt-1 font-semibold">{a.name}</p>
                  <p className="text-sm text-muted-foreground">{a.desc}</p>
                  <p className="mt-1 text-sm font-semibold">{fmtVND(a.price)} <span className="font-normal text-muted-foreground">/ {a.unit === 'person' ? 'người lớn' : a.category === 'transfer' ? 'chiều' : 'chuyến'}</span></p>
                </div>
              </Card>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Dịch vụ của Rooty Trip / RIVUS được thêm ở bước <b>Dịch vụ thêm</b> trong luồng đặt phòng — khách không cần rời Rooty Hospitality.</p>
          <ButtonLink href="/tim-kiem" className="mt-3">Tìm phòng & thêm dịch vụ</ButtonLink>
        </>
      )}
    </div>
  )
}

'use client'
import { use } from 'react'
import { Check } from 'lucide-react'
import { repo } from '@/lib/repo'
import { useAsync } from '@/store/provider'
import { DEFAULT_SEARCH, searchToParams } from '@/lib/search-params'
import { addDays, fmtDate, TODAY } from '@/lib/format'
import { Badge, Breadcrumb, ButtonLink, Card, Empty, Photo, SkeletonList } from '@/components/ui'

export default function OfferPage({ params }: PageProps<'/uu-dai/[slug]'>) {
  const { slug } = use(params)
  const p = useAsync(() => repo.getPromotion(slug), [slug])
  const hotels = repo.hotelsSync()
  if (p.loading && !p.data) return <div className="mx-auto max-w-5xl px-4 py-8"><SkeletonList /></div>
  if (!p.data) return <div className="mx-auto max-w-3xl px-4 py-10"><Empty title="Ưu đãi không tồn tại hoặc đã hết hạn" /></div>
  const x = p.data
  const applies = x.hotel_ids === 'all' ? hotels : hotels.filter(h => (x.hotel_ids as string[]).includes(h.id))
  // Ngày gợi ý thoả điều kiện ưu đãi để demo "áp dụng vào tìm kiếm"
  const checkin = x.min_advance_days ? addDays(TODAY, x.min_advance_days + 3) : DEFAULT_SEARCH.checkin
  const nights = Math.max(x.min_nights ?? 3, 3)
  const s = { ...DEFAULT_SEARCH, checkin, checkout: addDays(checkin, nights), children: x.min_children ?? (x.type === 'honeymoon' ? 0 : DEFAULT_SEARCH.children), ages: x.type === 'honeymoon' ? [] : [6], promo: x.slug }
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Breadcrumb items={[{ label: 'Trang chủ', href: '/' }, { label: 'Ưu đãi', href: '/uu-dai' }, { label: x.name }]} />
      <Photo src={x.image} alt={x.name} className="aspect-[21/9] rounded-2xl" sizes="100vw" priority />
      <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1fr)_300px]">
        <div>
          <Badge tone="brand">−{x.discount_pct}%</Badge>
          <h1 className="mt-2 text-3xl font-bold">{x.name}</h1>
          <p className="mt-3 text-muted">{x.description}</p>
          <ul className="mt-4 space-y-2">{x.perks.map(k => <li key={k} className="flex items-center gap-2"><Check className="size-4 text-ok" />{k}</li>)}</ul>
          <h2 className="mt-6 font-semibold">Điều kiện</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
            {x.min_advance_days && <li>Đặt trước ít nhất {x.min_advance_days} ngày</li>}
            {x.min_nights && <li>Ở tối thiểu {x.min_nights} đêm</li>}
            {x.min_children && <li>Có ít nhất {x.min_children} trẻ em</li>}
            {x.needs_code && <li>Chọn ưu đãi khi đặt phòng (bước Dịch vụ thêm)</li>}
            {x.needs_addons && <li>Thêm xe sân bay và ít nhất 1 tour Rooty Trip</li>}
            <li>Nhận phòng từ {fmtDate(x.valid_from)} đến {fmtDate(x.valid_to)} · không cộng dồn ưu đãi khác</li>
          </ul>
        </div>
        <Card className="h-fit space-y-3 p-4">
          <p className="text-sm font-semibold">Áp dụng tại</p>
          <ul className="space-y-1 text-sm">{applies.map(h => <li key={h.id}>• {h.name}</li>)}</ul>
          <ButtonLink href={`/tim-kiem?${searchToParams(s)}`} className="w-full">Áp dụng vào tìm kiếm</ButtonLink>
        </Card>
      </div>
    </div>
  )
}

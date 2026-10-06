'use client'
import Link from 'next/link'
import { X, Scale } from 'lucide-react'
import { repo } from '@/lib/repo'
import { useAsync } from '@/store/provider'
import { DEFAULT_SEARCH, bookingHref } from '@/lib/search-params'
import { AREA_LABEL, TAG_LABEL } from '@/lib/labels'
import { fmtRange, fmtVND } from '@/lib/format'
import { useCompare } from '@/components/site/cards'
import { ButtonLink, Empty, PageTitle, Photo, SkeletonList, Stars } from '@/components/ui'

export default function ComparePage() {
  const { ids, toggle } = useCompare()
  const s = { ...DEFAULT_SEARCH }
  const rooms = useAsync(() => repo.getRoomsByIds(ids), [ids])
  const offers = useAsync(async () => {
    const hotelIds = [...new Set((rooms.data ?? []).map(r => r.hotel.id))]
    const lists = await Promise.all(hotelIds.map(id => repo.hotelOffers(id, s)))
    return lists.flat()
  }, [rooms.data?.map(r => r.rt.room_type_id)])
  if (!ids.length) return <div className="mx-auto max-w-3xl px-4 py-10"><Empty icon={<Scale className="size-10" />} title="Chưa có phòng để so sánh">Bấm “So sánh” trên thẻ phòng ở trang tìm kiếm hoặc trang khách sạn (tối đa 3).<div className="mt-3"><ButtonLink href="/tim-kiem">Tìm phòng</ButtonLink></div></Empty></div>
  if (!rooms.data) return <div className="mx-auto max-w-6xl px-4 py-8"><SkeletonList /></div>
  type Row = NonNullable<typeof rooms.data>[number]
  const rows: [string, (r: Row) => React.ReactNode][] = [
    ['Khách sạn', r => <><Link href={`/${r.hotel.slug}`} className="font-semibold hover:text-primary">{r.hotel.name}</Link><div><Stars n={r.hotel.stars} /></div></>],
    ['Khu vực', r => AREA_LABEL[r.hotel.area]],
    ['Diện tích', r => `${r.rt.size_m2} m²`],
    ['Giường', r => r.rt.beds],
    ['Sức chứa', r => `${r.rt.max_adults} người lớn + ${r.rt.max_children} trẻ em`],
    ['Hướng', r => r.rt.view],
    ['Tiện ích KS', r => r.hotel.tags.map(t => TAG_LABEL[t]).join(' · ')],
    ['Tiện nghi phòng', r => r.rt.amenities.join(', ')],
    [`Giá/đêm (${fmtRange(s.checkin, s.checkout)})`, r => { const o = offers.data?.find(x => x.rt.room_type_id === r.rt.room_type_id); return o ? o.plans.map(p => <div key={p.plan.rate_plan_id}>{p.plan.has_breakfast ? 'Ăn sáng' : 'Room only'}: <b>{fmtVND(p.nightly)}</b></div>) : '…' }],
    ['Còn phòng', r => offers.data?.find(x => x.rt.room_type_id === r.rt.room_type_id)?.left ?? '…'],
  ]
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageTitle title="So sánh phòng" sub={`Tối đa 3 phòng · đang so sánh ${ids.length}`} />
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr>
              <th className="w-40" />
              {rooms.data.map(r => (
                <th key={r.rt.room_type_id} className="p-3 text-left align-top">
                  <div className="relative">
                    <Photo src={r.rt.image} alt={r.rt.name} className="aspect-[4/3] rounded-lg" sizes="300px" />
                    <button type="button" onClick={() => toggle(r.rt.room_type_id, r.rt.name)} aria-label={`Bỏ ${r.rt.name}`} className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white"><X className="size-4" /></button>
                  </div>
                  <p className="mt-2 text-base font-semibold">{r.rt.name}</p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, fn]) => (
              <tr key={label} className="border-t border-border">
                <th className="p-3 text-left text-xs font-semibold uppercase text-muted">{label}</th>
                {rooms.data!.map(r => <td key={r.rt.room_type_id} className="p-3 align-top">{fn(r)}</td>)}
              </tr>
            ))}
            <tr className="border-t border-border">
              <th />
              {rooms.data.map(r => <td key={r.rt.room_type_id} className="p-3"><ButtonLink href={bookingHref(r.hotel.slug, s, r.rt.room_type_id, r.plans.find(p => p.has_breakfast)?.rate_plan_id)} className="w-full">Đặt phòng</ButtonLink></td>)}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

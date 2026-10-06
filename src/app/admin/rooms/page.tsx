'use client'
import Link from 'next/link'
import { repo } from '@/lib/repo'
import { useAsync } from '@/store/provider'
import { useAdmin } from '@/components/admin/use-admin'
import { fmtVND } from '@/lib/format'
import { Badge, Card, PageTitle, Photo, SkeletonList } from '@/components/ui'

export default function RoomsAdmin() {
  const a = useAdmin()
  const rooms = useAsync(() => repo.listRoomTypes(a.hotelId), [a.hotelId])
  if (!rooms.data) return <SkeletonList />
  const hotels = repo.hotelsSync()
  return (
    <>
      <PageTitle title="Rooms — hạng phòng" sub={`${rooms.data.length} hạng · ${rooms.data.reduce((s, r) => s + r.quantity, 0)} phòng`} />
      {hotels.filter(h => rooms.data!.some(r => r.hotel_id === h.id)).map(h => (
        <section key={h.id} className="mb-8">
          <h2 className="mb-3 font-semibold">{h.name}</h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {rooms.data!.filter(r => r.hotel_id === h.id).map(r => (
              <Card key={r.room_type_id} className="flex gap-3 p-3">
                <Photo src={r.image} alt={r.name} className="size-24 shrink-0 rounded-lg" sizes="96px" />
                <div className="min-w-0 text-sm">
                  <Link href={`/${h.slug}/phong/${r.slug}`} target="_blank" className="font-semibold hover:text-primary">{r.name}</Link>
                  <p className="text-muted">{r.quantity} phòng · {r.size_m2} m² · {r.max_adults} NL + {r.max_children} TE</p>
                  <p className="text-muted">{r.beds} · {r.view}</p>
                  <p className="mt-1">Giá gốc {fmtVND(r.base_price)} · niêm yết ĐL {fmtVND(r.public_rate)}</p>
                  <Badge className="mt-1 font-mono">{r.room_type_id}</Badge>
                </div>
              </Card>
            ))}
          </div>
        </section>
      ))}
      <p className="text-xs text-muted">Ngoài đời: số phòng, sức chứa, rate plan ở Gohost (API chỉ đọc). CMS Rooty chỉ bổ sung ảnh, mô tả, tiện nghi theo room_type_id.</p>
    </>
  )
}

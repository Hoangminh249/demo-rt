'use client'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { repo } from '@/lib/repo'
import { useAsync } from '@/store/provider'
import { useAdmin } from '@/components/admin/use-admin'
import { AREA_LABEL } from '@/lib/labels'
import { Badge, PageTitle, SkeletonList, Stars, Table } from '@/components/ui'

export default function HotelsAdmin() {
  const a = useAdmin()
  const hotels = useAsync(() => repo.listHotels(), [])
  const rooms = useAsync(() => repo.listRoomTypes(), [])
  if (!hotels.data || !rooms.data) return <SkeletonList />
  const list = hotels.data.filter(h => !a.locked || h.id === a.locked)
  return (
    <>
      <PageTitle title="Hotels" sub="Thêm khách sạn = thêm 1 trang trên rootyhospitality.com, không làm web mới" />
      <Table>
        <thead><tr><th>Khách sạn</th><th>Khu vực</th><th>Hạng</th><th className="text-right">Hạng phòng</th><th className="text-right">Tổng phòng</th><th>Đường dẫn</th><th>Gohost tenant_id</th><th /></tr></thead>
        <tbody>
          {list.map(h => {
            const rts = rooms.data!.filter(r => r.hotel_id === h.id)
            return (
              <tr key={h.id}>
                <td className="font-medium">{h.name}</td>
                <td>{AREA_LABEL[h.area]}</td>
                <td><Stars n={h.stars} /></td>
                <td className="text-right">{rts.length}</td>
                <td className="text-right">{rts.reduce((s, r) => s + r.quantity, 0)}</td>
                <td><Link href={`/${h.slug}`} target="_blank" className="inline-flex items-center gap-1 text-primary hover:underline">/{h.slug}<ExternalLink className="size-3" /></Link></td>
                <td><Badge>{h.tenant_id}</Badge></td>
                <td><Link href={`/admin/hotels/${h.id}`} className="text-sm font-medium text-primary hover:underline">{a.can('hotels', 'full') ? 'Sửa' : 'Xem'}</Link></td>
              </tr>
            )
          })}
        </tbody>
      </Table>
      <p className="mt-3 text-xs text-muted-foreground">Ngoài đời: property & phòng quản lý trong Gohost; nội dung trang (ảnh, mô tả, chính sách) do CMS Rooty giữ, ánh xạ hotel_code ↔ tenant_id ↔ slug.</p>
    </>
  )
}

// Chi tiết booking (chỉ xem, bố cục "trang chi tiết bản ghi"): đầu trang mã + trạng thái + ngày; cột chính là các phòng
// (bản ghi con), cột phải Lưu trú · Khách đặt · Ghi chú. SĐT, email đã che; không có CCCD, ảnh giấy tờ, ngày sinh
// (gohost.ts không đọc các field đó). Sửa, huỷ booking làm trong Gohost.
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { AdminShell } from '@/components/admin/shell'
import { BookingStatus } from '@/components/admin/booking-status'
import { Badge, CARD, Dl, Empty, GohostError, Skel, vnd } from '@/components/admin/ui'
import { diffDays, fmtRange } from '@/lib/format'
import { bookingDetail, connectedHotels } from '@/lib/repo/admin'

export const metadata = { title: 'Chi tiết booking' }

const COLLECT: Record<string, string> = { property: 'Khách sạn thu', ota: 'OTA đã thu', online: 'Thanh toán online' }
const dash = <span className="text-muted-foreground">—</span>
const occupancy = (r: { adults: number; children: number; infants: number }) =>
  [r.adults && `${r.adults} người lớn`, r.children && `${r.children} trẻ em`, r.infants && `${r.infants} em bé`].filter(Boolean).join(' · ')

async function Body({ code, tenant, hotelName }: { code: string; tenant: string; hotelName: string }) {
  const { data: b, error } = await bookingDetail(tenant, code)
  if (error || !b) {
    const err = error ?? 'UPSTREAM'
    return (
      <>
        <h1 className="font-mono text-lg font-semibold">{code}</h1>
        {/* Gohost chưa khai mã lỗi cho booking không tồn tại → mã sai cũng thành UPSTREAM */}
        <div className="mt-4"><GohostError code={err} note={err === 'UPSTREAM' ? 'Mã booking sai cũng ra lỗi này.' : undefined} /></div>
      </>
    )
  }
  return (
    <>
      <h1 className="font-mono text-lg font-semibold">{b.code}</h1>
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        <BookingStatus status={b.status} />
        <span className="text-sm text-muted-foreground">
          {hotelName}{b.checkin && b.checkout ? ` · ${fmtRange(b.checkin, b.checkout)} · ${diffDays(b.checkin, b.checkout)} đêm` : ''}
        </span>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-4 @[70rem]:grid-cols-[minmax(0,1fr)_22rem]">
        <section className={`${CARD} self-start`}>
          <h2 className="px-5 pt-5 text-base font-semibold">Phòng <span className="font-normal text-muted-foreground tabular-nums">{b.room_list.length}</span></h2>
          {b.room_list.length ? (
            <ul className="mt-3 divide-y divide-border border-t border-border">
              {b.room_list.map((r, i) => (
                <li key={i} className="px-5 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium">{r.room_type}{r.unit && <span className="font-normal text-muted-foreground"> · phòng {r.unit}</span>}</p>
                    {r.breakfast && <Badge tone="neutral">Có ăn sáng</Badge>}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{occupancy(r) || 'Chưa ghi số khách'}</p>
                  {r.guests.length > 0 && (
                    <ul className="mt-2 grid gap-1 text-sm">
                      {r.guests.map((g, j) => <li key={j}>{g.name}{g.primary && <span className="text-muted-foreground"> · khách chính</span>}</li>)}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          ) : <Empty>Gohost không trả danh sách phòng của booking này.</Empty>}
        </section>
        <div className="grid content-start gap-4">
          <section className={`${CARD} p-5`}>
            <h2 className="text-base font-semibold">Lưu trú</h2>
            <div className="mt-3">
              <Dl rows={[
                ['Giờ đến', b.arrival_hour ?? dash],
                ['Giờ đi', b.departure_hour ?? dash],
                ['Nguồn', b.source ?? dash],
                ['Mã OTA', b.ota_code ? <span className="font-mono">{b.ota_code}</span> : dash],
                ['Thu tiền', b.payment_collect ? (COLLECT[b.payment_collect] ?? b.payment_collect) : dash],
                ['Thanh toán đã ghi', `${b.payments} lần`],
                ['Tổng tiền', b.amount != null ? vnd(b.amount) : dash],
              ]} />
            </div>
          </section>
          <section className={`${CARD} p-5`}>
            <h2 className="text-base font-semibold">Khách đặt</h2>
            <div className="mt-3"><Dl rows={[['Tên', b.customer ?? dash], ['Điện thoại', b.phone ?? dash], ['Email', b.email ?? dash]]} /></div>
            <p className="mt-3 text-xs text-pretty text-muted-foreground">Điện thoại, email đã che bớt. Admin không hiện giấy tờ tuỳ thân.</p>
          </section>
          {b.notes && (
            <section className={`${CARD} p-5`}>
              <h2 className="text-base font-semibold">Ghi chú</h2>
              <p className="mt-2 text-sm whitespace-pre-line text-pretty">{b.notes}</p>
            </section>
          )}
        </div>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Chỉ xem. Sửa, huỷ booking làm trong Gohost.</p>
    </>
  )
}

function Loading() {
  return (
    <div aria-busy>
      <Skel className="h-7 w-40" /><Skel className="mt-2 h-6 w-80 max-w-full" />
      <div className="mt-5 grid grid-cols-1 gap-4 @[70rem]:grid-cols-[minmax(0,1fr)_22rem]">
        <div className={`${CARD} grid gap-3 p-5`}>{[0, 1, 2].map(i => <Skel key={i} className="h-12" />)}</div>
        <div className={`${CARD} grid gap-2 p-5`}>{[0, 1, 2, 3, 4].map(i => <Skel key={i} className="h-4" />)}</div>
      </div>
    </div>
  )
}

export default async function AdminBookingPage({ params, searchParams }: PageProps<'/admin/bookings/[code]'>) {
  const [{ code }, { hotel: slug }] = await Promise.all([params, searchParams])
  const hotel = connectedHotels().find(h => h.slug === slug)
  if (!hotel) notFound()
  return (
    <AdminShell active="bookings" parent={{ label: 'Booking', href: `/admin/bookings?hotel=${hotel.slug}` }}>
      <div className="@container max-w-[1200px]">
        <Suspense fallback={<Loading />}><Body code={code} tenant={hotel.tenant} hotelName={hotel.name} /></Suspense>
      </div>
    </AdminShell>
  )
}

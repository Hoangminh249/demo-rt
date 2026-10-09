'use client'
// Chi tiết booking (chỉ xem, bố cục "trang chi tiết bản ghi"): đầu trang mã + trạng thái + ngày; cột chính là các phòng
// (bản ghi con), cột phải Lưu trú · Khách đặt · Ghi chú. SĐT, email đã che; không có CCCD, ảnh giấy tờ, ngày sinh
// (gohost.ts không đọc các field đó). Sửa, huỷ booking làm trong Gohost.
import { useSearchParams } from 'next/navigation'
import { BookingStatus, collectLabel, paymentLabel } from '@/components/admin/booking-status'
import { Badge, CARD, Dl, Empty, GohostError, LoadFailed, NotFound, Skel, vnd } from '@/components/admin/ui'
import { diffDays, fmtRange } from '@/lib/format'
import { useAdminBooking } from '@/hooks/use-admin'

const dash = <span className="text-muted-foreground">—</span>
const occupancy = (r: { adults: number; children: number; infants: number }) =>
  [r.adults && `${r.adults} người lớn`, r.children && `${r.children} trẻ em`, r.infants && `${r.infants} em bé`].filter(Boolean).join(' · ')
const bookedAt = (iso: string | null) => (iso ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(iso)) : null)

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

const missing = <NotFound title="Không tìm thấy booking" desc="Mã booking sai, hoặc booking thuộc property Gohost khác." href="/admin/bookings" label="Về danh sách booking" />

export function BookingView({ code }: { code: string }) {
  const property = useSearchParams().get('property')
  const { data, isPending, isError, refetch } = useAdminBooking(property, code)
  if (!property || data?.error === 'NOT_FOUND') return missing
  if (isPending) return <div className="@container max-w-site"><Loading /></div>
  if (isError || !data) return <div className="max-w-site"><h1 className="font-mono text-lg font-semibold">{code}</h1><div className="mt-4"><LoadFailed onRetry={() => refetch()} /></div></div>
  const b = data.data
  if (data.error || !b) return <div className="max-w-site"><h1 className="font-mono text-lg font-semibold">{code}</h1><div className="mt-4"><GohostError code={data.error ?? 'UPSTREAM'} /></div></div>

  return (
    <div className="@container max-w-site">
      <h1 className="font-mono text-lg font-semibold">{b.code}</h1>
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        <BookingStatus status={b.status} />
        <span className="text-sm text-muted-foreground">{b.checkin && b.checkout ? `${fmtRange(b.checkin, b.checkout)} · ${diffDays(b.checkin, b.checkout)} đêm` : ''}</span>
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
                  <p className="mt-0.5 text-xs text-muted-foreground">{[occupancy(r) || 'Chưa ghi số khách', r.nights ? `${r.nights} đêm` : ''].filter(Boolean).join(' · ')}</p>
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
                ['Đặt lúc', bookedAt(b.booked_at) ?? dash],
                ['Giờ đến', b.arrival_hour ?? dash],
                ['Giờ đi', b.departure_hour ?? dash],
                ['Nguồn', b.source ? <span className="capitalize">{b.source}</span> : dash],
                ['Mã OTA', b.ota_code ? <span className="font-mono">{b.ota_code}</span> : dash],
                ['Thu tiền', collectLabel(b.payment_collect) ?? dash],
                ['Thanh toán', paymentLabel(b.payment_status) ?? dash],
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
    </div>
  )
}

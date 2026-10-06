'use client'
import Link from 'next/link'
import { use } from 'react'
import { CheckCircle2, CalendarPlus, FileDown, LayoutDashboard } from 'lucide-react'
import { repo } from '@/lib/repo'
import { useAsync } from '@/store/provider'
import { BookingSummary, downloadIcs } from '@/components/site/booking-detail'
import { Button, ButtonLink, Empty, SkeletonList } from '@/components/ui'

export default function ConfirmPage({ params }: PageProps<'/dat-phong/xac-nhan/[code]'>) {
  const { code } = use(params)
  const b = useAsync(() => repo.getBooking(code), [code])
  if (b.loading && !b.data) return <div className="mx-auto max-w-3xl px-4 py-10"><SkeletonList /></div>
  if (!b.data) return <div className="mx-auto max-w-3xl px-4 py-10"><Empty title="Không tìm thấy booking">Có thể dữ liệu demo vừa được reset.</Empty></div>
  const bk = b.data
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 text-center">
        <CheckCircle2 className="mx-auto size-14 text-ok" />
        <h1 className="mt-3 text-2xl font-bold">{bk.status === 'new' ? 'Đã nhận yêu cầu đặt phòng' : 'Đặt phòng thành công!'}</h1>
        <p className="mt-1 text-muted">Xác nhận đã gửi tới {bk.guest.email} (giả lập). {bk.status === 'new' && 'Booking sẽ được xác nhận khi nhận được thanh toán.'}</p>
      </div>
      <BookingSummary b={bk} />
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <ButtonLink href={`/voucher/${bk.code}`} target="_blank"><FileDown className="size-4" /> Tải voucher</ButtonLink>
        <Button variant="secondary" onClick={() => downloadIcs(bk)}><CalendarPlus className="size-4" /> Thêm vào lịch</Button>
        <ButtonLink variant="secondary" href={`/my-booking?code=${bk.code}`}>Quản lý booking</ButtonLink>
      </div>
      <p className="mt-8 rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted">
        <LayoutDashboard className="mr-1 inline size-4" /> Demo liên thông: booking này đã vào <Link className="font-medium text-primary underline" href={`/admin/bookings/${bk.code}`}>Admin › Bookings</Link> với nguồn <b>Website</b>, và tồn phòng đã giảm ở <Link className="font-medium text-primary underline" href="/admin/inventory">Inventory</Link>.
      </p>
    </div>
  )
}

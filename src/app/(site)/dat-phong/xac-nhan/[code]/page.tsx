'use client'
import Link from 'next/link'
import { use } from 'react'
import { CheckCircle2, CalendarPlus, FileDown, Clock } from 'lucide-react'
import { repo } from '@/lib/repo'
import { useAsync } from '@/store/provider'
import { fmtRange } from '@/lib/format'
import { BookingSummary, downloadIcs } from '@/components/site/booking-detail'
import { Button, buttonVariants } from '@/components/ui/button'
import { Empty, Skeleton, cn } from '@/components/ui'

export default function ConfirmPage({ params }: PageProps<'/dat-phong/xac-nhan/[code]'>) {
  const { code } = use(params)
  const b = useAsync(() => repo.getBooking(code), [code])
  if (b.loading && !b.data) return <div className="mx-auto max-w-3xl space-y-4 px-4 py-10"><Skeleton className="mx-auto size-14 rounded-full" /><Skeleton className="h-96" /></div>
  if (!b.data) return <div className="mx-auto max-w-3xl px-4 py-10"><Empty title="Không tìm thấy booking">Có thể dữ liệu demo vừa được reset.</Empty></div>
  const bk = b.data
  const pending = bk.status === 'new'
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-8 text-center">
        {pending ? <Clock className="mx-auto size-14 text-warn" aria-hidden /> : <CheckCircle2 className="mx-auto size-14 text-ok" aria-hidden />}
        <h1 className="mt-3 text-2xl font-semibold">{pending ? 'Đã giữ phòng, chờ thanh toán' : 'Đặt phòng thành công'}</h1>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">{bk.hotel.name} · {fmtRange(bk.checkin_date, bk.checkout_date)}. Xác nhận đã gửi tới {bk.guest.email} (giả lập).{pending && ' Booking được xác nhận khi kế toán nhận tiền.'}</p>
      </div>
      <BookingSummary b={bk} />
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link href={`/voucher/${bk.code}`} target="_blank" className={buttonVariants({ variant: 'default' })}><FileDown aria-hidden />Tải voucher</Link>
        <Button variant="outline" onClick={() => downloadIcs(bk)}><CalendarPlus aria-hidden />Thêm vào lịch</Button>
        <Link href={`/my-booking?code=${bk.code}`} className={buttonVariants({ variant: 'outline' })}>Quản lý booking</Link>
      </div>
      <p className={cn('mt-8 rounded-2xl border border-border bg-card px-4 py-3 text-center text-sm text-muted-foreground')}>
        Demo liên thông: booking đã vào <Link className="font-medium text-foreground underline-offset-4 hover:underline" href={`/admin/bookings/${bk.code}`}>Admin › Bookings</Link> với nguồn Website, tồn phòng đã giảm ở <Link className="font-medium text-foreground underline-offset-4 hover:underline" href="/admin/inventory">Inventory</Link>.
      </p>
    </div>
  )
}

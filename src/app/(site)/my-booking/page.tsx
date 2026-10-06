'use client'
import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, FileDown, CalendarClock, XCircle } from 'lucide-react'
import { repo, type BookingView } from '@/lib/repo'
import { useDemo } from '@/store/provider'
import { BookingSummary, canFreeCancel } from '@/components/site/booking-detail'
import { Button, ButtonLink, Card, ErrorBox, Field, Input, PageTitle } from '@/components/ui'
import { ConfirmDialog, Dialog, toast } from '@/components/ui/overlay'
import { fmtVND } from '@/lib/format'

function MyBooking() {
  const sp = useSearchParams()
  const { overlay } = useDemo()
  const last = [...overlay.bookings].reverse().find(b => b.channel === 'website')
  const [code, setCode] = useState(sp.get('code') ?? '')
  const [contact, setContact] = useState('')
  const [b, setB] = useState<BookingView | null>(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [cancel, setCancel] = useState(false)
  const [change, setChange] = useState(false)

  async function lookup(e?: React.FormEvent, c = code, ct = contact) {
    e?.preventDefault()
    setBusy(true)
    setErr('')
    const r = await repo.findBooking(c, ct)
    setBusy(false)
    if (r) setB(r)
    else { setB(null); setErr('Không tìm thấy booking khớp mã và email/SĐT.') }
  }
  async function doCancel() {
    if (!b) return
    await repo.setBookingStatus(b.code, 'cancelled', 'Khách (My Booking)', canFreeCancel(b) ? 'Huỷ miễn phí theo chính sách' : 'Huỷ — không hoàn tiền')
    setCancel(false)
    toast('Đã huỷ booking')
    lookup(undefined, b.code, b.guest.email)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <PageTitle title="My Booking" sub="Tra cứu, tải voucher, đổi hoặc huỷ booking" />
      <Card className="p-5">
        <form onSubmit={lookup} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Field label="Mã booking"><Input value={code} onChange={e => setCode(e.target.value)} placeholder="RH800001" required /></Field>
          <Field label="Email hoặc số điện thoại"><Input value={contact} onChange={e => setContact(e.target.value)} required /></Field>
          <Button type="submit" disabled={busy}><Search className="size-4" /> Tra cứu</Button>
        </form>
        {last && (
          <p className="mt-3 text-xs text-muted">Gợi ý demo: booking vừa đặt{' '}
            <button type="button" className="font-mono text-primary underline" onClick={() => { setCode(last.code); setContact(last.guest.email); lookup(undefined, last.code, last.guest.email) }}>{last.code}</button> · {last.guest.email}
          </p>
        )}
        <p className="mt-1 text-xs text-muted">Booking cũ của Nguyễn Văn A: thử mã trong trang Tài khoản sau khi đăng nhập, email nguyenvana@gmail.com.</p>
      </Card>
      {err && <div className="mt-4"><ErrorBox>{err}</ErrorBox></div>}
      {b && (
        <div className="mt-6 space-y-4">
          <BookingSummary b={b} />
          {b.status !== 'cancelled' && b.status !== 'finished' && (
            <div className="flex flex-wrap gap-2">
              <ButtonLink href={`/voucher/${b.code}`} target="_blank"><FileDown className="size-4" /> Voucher</ButtonLink>
              <Button variant="secondary" onClick={() => setChange(true)}><CalendarClock className="size-4" /> Đổi ngày</Button>
              <Button variant="danger" onClick={() => setCancel(true)}><XCircle className="size-4" /> Huỷ booking</Button>
            </div>
          )}
        </div>
      )}
      {b && (
        <ConfirmDialog open={cancel} onClose={() => setCancel(false)} title="Huỷ booking?" danger confirmLabel="Huỷ booking" onConfirm={doCancel}
          message={canFreeCancel(b) ? `Booking thuộc gói huỷ miễn phí. Hoàn ${fmtVND(b.paid)} về phương thức đã thanh toán (giả lập).` : 'Gói này không hoàn huỷ hoặc đã quá hạn huỷ miễn phí. Bạn sẽ không được hoàn tiền đã trả.'} />
      )}
      <Dialog open={change} onClose={() => setChange(false)} title="Đổi ngày lưu trú"
        footer={<Button onClick={() => { setChange(false); toast('Đã gửi yêu cầu đổi ngày tới khách sạn (giả lập)') }}>Gửi yêu cầu</Button>}>
        <p className="text-sm text-muted">Đổi ngày cần khách sạn xác nhận lại giá và tồn phòng. Ghi chú: Gohost API hiện không hỗ trợ đổi ngày — ngoài đời lễ tân xử lý trong Gohost.</p>
        <div className="mt-3 grid grid-cols-2 gap-3"><Field label="Nhận phòng mới"><Input type="date" /></Field><Field label="Trả phòng mới"><Input type="date" /></Field></div>
      </Dialog>
    </div>
  )
}

export default function Page() {
  return <Suspense><MyBooking /></Suspense>
}

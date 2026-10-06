'use client'
import Link from 'next/link'
import { use, useState } from 'react'
import { History, Wallet, XCircle, FileDown } from 'lucide-react'
import { repo } from '@/lib/repo'
import { useAsync } from '@/store/provider'
import { useAdmin } from '@/components/admin/use-admin'
import { BookingSummary } from '@/components/site/booking-detail'
import { METHOD, STATUS } from '@/lib/labels'
import { fmtDateTime, fmtVND } from '@/lib/format'
import type { BookingStatus, PaymentMethod } from '@/lib/types'
import { Breadcrumb, Button, ButtonLink, Card, Empty, Field, Input, Select, SkeletonList, Textarea } from '@/components/ui'
import { ConfirmDialog, toast } from '@/components/ui/overlay'

export default function AdminBookingDetail({ params }: PageProps<'/admin/bookings/[code]'>) {
  const { code } = use(params)
  const a = useAdmin()
  const b = useAsync(() => repo.getBooking(code), [code])
  const [status, setStatus] = useState<BookingStatus | ''>('')
  const [pay, setPay] = useState<{ method: PaymentMethod; amount: string }>({ method: 'transfer', amount: '' })
  const [cancel, setCancel] = useState(false)
  const [reason, setReason] = useState('')
  if (b.loading && !b.data) return <SkeletonList />
  if (!b.data) return <Empty title="Không tìm thấy booking" />
  const bk = b.data
  const editable = a.can('bookings', 'full') && (!a.locked || a.locked === bk.hotel_id)

  async function saveStatus() {
    if (!status) return
    await repo.setBookingStatus(code, status, a.user.name)
    toast(`Đã cập nhật trạng thái: ${STATUS[status][0]}`)
    setStatus('')
  }
  async function savePayment() {
    const amount = Number(pay.amount.replace(/\D/g, ''))
    if (!amount) return toast('Nhập số tiền', 'error')
    await repo.addPayment(code, pay.method, amount, a.user.name)
    toast(`Đã ghi nhận ${fmtVND(amount)}`)
    setPay({ ...pay, amount: '' })
  }
  async function doCancel() {
    await repo.setBookingStatus(code, 'cancelled', a.user.name, reason || undefined)
    setCancel(false)
    toast('Đã huỷ booking — tồn phòng đã được trả lại')
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div>
        <Breadcrumb items={[{ label: 'Bookings', href: '/admin/bookings' }, { label: code }]} />
        <BookingSummary b={bk} />
        <Card className="mt-4 grid gap-3 p-4 text-sm sm:grid-cols-3">
          <div><p className="text-xs text-muted-foreground">Đại lý</p><p className="font-medium">{bk.agentName ? <Link href={`/admin/agents/${bk.agent_id}`} className="text-primary hover:underline">{bk.agentName}</Link> : '—'}</p></div>
          <div><p className="text-xs text-muted-foreground">Hồ sơ khách (CRM)</p><p className="font-medium">{bk.customer_id ? <Link href={`/admin/customers/${bk.customer_id}`} className="text-primary hover:underline">{bk.customer_id}</Link> : 'Chưa định danh (OTA/đại lý)'}</p></div>
          <div><p className="text-xs text-muted-foreground">payment_collect · source_name</p><p className="font-mono text-xs">{bk.payment_collect || '""'} · {bk.source_name}</p></div>
        </Card>
      </div>
      <aside className="space-y-4">
        <Card className="p-4">
          <h2 className="mb-3 flex items-center gap-2 font-semibold"><History className="size-4" /> Dòng thời gian</h2>
          <ol className="space-y-3 border-l-2 border-border pl-4 text-sm">
            {[...bk.timeline].reverse().map((t, i) => (
              <li key={i} className="relative"><span className="absolute -left-[22px] top-1 size-3 rounded-full border-2 border-card bg-primary" />
                <p className="font-medium">{t.text}</p><p className="text-xs text-muted-foreground">{fmtDateTime(t.at)} · {t.by}</p></li>
            ))}
          </ol>
        </Card>
        {editable ? (
          <>
            <Card className="space-y-3 p-4">
              <h2 className="font-semibold">Đổi trạng thái</h2>
              <div className="flex gap-2">
                <Select value={status} onChange={e => setStatus(e.target.value as BookingStatus)} aria-label="Trạng thái mới">
                  <option value="">Chọn trạng thái…</option>
                  {(['new', 'confirmed', 'checked_in', 'finished', 'no_show'] as BookingStatus[]).filter(s => s !== bk.status).map(s => <option key={s} value={s}>{STATUS[s][0]}</option>)}
                </Select>
                <Button onClick={saveStatus} disabled={!status}>Lưu</Button>
              </div>
            </Card>
            <Card className="space-y-3 p-4">
              <h2 className="flex items-center gap-2 font-semibold"><Wallet className="size-4" /> Ghi thanh toán</h2>
              <p className="text-xs text-muted-foreground">Còn lại: {fmtVND(bk.balance)}</p>
              <div className="grid grid-cols-2 gap-2">
                <Select value={pay.method} onChange={e => setPay({ ...pay, method: e.target.value as PaymentMethod })} aria-label="Phương thức">
                  {(['transfer', 'cash', 'card', 'qr'] as PaymentMethod[]).map(m => <option key={m} value={m}>{METHOD[m]}</option>)}
                </Select>
                <Input inputMode="numeric" placeholder={String(bk.balance)} value={pay.amount} onChange={e => setPay({ ...pay, amount: e.target.value })} aria-label="Số tiền" />
              </div>
              <Button variant="secondary" onClick={savePayment} className="w-full">Ghi nhận</Button>
            </Card>
            {bk.status !== 'cancelled' && <Button variant="danger" className="w-full" onClick={() => setCancel(true)}><XCircle className="size-4" /> Huỷ booking</Button>}
          </>
        ) : <p className="text-sm text-muted-foreground">Vai trò hiện tại chỉ được xem booking này.</p>}
        <ButtonLink variant="ghost" href={`/voucher/${code}`} target="_blank" className="w-full"><FileDown className="size-4" /> Voucher</ButtonLink>
      </aside>
      <ConfirmDialog open={cancel} onClose={() => setCancel(false)} title={`Huỷ booking ${code}?`} danger confirmLabel="Huỷ booking" onConfirm={doCancel}
        message="Phòng được trả lại tồn ngay trên website, đại lý và OTA (giả lập). Thao tác được ghi vào dòng thời gian.">
        <Field label="Lý do" className="mt-3"><Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Khách đổi kế hoạch…" /></Field>
      </ConfirmDialog>
    </div>
  )
}

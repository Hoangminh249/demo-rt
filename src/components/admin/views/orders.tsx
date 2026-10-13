'use client'
// Booking đặt trên web (Postgres): danh sách có lọc (trạng thái, khách sạn, ngày đến, cần hoàn tiền, tìm mã/email/SĐT) và chi tiết
// với thao tác: thu tiền tại quầy, nhận / trả phòng, huỷ / không đến (xem trước tiền phạt), gửi lại email, xử lý hoàn tiền.
// STAFF chỉ thấy nút nhận / trả phòng (server cũng chặn).
import { useState, type FormEvent, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge, CARD, Dl, Empty, Skel, vnd, type Tone } from '@/components/admin/ui'
import { Field, INPUT, Notice } from '@/components/admin/form'
import { adminErrorText, useAdminOrder, useAdminOrders, useOrderAction, type OrdersFilter } from '@/hooks/use-admin'
import { fmtDate } from '@/lib/format'
import { PAY_METHODS } from '@/lib/order-commands'
import type { AdminOrder, OrderPaymentStatus, OrderStatus } from '@/types/admin'
import { DbFailed } from './rates'

export const ORDER_STATUS: Record<OrderStatus, [string, Tone]> = {
  PENDING_PAYMENT: ['Chờ thanh toán', 'warn'], CONFIRMED: ['Đã xác nhận', 'ok'], CHECKED_IN: ['Đang ở', 'ok'], CHECKED_OUT: ['Đã trả phòng', 'neutral'],
  CANCELLED: ['Đã huỷ', 'neutral'], EXPIRED: ['Hết hạn giữ', 'neutral'], NO_SHOW: ['Không đến', 'err'],
}
const PAY_STATUS: Record<OrderPaymentStatus, string> = { UNPAID: 'Chưa trả', DEPOSIT_PAID: 'Đã cọc', PAID: 'Đã trả đủ', PARTIALLY_REFUNDED: 'Đã hoàn một phần', REFUNDED: 'Đã hoàn' }
const METHOD: Record<(typeof PAY_METHODS)[number], string> = { cash: 'Tiền mặt', transfer: 'Chuyển khoản', card: 'Thẻ (POS)' }
const dt = (s: string) => new Date(s).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'short', timeStyle: 'short' })

// ---------- Danh sách ----------

export function OrdersView() {
  const sp = useSearchParams()
  const router = useRouter()
  const f: OrdersFilter = Object.fromEntries(['status', 'hotel', 'from', 'to', 'refund', 'q', 'page'].flatMap(k => (sp.get(k) ? [[k, sp.get(k)!]] : [])))
  const q = useAdminOrders(f)
  const go = (next: OrdersFilter) => router.replace(`/admin/orders?${new URLSearchParams(Object.entries(next).filter(([, v]) => v) as [string, string][])}`, { scroll: false })
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const d = new FormData(e.currentTarget)
    go({ status: String(d.get('status') ?? ''), hotel: String(d.get('hotel') ?? ''), from: String(d.get('from') ?? ''), to: String(d.get('to') ?? ''), q: String(d.get('q') ?? '').trim(), refund: d.get('refund') ? '1' : '' })
  }
  const page = Number(f.page ?? 1)

  return (
    <div className="grid max-w-site gap-4">
      {!!q.data?.needsRefund && !f.refund && (
        <button type="button" onClick={() => go({ refund: '1' })} className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left text-sm text-amber-800 hover:bg-amber-100">
          <AlertTriangle className="size-5 shrink-0" aria-hidden /><span><b>{q.data.needsRefund} booking cần hoàn tiền</b> — bấm để xem danh sách.</span>
        </button>
      )}
      <form key={sp.toString()} onSubmit={submit} className={`${CARD} grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6`}>
        <Field label="Tìm" className="lg:col-span-2"><input name="q" defaultValue={f.q} placeholder="Mã RH-…, email, SĐT, tên" className={INPUT} /></Field>
        <Field label="Trạng thái"><select name="status" defaultValue={f.status ?? ''} className={INPUT}><option value="">Tất cả</option>{Object.entries(ORDER_STATUS).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}</select></Field>
        <Field label="Khách sạn"><select name="hotel" defaultValue={f.hotel ?? ''} className={INPUT}><option value="">Tất cả</option>{q.data?.hotels.map(h => <option key={h.slug} value={h.slug}>{h.name}</option>)}</select></Field>
        <Field label="Ngày đến từ"><input type="date" name="from" defaultValue={f.from} className={INPUT} /></Field>
        <Field label="đến"><input type="date" name="to" defaultValue={f.to} className={INPUT} /></Field>
        <label className="flex items-center gap-2 text-sm lg:col-span-2"><input type="checkbox" name="refund" defaultChecked={!!f.refund} className="size-4" />Chỉ booking cần hoàn tiền</label>
        <div className="flex gap-2 lg:col-span-4 lg:justify-end">
          <Button type="button" variant="ghost" onClick={() => go({})}>Xoá lọc</Button>
          <Button type="submit">Lọc</Button>
        </div>
      </form>

      {q.isPending ? <div className={`${CARD} grid gap-2 p-5`}>{[0, 1, 2, 3, 4].map(i => <Skel key={i} className="h-10" />)}</div>
        : q.isError || !q.data ? <DbFailed error={q.error} onRetry={() => q.refetch()} />
        : (
          <section className={`${CARD} overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-xs text-muted-foreground">
                  <tr><th className="px-4 py-2.5 font-medium">Mã</th><th className="px-3 py-2.5 font-medium">Khách</th><th className="px-3 py-2.5 font-medium">Ngày ở</th><th className="px-3 py-2.5 font-medium">Trạng thái</th><th className="px-3 py-2.5 text-right font-medium">Tổng</th><th className="px-4 py-2.5 text-right font-medium">Còn lại</th></tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {q.data.rows.map(r => (
                    <tr key={r.code} className="hover:bg-item-hover">
                      <td className="px-4 py-2.5"><Link href={`/admin/orders/${r.code}`} className="font-mono font-semibold whitespace-nowrap underline-offset-4 hover:underline">{r.code}</Link><p className="text-xs text-muted-foreground">{r.hotel}</p></td>
                      <td className="px-3 py-2.5"><p className="font-medium">{r.guest}</p><p className="text-xs text-muted-foreground">{r.phone}</p></td>
                      <td className="px-3 py-2.5 whitespace-nowrap tabular-nums">{fmtDate(r.checkIn)} → {fmtDate(r.checkOut)}</td>
                      <td className="px-3 py-2.5"><div className="flex flex-wrap gap-1"><Badge tone={ORDER_STATUS[r.status][1]}>{ORDER_STATUS[r.status][0]}</Badge>{r.needsRefund && <Badge tone="err">Cần hoàn</Badge>}</div><p className="mt-0.5 text-xs text-muted-foreground">{PAY_STATUS[r.paymentStatus]}</p></td>
                      <td className="px-3 py-2.5 text-right whitespace-nowrap tabular-nums">{vnd(r.total)}</td>
                      <td className="px-4 py-2.5 text-right whitespace-nowrap tabular-nums">{r.balanceDue ? vnd(r.balanceDue) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!q.data.rows.length && <Empty>Không có booking khớp bộ lọc.</Empty>}
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-2.5 text-sm text-muted-foreground">
              <span className="tabular-nums">{q.data.total} booking</span>
              <div className="flex items-center gap-1">
                <Button type="button" variant="ghost" size="icon" aria-label="Trang trước" disabled={page <= 1} onClick={() => go({ ...f, page: String(page - 1) })}><ChevronLeft /></Button>
                <span className="tabular-nums">{page}/{q.data.pages}</span>
                <Button type="button" variant="ghost" size="icon" aria-label="Trang sau" disabled={page >= q.data.pages} onClick={() => go({ ...f, page: String(page + 1) })}><ChevronRight /></Button>
              </div>
            </div>
          </section>
        )}
    </div>
  )
}

// ---------- Chi tiết ----------

function Box({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return <section className={`${CARD} p-5 ${className ?? ''}`}><h3 className="mb-3 text-sm font-semibold">{title}</h3>{children}</section>
}

/** `act` ở component cha: khối này dựng lại khi trạng thái / tiền đổi (để form về số mới) mà câu báo kết quả vẫn còn. */
function Actions({ o, staff, act }: { o: AdminOrder; staff: boolean; act: ReturnType<typeof useOrderAction> }) {
  const busy = (op: string, noShow?: boolean) => act.isPending && act.variables?.op === op && (noShow === undefined || (act.variables as { noShow?: boolean }).noShow === noShow)
  const [pay, setPay] = useState({ amount: o.balanceDue, method: 'cash' as (typeof PAY_METHODS)[number], note: '' })
  const [reason, setReason] = useState('')
  const live = ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'].includes(o.status)
  return (
    <Box title="Thao tác">
      <div className="grid gap-4">
        {(act.isSuccess || act.isError) && (act.isSuccess ? <Notice ok>{act.data.message}</Notice> : <Notice ok={false}>{adminErrorText(act.error)}</Notice>)}
        <div className="flex flex-wrap gap-2">
          {o.status === 'CONFIRMED' && <Button type="button" disabled={act.isPending} loading={busy('order.checkin')} onClick={() => act.mutate({ op: 'order.checkin' })}>Nhận phòng (check-in)</Button>}
          {o.status === 'CHECKED_IN' && <Button type="button" disabled={act.isPending} loading={busy('order.checkout')} onClick={() => act.mutate({ op: 'order.checkout' })}>Trả phòng (check-out)</Button>}
          {!staff && live && <Button type="button" variant="outline" disabled={act.isPending} loading={busy('order.email')} onClick={() => act.mutate({ op: 'order.email' })}>Gửi lại email</Button>}
        </div>

        {!staff && live && o.balanceDue > 0 && (
          <form onSubmit={e => { e.preventDefault(); act.mutate({ op: 'order.pay', amount: pay.amount, method: pay.method, note: pay.note || null }) }} className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-4">
            <p className="text-sm font-medium sm:col-span-4">Ghi nhận tiền thu tại quầy <span className="font-normal text-muted-foreground">· còn {vnd(o.balanceDue)}</span></p>
            <Field label="Số tiền (VND)"><input type="number" min={1} max={o.balanceDue} required value={pay.amount} onChange={e => setPay({ ...pay, amount: Number(e.target.value) || 0 })} className={INPUT} /></Field>
            <Field label="Hình thức"><select value={pay.method} onChange={e => setPay({ ...pay, method: e.target.value as typeof pay.method })} className={INPUT}>{PAY_METHODS.map(m => <option key={m} value={m}>{METHOD[m]}</option>)}</select></Field>
            <Field label="Ghi chú"><input value={pay.note} maxLength={300} onChange={e => setPay({ ...pay, note: e.target.value })} className={INPUT} /></Field>
            <Button type="submit" disabled={act.isPending} loading={busy('order.pay')} className="self-end">Ghi nhận</Button>
          </form>
        )}

        {!staff && o.preview && (
          <div className="grid gap-3 rounded-xl border border-red-200 p-4">
            <p className="text-sm font-medium text-red-800">Huỷ / không đến</p>
            <Dl rows={[
              ['Huỷ bây giờ: phạt', vnd(o.preview.penalty)], ['→ cần hoàn', vnd(o.preview.refund)],
              ...(o.status === 'CONFIRMED' ? [['Không đến: phạt', vnd(o.preview.noShow)], ['→ cần hoàn', vnd(o.preview.noShowRefund)]] as [string, string][] : []),
            ]} />
            <p className="text-xs text-muted-foreground">Theo chính sách lúc đặt: {o.cancellation}</p>
            <Field label="Lý do (bắt buộc, lưu vào lịch sử)"><input value={reason} onChange={e => setReason(e.target.value)} maxLength={300} className={INPUT} /></Field>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" className="text-red-700" disabled={act.isPending || reason.trim().length < 3} loading={busy('order.cancel', false)}
                onClick={() => confirm(`Huỷ ${o.code}? Phạt ${vnd(o.preview!.penalty)}.`) && act.mutate({ op: 'order.cancel', reason, noShow: false })}>Huỷ booking</Button>
              {o.status === 'CONFIRMED' && <Button type="button" variant="outline" className="text-red-700" disabled={act.isPending || reason.trim().length < 3} loading={busy('order.cancel', true)}
                onClick={() => confirm(`Đánh dấu ${o.code} không đến? Phạt ${vnd(o.preview!.noShow)}.`) && act.mutate({ op: 'order.cancel', reason, noShow: true })}>Không đến (no-show)</Button>}
            </div>
          </div>
        )}
        {staff && !['CONFIRMED', 'CHECKED_IN'].includes(o.status) && <p className="text-sm text-muted-foreground">Không có thao tác cho trạng thái này.</p>}
      </div>
    </Box>
  )
}

export function OrderView({ code, staff }: { code: string; staff: boolean }) {
  const q = useAdminOrder(code)
  const act = useOrderAction(code)
  if (q.isPending) return <div className={`${CARD} grid max-w-site gap-3 p-5`}>{[0, 1, 2, 3].map(i => <Skel key={i} className="h-12" />)}</div>
  if (q.isError || !q.data) return <div className="max-w-site"><DbFailed error={q.error} onRetry={() => q.refetch()} /></div>
  const o = q.data
  const nights = o.rooms[0]?.nights ?? []
  return (
    <div className="grid max-w-site gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-mono text-lg font-semibold">{o.code}</h1>
        <Badge tone={ORDER_STATUS[o.status][1]}>{ORDER_STATUS[o.status][0]}</Badge>
        <Badge tone="neutral">{PAY_STATUS[o.paymentStatus]}</Badge>
        {o.needsRefund && <Badge tone="err">Cần hoàn tiền</Badge>}
        <span className="text-sm text-muted-foreground">đặt {dt(o.createdAt)}</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid content-start gap-4">
          <Actions key={`${o.status}-${o.balanceDue}`} o={o} staff={staff} act={act} />
          <Box title="Lưu trú">
            <Dl rows={[
              ['Khách sạn', o.hotel.name], ['Phòng', `${o.rooms.length} × ${o.room}`], ['Gói', o.plan],
              ['Nhận → trả', `${fmtDate(o.checkIn)} → ${fmtDate(o.checkOut)} (${nights.length} đêm)`],
              ['Khách', `${o.adults} người lớn${o.children ? ` · ${o.children} trẻ (${o.childAges.join(', ')} tuổi)` : ''}`],
            ]} />
            {o.specialRequests && <p className="mt-3 rounded-xl bg-muted px-3 py-2 text-sm">{o.specialRequests}</p>}
          </Box>
          {o.refunds.length > 0 && (
            <Box title="Hoàn tiền">
              <ul className="grid gap-3">
                {o.refunds.map(r => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-3 text-sm">
                    <div className="min-w-0"><p className="font-medium tabular-nums">{vnd(r.amount)} · {r.status === 'PENDING' ? 'Chờ xử lý' : r.status === 'DONE' ? 'Đã chuyển' : 'Từ chối'}</p><p className="text-xs text-pretty text-muted-foreground">{r.reason}</p></div>
                    {r.status === 'PENDING' && !staff && (
                      <div className="flex gap-2">
                        <Button type="button" size="sm" disabled={act.isPending} onClick={() => confirm(`Đã chuyển hoàn ${vnd(r.amount)} cho khách?`) && act.mutate({ op: 'order.refund', refundId: r.id, status: 'DONE' })}>Đã chuyển tiền</Button>
                        <Button type="button" size="sm" variant="outline" disabled={act.isPending} onClick={() => confirm('Từ chối khoản hoàn này?') && act.mutate({ op: 'order.refund', refundId: r.id, status: 'REJECTED' })}>Từ chối</Button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              {act.isError && <div className="mt-3"><Notice ok={false}>{adminErrorText(act.error)}</Notice></div>}
            </Box>
          )}
          <Box title="Lịch sử">
            <ol className="grid gap-2 text-sm">
              {o.history.map((h, i) => (
                <li key={i} className="flex gap-3"><span className="w-32 shrink-0 text-xs text-muted-foreground tabular-nums">{dt(h.at)}</span>
                  <span className="min-w-0">{h.from && h.from !== h.to ? `${ORDER_STATUS[h.from as OrderStatus]?.[0] ?? h.from} → ` : ''}<b>{ORDER_STATUS[h.to as OrderStatus]?.[0] ?? h.to}</b>{h.note && ` · ${h.note}`}{h.by && <span className="text-muted-foreground"> · {h.by}</span>}</span></li>
              ))}
            </ol>
          </Box>
        </div>

        <div className="grid content-start gap-4">
          <Box title="Liên hệ">
            <Dl rows={[['Người đặt', o.contact.name], ['Điện thoại', o.contact.phone], ['Email', o.contact.email], ...(o.contact.guestName ? [['Nhận phòng', o.contact.guestName] as [string, string]] : []), ['Tài khoản', o.contact.account ?? '—']]} />
          </Box>
          <Box title="Tiền">
            <Dl rows={[
              ...nights.map(n => [fmtDate(n.date), vnd(n.price * o.rooms.length + n.extraFee)] as [string, string]),
              ...(o.discount ? [[`Khuyến mãi${o.promoCode ? ` ${o.promoCode}` : ''}`, `−${vnd(o.discount)}`] as [string, string]] : []),
              ...(o.taxFees ? [['Thuế, phí', vnd(o.taxFees)] as [string, string]] : []),
              ['Tổng', vnd(o.total)], ['Đã trả', vnd(o.paidAmount)],
              ['Còn lại', `${vnd(o.balanceDue)}${o.balanceDueAt ? ` · hạn ${fmtDate(o.balanceDueAt)}` : ''}`],
            ]} />
          </Box>
          <Box title="Thanh toán">
            {o.payments.length ? (
              <ul className="grid gap-2 text-sm">{o.payments.map(p => <li key={p.id} className="flex justify-between gap-3"><span>{p.kind} · {p.provider}<span className="block text-xs text-muted-foreground">{dt(p.paidAt ?? p.createdAt)} · {p.status}</span></span><span className="tabular-nums">{vnd(p.amount)}</span></li>)}</ul>
            ) : <Empty>Chưa có thanh toán.</Empty>}
          </Box>
          <Box title="Email">
            {o.emails.length ? (
              <ul className="grid gap-2 text-sm">{o.emails.map((e, i) => <li key={i}><span className="font-medium">{e.template}</span> → {e.to}<span className="block text-xs text-muted-foreground">{dt(e.at)} · {e.status}{e.error ? ` · ${e.error}` : ''}</span></li>)}</ul>
            ) : <Empty>Chưa gửi email nào.</Empty>}
          </Box>
        </div>
      </div>
    </div>
  )
}

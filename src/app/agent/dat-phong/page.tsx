'use client'
import Link from 'next/link'
import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { repo } from '@/lib/repo'
import type { Booking } from '@/lib/types'
import { useAsync, useDemo } from '@/store/provider'
import { diffDays, fmtNumber, fmtRange, fmtVND, isISODate } from '@/lib/format'
import { Button, ButtonLink, Card, ErrorBox, Field, Input, PageTitle, Select, SkeletonList, Textarea, cn } from '@/components/ui'

function AgentBook() {
  const sp = useSearchParams()
  const { overlay } = useDemo()
  const agentId = overlay.session.agentId!
  const roomId = sp.get('room') ?? ''
  const checkin = isISODate(sp.get('in')) ? sp.get('in')! : '2026-10-20'
  const checkout = isISODate(sp.get('out')) ? sp.get('out')! : '2026-10-21'
  const [rooms, setRooms] = useState(Number(sp.get('r') ?? 1))
  const [f, setF] = useState({ adults: 2 * rooms, children: 0, name: '', phone: '', email: '', list: '', notes: '' })
  const [payment, setPayment] = useState<'credit' | 'now'>('credit')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [done, setDone] = useState<{ booking: Booking; message: { source: string; revenue: number; payment: string; status: string } } | null>(null)

  const st = useAsync(() => repo.getAgent(agentId), [agentId])
  const search = useAsync(() => repo.agentSearch(agentId, { checkin, checkout, rooms }), [agentId, checkin, checkout])
  const room = search.data?.flatMap(h => h.rooms.map(r => ({ ...r, hotel: h.hotel }))).find(r => r.rt.room_type_id === roomId)
  if (!room || !st.data) return <SkeletonList />
  const nights = diffDays(checkin, checkout)
  const total = room.net_rate * nights * rooms
  const after = st.data.exposure + total
  const over = payment === 'credit' && after > st.data.agent.credit_limit

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!room) return
    setBusy(true); setErr('')
    try {
      const r = await repo.createAgentBooking({
        agent_id: agentId, room_type_id: roomId, checkin, checkout, rooms, adults: f.adults, children: f.children,
        guest: { name: f.name, phone: f.phone, email: f.email, nationality: 'Việt Nam' },
        guests_list: f.list.split('\n').map(s => s.trim()).filter(Boolean), payment, notes: f.notes,
      })
      setDone(r)
    } catch (x) { setErr((x as Error).message) }
    setBusy(false)
  }

  if (done) {
    const leftNow = search.data?.flatMap(h => h.rooms).find(r => r.rt.room_type_id === roomId)?.left
    return (
      <Card className="mx-auto max-w-2xl p-6">
        <CheckCircle2 className="size-12 text-ok" />
        <h1 className="mt-2 text-xl font-bold">Booking {done.booking.code} đã vào hệ thống Rooty</h1>
        <p className="mt-3 rounded-lg bg-muted p-3 font-mono text-sm">Source: {done.message.source} | Revenue: {fmtNumber(done.message.revenue)} | Payment: {done.message.payment} | Status: {done.message.status}</p>
        <p className="mt-3 text-sm">Tồn {room.rt.name} đêm {fmtRange(checkin, checkout)} giờ còn <b className="text-primary">{leftNow ?? '…'} phòng</b> — website và lễ tân cũng thấy con số này ngay.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <ButtonLink href={`/voucher/${done.booking.code}`} target="_blank">Tải voucher</ButtonLink>
          <ButtonLink variant="secondary" href={`/agent/booking/${done.booking.code}`}>Xem booking</ButtonLink>
          <ButtonLink variant="secondary" href={`/${room.hotel.slug}?in=${checkin}&out=${checkout}&a=2&c=0&r=1#phong`}>Kiểm tra tồn trên website</ButtonLink>
          <ButtonLink variant="ghost" href="/admin/inventory">Admin › Inventory</ButtonLink>
        </div>
      </Card>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div>
        <PageTitle title="Đặt phòng cho khách" sub={`${room.hotel.name} · ${room.rt.name} · ${fmtRange(checkin, checkout)} (${nights} đêm)`} />
        <Card className="p-5">
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Số phòng"><Select value={rooms} onChange={e => { setRooms(+e.target.value); setF({ ...f, adults: 2 * +e.target.value }) }}>{Array.from({ length: Math.max(1, room.left) }, (_, i) => <option key={i + 1}>{i + 1}</option>)}</Select></Field>
              <Field label="Người lớn"><Input type="number" min={1} max={room.rt.max_adults * rooms} value={f.adults} onChange={e => setF({ ...f, adults: +e.target.value })} /></Field>
              <Field label="Trẻ em"><Input type="number" min={0} max={room.rt.max_children * rooms} value={f.children} onChange={e => setF({ ...f, children: +e.target.value })} /></Field>
              <Field label="Khách đại diện *"><Input required value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></Field>
              <Field label="Điện thoại *"><Input required type="tel" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} /></Field>
              <Field label="Email"><Input type="email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} /></Field>
            </div>
            <Field label="Danh sách khách (mỗi dòng 1 người)"><Textarea rows={4} value={f.list} onChange={e => setF({ ...f, list: e.target.value })} placeholder={'Nguyễn Văn B\nTrần Thị C'} /></Field>
            <Field label="Ghi chú cho khách sạn"><Input value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })} /></Field>
            <fieldset className="grid gap-2 sm:grid-cols-2">
              <legend className="mb-1 text-sm font-semibold">Thanh toán</legend>
              {([['credit', 'Ghi công nợ', 'Đối soát cuối tháng'], ['now', 'Thanh toán ngay', 'Chuyển khoản (giả lập)']] as const).map(([v, t, d]) => (
                <label key={v} className={cn('flex cursor-pointer items-center gap-3 rounded-xl border p-3', payment === v ? 'border-primary bg-accent/60' : 'border-border')}>
                  <input type="radio" name="pay" className="accent-[var(--primary)]" checked={payment === v} onChange={() => setPayment(v)} />
                  <span><span className="block text-sm font-semibold">{t}</span><span className="text-xs text-muted-foreground">{d}</span></span>
                </label>
              ))}
            </fieldset>
            {over && <ErrorBox>Vượt hạn mức công nợ ({fmtVND(after)} &gt; {fmtVND(st.data.agent.credit_limit)}). Chọn “Thanh toán ngay”.</ErrorBox>}
            {err && <ErrorBox>{err}</ErrorBox>}
            <Button type="submit" size="lg" disabled={busy || room.left < rooms} className="w-full">{busy ? <><Loader2 className="size-4 animate-spin" /> Đang đặt…</> : `Đặt ${rooms} phòng · ${fmtVND(total)}`}</Button>
          </form>
        </Card>
      </div>
      <aside className="space-y-3">
        <Card className="space-y-1 p-4 text-sm">
          <p className="font-semibold">Tóm tắt giá net</p>
          <p className="flex justify-between text-muted-foreground"><span>Public {fmtNumber(room.public_rate)} × {nights} đêm × {rooms}</span><span className="line-through">{fmtNumber(room.public_rate * nights * rooms)}</span></p>
          <p className="flex justify-between"><span>Net {fmtNumber(room.net_rate)} × {nights} đêm × {rooms}</span><b>{fmtNumber(total)}</b></p>
          <p className="flex justify-between text-ok"><span>Lợi nhuận đại lý</span><span>{fmtNumber((room.public_rate - room.net_rate) * nights * rooms)}</span></p>
        </Card>
        <Card className="space-y-1 p-4 text-sm">
          <p className="font-semibold">Công nợ</p>
          <p className="flex justify-between"><span>Đã phát sinh</span><span>{fmtVND(st.data.debt)}</span></p>
          <p className="flex justify-between"><span>Hạn mức đã dùng</span><span>{fmtVND(st.data.exposure)}</span></p>
          <p className="flex justify-between"><span>Sau booking (nếu ghi nợ)</span><span className={cn(after > st.data.agent.credit_limit && 'text-danger')}>{fmtVND(after)}</span></p>
          <p className="flex justify-between text-muted-foreground"><span>Hạn mức</span><span>{fmtVND(st.data.agent.credit_limit)}</span></p>
        </Card>
        <p className="text-xs text-muted-foreground">Còn {room.left} phòng. <Link href="/agent/tim-phong" className="underline">Đổi phòng/ngày</Link></p>
      </aside>
    </div>
  )
}

export default function Page() { return <Suspense><AgentBook /></Suspense> }

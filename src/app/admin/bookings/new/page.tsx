'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { repo, type CreateBookingInput } from '@/lib/repo'
import { useAsync } from '@/store/provider'
import { useAdmin } from '@/components/admin/use-admin'
import { addDays, fmtVND, TODAY } from '@/lib/format'
import { Badge, Breadcrumb, Button, Card, ErrorBox, Field, Input, PageTitle, Select, Textarea } from '@/components/ui'
import { toast } from '@/components/ui/overlay'

export default function NewBooking() {
  const a = useAdmin()
  const router = useRouter()
  const [hotelId, setHotelId] = useState(a.locked ?? (a.hotelId !== 'all' ? a.hotelId : 'H01'))
  const rooms = useAsync(() => repo.listRoomTypes(hotelId), [hotelId])
  const [f, setF] = useState({ room: '', plan: '', checkin: addDays(TODAY, 1), checkout: addDays(TODAY, 3), rooms: 1, adults: 2, children: 0, name: '', phone: '', email: '', notes: '', method: 'hotel' as CreateBookingInput['payment']['method'] })
  const room = f.room || rooms.data?.[0]?.room_type_id || ''
  const plan = f.plan.startsWith(room) ? f.plan : `${room}-BB`
  const q = useAsync(() => (room ? repo.quote({ room_type_id: room, rate_plan_id: plan, checkin: f.checkin, checkout: f.checkout, rooms: f.rooms, adults: f.adults, children: f.children, addons: [] }) : Promise.resolve(null)), [room, plan, f.checkin, f.checkout, f.rooms, f.adults, f.children])
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setErr('')
    try {
      const b = await repo.createBooking({
        room_type_id: room, rate_plan_id: plan, checkin: f.checkin, checkout: f.checkout, rooms: f.rooms, adults: f.adults, children: f.children, addons: [],
        guest: { name: f.name, phone: f.phone, email: f.email || `${f.phone}@khach.local`, nationality: 'Việt Nam' }, notes: f.notes,
        payment: { method: f.method, mode: 'full' }, channel: 'offline', created_by: a.user.name,
      })
      toast(`Đã tạo booking ${b.code} (nguồn Offline)`)
      router.push(`/admin/bookings/${b.code}`)
    } catch (x) { setErr((x as Error).message); setBusy(false) }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Breadcrumb items={[{ label: 'Bookings', href: '/admin/bookings' }, { label: 'Tạo mới' }]} />
      <PageTitle title="Nhân viên tạo booking" sub="Khách gọi điện / walk-in — booking vào cùng hệ thống, nguồn Offline, trừ tồn ngay" />
      <Card className="p-5">
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-3">
          <Field label="Khách sạn"><Select value={hotelId} disabled={!!a.locked} onChange={e => { setHotelId(e.target.value); setF({ ...f, room: '', plan: '' }) }}>{a.hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}</Select></Field>
          <Field label="Hạng phòng"><Select value={room} onChange={e => setF({ ...f, room: e.target.value, plan: '' })}>{(rooms.data ?? []).map(r => <option key={r.room_type_id} value={r.room_type_id}>{r.name}</option>)}</Select></Field>
          <Field label="Gói giá"><Select value={plan} onChange={e => setF({ ...f, plan: e.target.value })}><option value={`${room}-BB`}>Bao gồm ăn sáng · Huỷ miễn phí</option><option value={`${room}-RO`}>Room Only · Không hoàn huỷ</option></Select></Field>
          <Field label="Nhận phòng"><Input type="date" min={TODAY} value={f.checkin} onChange={e => e.target.value && setF({ ...f, checkin: e.target.value, checkout: f.checkout > e.target.value ? f.checkout : addDays(e.target.value, 1) })} /></Field>
          <Field label="Trả phòng"><Input type="date" min={addDays(f.checkin, 1)} value={f.checkout} onChange={e => e.target.value && setF({ ...f, checkout: e.target.value })} /></Field>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Phòng"><Input type="number" min={1} max={10} value={f.rooms} onChange={e => setF({ ...f, rooms: +e.target.value })} /></Field>
            <Field label="NL"><Input type="number" min={1} value={f.adults} onChange={e => setF({ ...f, adults: +e.target.value })} /></Field>
            <Field label="TE"><Input type="number" min={0} value={f.children} onChange={e => setF({ ...f, children: +e.target.value })} /></Field>
          </div>
          <Field label="Tên khách *"><Input required value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Điện thoại *"><Input required type="tel" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} /></Field>
          <Field label="Email"><Input type="email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} /></Field>
          <Field label="Thanh toán"><Select value={f.method} onChange={e => setF({ ...f, method: e.target.value as typeof f.method })}><option value="hotel">Thu tại quầy khi nhận phòng</option><option value="transfer">Chờ chuyển khoản</option><option value="card">Quẹt thẻ POS ngay</option></Select></Field>
          <Field label="Ghi chú" className="sm:col-span-2"><Textarea value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })} /></Field>
          <div className="flex flex-wrap items-center gap-3 sm:col-span-3">
            {q.data && <><Badge tone={q.data.left >= f.rooms ? 'ok' : 'danger'}>Còn {q.data.left} phòng</Badge><span className="text-sm">Tổng: <b>{fmtVND(q.data.total)}</b>{q.data.promo && ` (đã áp ${q.data.promo.name.split('–')[0].trim()})`}</span></>}
            <Button type="submit" className="ml-auto" disabled={busy || !q.data || q.data.left < f.rooms}>Tạo booking</Button>
          </div>
          {err && <div className="sm:col-span-3"><ErrorBox>{err}</ErrorBox></div>}
        </form>
      </Card>
    </div>
  )
}

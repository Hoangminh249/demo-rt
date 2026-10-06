'use client'
import Link from 'next/link'
import { useState } from 'react'
import { Search } from 'lucide-react'
import { repo } from '@/lib/repo'
import { useAsync, useDemo } from '@/store/provider'
import { AREA_LABEL } from '@/lib/labels'
import { addDays, fmtNumber, fmtRange, TODAY } from '@/lib/format'
import { stockLevel } from '@/lib/inventory'
import { Badge, Button, ButtonLink, Card, Field, Input, PageTitle, Select, SkeletonList, Stars, cn } from '@/components/ui'

export default function AgentSearch() {
  const { overlay } = useDemo()
  const agentId = overlay.session.agentId!
  const agent = repo.agentsSync().find(a => a.id === agentId)
  // Mặc định đúng ví dụ PDF §6: đêm 20/10, PITO Deluxe Ocean View
  const [form, setForm] = useState({ dest: 'pito-hon-thom', checkin: '2026-10-20', checkout: '2026-10-21', rooms: 2 })
  const [q, setQ] = useState(form)
  const res = useAsync(() => repo.agentSearch(agentId, q), [agentId, q])
  const hotels = repo.hotelsSync()

  return (
    <>
      <PageTitle title="Tìm phòng" sub="Giá niêm yết (Public) và giá net riêng của đại lý · tồn phòng thời gian thực, dùng chung với website" />
      <Card className="mb-6 p-4">
        <form onSubmit={e => { e.preventDefault(); setQ(form) }} className="grid gap-3 sm:grid-cols-[1.5fr_1fr_1fr_0.6fr_auto] sm:items-end">
          <Field label="Khách sạn / khu vực">
            <Select value={form.dest} onChange={e => setForm({ ...form, dest: e.target.value })}>
              <option value="phu-quoc">Tất cả</option>
              {(['bac-dao', 'trung-tam', 'nam-dao'] as const).map(a => <option key={a} value={a}>{AREA_LABEL[a]}</option>)}
              {hotels.map(h => <option key={h.slug} value={h.slug}>{h.name}</option>)}
            </Select>
          </Field>
          <Field label="Nhận phòng"><Input type="date" min={TODAY} value={form.checkin} onChange={e => e.target.value && setForm({ ...form, checkin: e.target.value, checkout: form.checkout > e.target.value ? form.checkout : addDays(e.target.value, 1) })} /></Field>
          <Field label="Trả phòng"><Input type="date" min={addDays(form.checkin, 1)} value={form.checkout} onChange={e => e.target.value && setForm({ ...form, checkout: e.target.value })} /></Field>
          <Field label="Số phòng"><Select value={form.rooms} onChange={e => setForm({ ...form, rooms: +e.target.value })}>{[1, 2, 3, 4, 5, 6, 8, 10].map(n => <option key={n}>{n}</option>)}</Select></Field>
          <Button type="submit"><Search className="size-4" /> Tìm</Button>
        </form>
      </Card>
      {!res.data ? <SkeletonList /> : (
        <div className={cn('space-y-6', res.loading && 'opacity-60')}>
          {res.data.map(({ hotel, rooms }) => (
            <section key={hotel.id}>
              <h2 className="mb-2 flex items-center gap-2 text-lg font-bold">{hotel.name} <Stars n={hotel.stars} /></h2>
              <div className="grid gap-3 md:grid-cols-2">
                {rooms.map(r => {
                  const lvl = stockLevel(r.left, r.rt.quantity)
                  const ok = r.left >= q.rooms
                  return (
                    <Card key={r.rt.room_type_id} className="p-4 font-mono text-sm">
                      <p className="text-xs font-bold tracking-wider text-warn">AGENT {agent?.name.toUpperCase()}</p>
                      <p className="mt-1 font-sans text-base font-semibold">{hotel.name} | {r.rt.name}</p>
                      <p className="font-sans text-xs text-muted-foreground">{fmtRange(q.checkin, q.checkout)} · {r.nights} đêm · tối đa {r.rt.max_adults} NL + {r.rt.max_children} TE/phòng</p>
                      <dl className="mt-2 space-y-0.5">
                        <div className="flex justify-between"><dt>Public Rate:</dt><dd className="text-muted-foreground line-through decoration-1">{fmtNumber(r.public_rate)}</dd></div>
                        <div className="flex justify-between"><dt>Agent Net Rate:</dt><dd className="font-bold text-primary">{fmtNumber(r.net_rate)}</dd></div>
                        <div className="flex justify-between"><dt>Availability:</dt><dd><Badge tone={lvl === 'out' ? 'danger' : lvl === 'low' ? 'warn' : 'ok'}>{r.left} rooms</Badge></dd></div>
                      </dl>
                      <div className="mt-3 flex items-center justify-between font-sans">
                        <span className="text-xs text-muted-foreground">Tổng net {q.rooms} phòng: <b className="text-foreground">{fmtNumber(r.net_rate * r.nights * q.rooms)}</b></span>
                        <ButtonLink size="sm" href={ok ? `/agent/dat-phong?room=${r.rt.room_type_id}&in=${q.checkin}&out=${q.checkout}&r=${q.rooms}` : '#'} className={cn(!ok && 'pointer-events-none opacity-40')} aria-disabled={!ok}>BOOK</ButtonLink>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </section>
          ))}
          <p className="text-xs text-muted-foreground">Giá net đại lý do Rooty quản lý (Gohost API không có net rate). <Link href="/kien-truc" className="underline">Xem ghi chú kiến trúc</Link>.</p>
        </div>
      )}
    </>
  )
}

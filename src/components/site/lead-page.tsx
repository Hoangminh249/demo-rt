'use client'
import { useState } from 'react'
import { CheckCircle2, Check } from 'lucide-react'
import { repo } from '@/lib/repo'
import { TODAY } from '@/lib/format'
import { Button, Card, Field, Input, Photo, Textarea } from '../ui'

/** Trang giới thiệu + form yêu cầu báo giá (Hội nghị & Sự kiện, Wedding). */
export function LeadPage({ kind, title, intro, image, points, venues }: { kind: 'mice' | 'wedding'; title: string; intro: string; image: string; points: string[]; venues: { name: string; desc: string }[] }) {
  const [f, setF] = useState({ name: '', phone: '', email: '', date: '', guests: 50, note: '' })
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    await repo.submitLead({ kind, ...f })
    setBusy(false)
    setSent(true)
  }
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="relative overflow-hidden rounded-2xl">
        <Photo src={image} alt={title} className="absolute inset-0" priority />
        <div className="relative bg-brand/65 p-8 text-white md:p-14"><h1 className="text-3xl font-bold md:text-4xl">{title}</h1><p className="mt-3 max-w-2xl text-white/90">{intro}</p></div>
      </div>
      <div className="mt-8 grid gap-8 md:grid-cols-[minmax(0,1fr)_400px]">
        <div>
          <ul className="space-y-2">{points.map(p => <li key={p} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-ok" />{p}</li>)}</ul>
          <h2 className="mb-3 mt-8 text-xl font-bold">Địa điểm gợi ý</h2>
          <div className="grid gap-3 sm:grid-cols-2">{venues.map(v => <Card key={v.name} className="p-4"><p className="font-semibold">{v.name}</p><p className="text-sm text-muted-foreground">{v.desc}</p></Card>)}</div>
        </div>
        <Card className="h-fit p-5">
          {sent ? (
            <div className="py-8 text-center"><CheckCircle2 className="mx-auto size-12 text-ok" /><p className="mt-3 font-semibold">Đã gửi yêu cầu báo giá</p><p className="mt-1 text-sm text-muted-foreground">Đội Sales sẽ liên hệ trong 24h (giả lập). Yêu cầu đã vào danh sách lead trong Admin › Content.</p><Button variant="secondary" className="mt-4" onClick={() => setSent(false)}>Gửi yêu cầu khác</Button></div>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <h2 className="text-lg font-bold">Yêu cầu báo giá</h2>
              <Field label="Họ tên / Công ty"><Input required value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Điện thoại"><Input required type="tel" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} /></Field>
                <Field label="Email"><Input required type="email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} /></Field>
                <Field label="Ngày dự kiến"><Input required type="date" min={TODAY} value={f.date} onChange={e => setF({ ...f, date: e.target.value })} /></Field>
                <Field label="Số khách"><Input required type="number" min={10} value={f.guests} onChange={e => setF({ ...f, guests: Number(e.target.value) })} /></Field>
              </div>
              <Field label="Yêu cầu"><Textarea value={f.note} onChange={e => setF({ ...f, note: e.target.value })} /></Field>
              <Button type="submit" className="w-full" disabled={busy}>{busy ? 'Đang gửi…' : 'Gửi yêu cầu'}</Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}

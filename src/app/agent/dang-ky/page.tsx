'use client'
import Link from 'next/link'
import { useState } from 'react'
import { Clock } from 'lucide-react'
import { repo } from '@/lib/repo'
import { Button, Card, Field, Input, PageTitle, Textarea } from '@/components/ui'

export default function AgentRegister() {
  const [f, setF] = useState({ company: '', tax_code: '', contact: '', phone: '', email: '', address: '', note: '' })
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value })
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    await repo.registerAgent(f)
    setBusy(false)
    setDone(true)
  }
  if (done) return (
    <Card className="mx-auto max-w-lg p-8 text-center">
      <Clock className="mx-auto size-12 text-warn" />
      <h1 className="mt-3 text-xl font-bold">Hồ sơ đang chờ duyệt</h1>
      <p className="mt-2 text-sm text-muted">{f.company} đã gửi hồ sơ hợp tác. Trạng thái: <b className="text-warn">Chờ duyệt</b>. Demo: chuyển vai trò sang <b>Lãnh đạo</b> → Admin › Agents / B2B để duyệt.</p>
      <Link href="/agent" className="mt-4 inline-block text-sm font-medium text-primary underline">Về trang đăng nhập</Link>
    </Card>
  )
  return (
    <div className="mx-auto max-w-2xl">
      <PageTitle title="Đăng ký hợp tác đại lý" sub="Rooty duyệt trong 1–2 ngày làm việc và cấp tài khoản Agent Portal." />
      <Card className="p-5">
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <Field label="Tên công ty *" className="sm:col-span-2"><Input required value={f.company} onChange={set('company')} /></Field>
          <Field label="Mã số thuế *" hint="10 số"><Input required pattern="\d{10}(-\d{3})?" inputMode="numeric" value={f.tax_code} onChange={set('tax_code')} /></Field>
          <Field label="Người liên hệ *"><Input required value={f.contact} onChange={set('contact')} /></Field>
          <Field label="Điện thoại *"><Input required type="tel" value={f.phone} onChange={set('phone')} /></Field>
          <Field label="Email *"><Input required type="email" value={f.email} onChange={set('email')} /></Field>
          <Field label="Địa chỉ" className="sm:col-span-2"><Input value={f.address} onChange={set('address')} /></Field>
          <Field label="Thị trường / sản lượng dự kiến" className="sm:col-span-2"><Textarea value={f.note} onChange={set('note')} placeholder="VD: khách Hàn Quốc, ~40 room nights/tháng" /></Field>
          <div className="sm:col-span-2"><Button type="submit" disabled={busy} className="w-full">{busy ? 'Đang gửi…' : 'Gửi hồ sơ'}</Button></div>
        </form>
      </Card>
    </div>
  )
}

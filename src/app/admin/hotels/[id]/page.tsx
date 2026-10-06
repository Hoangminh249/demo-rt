'use client'
import Link from 'next/link'
import { use, useState } from 'react'
import { repo } from '@/lib/repo'
import type { Hotel } from '@/lib/types'
import { useAsync } from '@/store/provider'
import { useAdmin } from '@/components/admin/use-admin'
import { Breadcrumb, Button, Card, Empty, Field, Input, PageTitle, SkeletonList, Textarea } from '@/components/ui'
import { toast } from '@/components/ui/overlay'

function HotelForm({ h, canEdit }: { h: Hotel; canEdit: boolean }) {
  const [f, setF] = useState({ name: h.name, tagline: h.tagline, description: h.description, phone: h.phone, email: h.email, address: h.address, policies: h.policies })
  const pol = (k: keyof Hotel['policies']) => (e: React.ChangeEvent<HTMLTextAreaElement>) => setF({ ...f, policies: { ...f.policies, [k]: e.target.value } })
  async function save(e: React.FormEvent) {
    e.preventDefault()
    await repo.saveHotel(h.id, f)
    toast('Đã lưu (giả lập) — trang khách sạn cập nhật ngay')
  }
  return (
    <form onSubmit={save} className="space-y-4">
      <Card className="grid gap-3 p-5 sm:grid-cols-2">
        <Field label="Tên khách sạn"><Input disabled={!canEdit} value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Khẩu hiệu"><Input disabled={!canEdit} value={f.tagline} onChange={e => setF({ ...f, tagline: e.target.value })} /></Field>
        <Field label="Mô tả" className="sm:col-span-2"><Textarea rows={4} disabled={!canEdit} value={f.description} onChange={e => setF({ ...f, description: e.target.value })} /></Field>
        <Field label="Địa chỉ" className="sm:col-span-2"><Input disabled={!canEdit} value={f.address} onChange={e => setF({ ...f, address: e.target.value })} /></Field>
        <Field label="Điện thoại"><Input disabled={!canEdit} value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} /></Field>
        <Field label="Email"><Input disabled={!canEdit} value={f.email} onChange={e => setF({ ...f, email: e.target.value })} /></Field>
      </Card>
      <Card className="grid gap-3 p-5 sm:grid-cols-2">
        <p className="font-semibold sm:col-span-2">Chính sách <span className="text-xs font-normal text-muted-foreground">(Gohost API không có chính sách huỷ → Rooty giữ ở CMS)</span></p>
        <Field label="Nhận phòng"><Textarea rows={2} disabled={!canEdit} value={f.policies.checkin} onChange={pol('checkin')} /></Field>
        <Field label="Trả phòng"><Textarea rows={2} disabled={!canEdit} value={f.policies.checkout} onChange={pol('checkout')} /></Field>
        <Field label="Huỷ phòng"><Textarea rows={3} disabled={!canEdit} value={f.policies.cancel} onChange={pol('cancel')} /></Field>
        <Field label="Trẻ em"><Textarea rows={3} disabled={!canEdit} value={f.policies.children} onChange={pol('children')} /></Field>
        <Field label="Thú cưng"><Textarea rows={2} disabled={!canEdit} value={f.policies.pets} onChange={pol('pets')} /></Field>
      </Card>
      {canEdit && <Button type="submit">Lưu thay đổi</Button>}
    </form>
  )
}

export default function HotelEdit({ params }: PageProps<'/admin/hotels/[id]'>) {
  const { id } = use(params)
  const a = useAdmin()
  const hotels = useAsync(() => repo.listHotels(), [])
  const h = hotels.data?.find(x => x.id === id)
  if (!hotels.data) return <SkeletonList />
  if (!h || (a.locked && a.locked !== id)) return <Empty title="Không có quyền hoặc không tìm thấy khách sạn" />
  return (
    <div className="max-w-4xl">
      <Breadcrumb items={[{ label: 'Hotels', href: '/admin/hotels' }, { label: h.name }]} />
      <PageTitle title={h.name} sub={<>Trang công khai: <Link href={`/${h.slug}`} target="_blank" className="text-primary underline">rootyhospitality.com/{h.slug}</Link></>} />
      <HotelForm key={h.id} h={h} canEdit={a.can('hotels', 'full')} />
    </div>
  )
}

'use client'
import Link from 'next/link'
import { useState } from 'react'
import { Plus, Pencil, ExternalLink } from 'lucide-react'
import { repo } from '@/lib/repo'
import type { Promotion, PromoType } from '@/lib/types'
import { useAsync } from '@/store/provider'
import { useAdmin } from '@/components/admin/use-admin'
import { fmtDate, TODAY } from '@/lib/format'
import { Badge, Button, Field, Input, PageTitle, Select, SkeletonList, Table, Textarea } from '@/components/ui'
import { Dialog, toast } from '@/components/ui/overlay'

const TYPES: Record<PromoType, string> = { 'early-bird': 'Early Bird', 'stay-longer': 'Stay Longer', family: 'Family', honeymoon: 'Honeymoon', package: 'Package' }

function PromoForm({ p, onSave }: { p: Promotion; onSave: (p: Promotion) => void }) {
  const [f, setF] = useState(p)
  const hotels = repo.hotelsSync()
  const num = (v: string) => (v === '' ? undefined : Number(v))
  return (
    <form id="promo-form" onSubmit={e => { e.preventDefault(); onSave(f) }} className="grid gap-3 sm:grid-cols-2">
      <Field label="Tên ưu đãi" className="sm:col-span-2"><Input required value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></Field>
      <Field label="Loại"><Select value={f.type} onChange={e => setF({ ...f, type: e.target.value as PromoType })}>{Object.entries(TYPES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select></Field>
      <Field label="Giảm (%)"><Input type="number" min={1} max={50} value={f.discount_pct} onChange={e => setF({ ...f, discount_pct: Number(e.target.value) })} /></Field>
      <Field label="Đặt trước tối thiểu (ngày)"><Input type="number" min={0} value={f.min_advance_days ?? ''} onChange={e => setF({ ...f, min_advance_days: num(e.target.value) })} /></Field>
      <Field label="Số đêm tối thiểu"><Input type="number" min={0} value={f.min_nights ?? ''} onChange={e => setF({ ...f, min_nights: num(e.target.value) })} /></Field>
      <Field label="Hiệu lực từ"><Input type="date" value={f.valid_from} onChange={e => setF({ ...f, valid_from: e.target.value })} /></Field>
      <Field label="Đến"><Input type="date" value={f.valid_to} onChange={e => setF({ ...f, valid_to: e.target.value })} /></Field>
      <Field label="Mô tả ngắn" className="sm:col-span-2"><Textarea value={f.summary} onChange={e => setF({ ...f, summary: e.target.value })} /></Field>
      <fieldset className="sm:col-span-2">
        <legend className="mb-1 text-sm font-medium">Khách sạn áp dụng</legend>
        <label className="mr-4 inline-flex items-center gap-2 text-sm"><input type="checkbox" className="accent-[var(--primary)]" checked={f.hotel_ids === 'all'} onChange={e => setF({ ...f, hotel_ids: e.target.checked ? 'all' : [] })} />Tất cả</label>
        {f.hotel_ids !== 'all' && hotels.map(h => (
          <label key={h.id} className="mr-4 inline-flex items-center gap-2 text-sm">
            <input type="checkbox" className="accent-[var(--primary)]" checked={(f.hotel_ids as string[]).includes(h.id)} onChange={e => setF({ ...f, hotel_ids: e.target.checked ? [...(f.hotel_ids as string[]), h.id] : (f.hotel_ids as string[]).filter(x => x !== h.id) })} />{h.name}
          </label>
        ))}
      </fieldset>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-[var(--primary)]" checked={f.active} onChange={e => setF({ ...f, active: e.target.checked })} />Đang bật</label>
    </form>
  )
}

export default function PromotionsAdmin() {
  const a = useAdmin()
  const list = useAsync(() => repo.listPromotions({ all: true }), [])
  const [edit, setEdit] = useState<Promotion | null>(null)
  const canEdit = a.can('promotions', 'full')
  const blank = (): Promotion => ({ id: repo.newPromotionId(), slug: `uu-dai-${Date.now() % 10000}`, type: 'early-bird', name: '', summary: '', description: '', perks: [], discount_pct: 10, valid_from: TODAY, valid_to: '2026-12-31', hotel_ids: 'all', active: true, image: '/images/offers/early-bird.jpg' })
  async function save(p: Promotion) {
    await repo.savePromotion({ ...p, description: p.description || p.summary })
    setEdit(null)
    toast(`Đã lưu ưu đãi "${p.name}" — áp dụng ngay khi tính giá trên website`)
  }
  const live = (p: Promotion) => p.active && p.valid_from <= TODAY && TODAY <= p.valid_to
  return (
    <>
      <PageTitle title="Promotions" sub="Ưu đãi tự áp dụng khi khách đủ điều kiện (không cộng dồn, chọn mức giảm cao nhất)">
        <div className="flex gap-2">
          <Link href="/uu-dai" target="_blank" className="inline-flex h-10 items-center gap-1 rounded-lg border border-border px-4 text-sm font-semibold hover:bg-muted">Xem trên website <ExternalLink className="size-3.5" /></Link>
          {canEdit && <Button onClick={() => setEdit(blank())}><Plus className="size-4" /> Tạo ưu đãi</Button>}
        </div>
      </PageTitle>
      {!list.data ? <SkeletonList /> : (
        <Table>
          <thead><tr><th>Ưu đãi</th><th>Loại</th><th className="text-right">Giảm</th><th>Điều kiện</th><th>Hiệu lực</th><th>KS</th><th>Trạng thái</th><th /></tr></thead>
          <tbody>{list.data.map(p => (
            <tr key={p.id}>
              <td className="font-medium">{p.name}</td>
              <td>{TYPES[p.type]}</td>
              <td className="text-right">{p.discount_pct}%</td>
              <td className="text-xs text-muted-foreground">{[p.min_advance_days && `trước ≥${p.min_advance_days} ngày`, p.min_nights && `≥${p.min_nights} đêm`, p.min_children && `≥${p.min_children} trẻ em`, p.needs_code && 'khách chọn', p.needs_addons && 'kèm xe + tour'].filter(Boolean).join(' · ') || '—'}</td>
              <td className="whitespace-nowrap text-xs">{fmtDate(p.valid_from)} – {fmtDate(p.valid_to)}</td>
              <td className="text-xs">{p.hotel_ids === 'all' ? 'Tất cả' : `${p.hotel_ids.length} KS`}</td>
              <td>{live(p) ? <Badge tone="ok">Đang hiển thị</Badge> : p.active ? <Badge tone="warn">Chưa tới hạn</Badge> : <Badge>Tắt</Badge>}</td>
              <td>{canEdit && <Button size="sm" variant="ghost" onClick={() => setEdit(p)} aria-label={`Sửa ${p.name}`}><Pencil className="size-4" /></Button>}</td>
            </tr>
          ))}</tbody>
        </Table>
      )}
      <Dialog open={!!edit} onClose={() => setEdit(null)} title={edit?.name ? `Sửa: ${edit.name}` : 'Tạo ưu đãi'} wide
        footer={<><Button variant="secondary" onClick={() => setEdit(null)}>Huỷ</Button><Button type="submit" form="promo-form">Lưu</Button></>}>
        {edit && <PromoForm key={edit.id} p={edit} onSave={save} />}
      </Dialog>
    </>
  )
}

'use client'
// Trang admin sản phẩm dùng chung nhiều khách sạn (Postgres): thêm khách sạn, khuyến mãi, thư viện tiện ích, người dùng (chỉ xem).
import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge, CARD, Empty, Skel, vnd } from '@/components/admin/ui'
import { Field, INPUT, LInput, Notice } from '@/components/admin/form'
import { adminErrorText, useAdminAmenities, useAdminPromotions, useAdminUsers, useAdminWrite } from '@/hooks/use-admin'
import { ICON_KEYS } from '@/lib/catalog-commands'
import type { AdminAmenity, AdminPromotion, AdminPromotions } from '@/types/admin'
import { DbFailed } from './rates'

function Result({ w }: { w: ReturnType<typeof useAdminWrite> }) {
  if (w.isSuccess) return <Notice ok>{w.data.message}</Notice>
  if (w.isError) return <Notice ok={false}>{adminErrorText(w.error)}</Notice>
  return null
}
const Loading = () => <div className={`${CARD} grid gap-3 p-5`}>{[0, 1, 2, 3].map(i => <Skel key={i} className="h-12" />)}</div>

function Row({ summary, children }: { summary: React.ReactNode; children: React.ReactNode }) {
  return (
    <details className="group">
      <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 px-5 py-2.5 hover:bg-item-hover [&::-webkit-details-marker]:hidden">
        <div className="min-w-0 flex-1">{summary}</div><ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="border-t border-border bg-muted/40 px-5 py-4">{children}</div>
    </details>
  )
}

// ---------- Thêm khách sạn ----------

export function NewHotelView() {
  const router = useRouter()
  const write = useAdminWrite()
  const [v, setV] = useState({ name: '', slug: '', code: '' })
  const slugify = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  function submit(e: FormEvent) {
    e.preventDefault()
    write.mutate({ op: 'hotel.create', ...v }, { onSuccess: () => router.push(`/admin/hotels/${v.slug}?tab=thong-tin`) })
  }
  return (
    <div className="max-w-xl">
      <h1 className="text-lg font-semibold">Thêm khách sạn</h1>
      <p className="mt-1 text-sm text-muted-foreground">Tạo ở trạng thái nháp (chưa hiện trên web). Sau đó điền thông tin, ảnh, hạng phòng, gói giá và mở lịch bán.</p>
      <form onSubmit={submit} className={`${CARD} mt-5 grid gap-4 p-5`}>
        <Field label="Tên khách sạn"><input required value={v.name} onChange={e => setV({ ...v, name: e.target.value, slug: v.slug || slugify(e.target.value) })} className={INPUT} /></Field>
        <Field label="Đường dẫn (slug)" hint={`rootyhospitality.com/hotel/${v.slug || '…'} — chữ thường không dấu, gạch nối. Đổi được tới khi mở bán.`}>
          <input required value={v.slug} onChange={e => setV({ ...v, slug: slugify(e.target.value) })} className={INPUT} />
        </Field>
        <Field label="Mã khách sạn" hint="2–12 chữ in hoa / số, dùng trong mã đặt phòng (RH-MÃ-…)"><input required value={v.code} onChange={e => setV({ ...v, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })} className={INPUT} /></Field>
        <Result w={write} />
        <Button type="submit" disabled={write.isPending} className="h-11">Tạo khách sạn</Button>
      </form>
    </div>
  )
}

// ---------- Khuyến mãi ----------

type PromoDraft = Omit<AdminPromotion, 'id' | 'used'> & { id?: string }
const EMPTY_PROMO: PromoDraft = { code: '', name: { vi: '' }, type: 'PERCENT', value: 10, hotelId: null, ratePlanId: null, bookStart: null, bookEnd: null, stayStart: null, stayEnd: null, minNights: 1, maxRedemptions: null, perUserLimit: 1, active: true }

function PromoForm({ p, ctx }: { p: PromoDraft; ctx: AdminPromotions }) {
  const write = useAdminWrite()
  const [x, setX] = useState(p)
  const set = <K extends keyof PromoDraft>(k: K, v: PromoDraft[K]) => setX(o => ({ ...o, [k]: v }))
  const d = (k: 'bookStart' | 'bookEnd' | 'stayStart' | 'stayEnd', label: string) => <Field label={label}><input type="date" value={x[k] ?? ''} onChange={e => set(k, e.target.value || null)} className={INPUT} /></Field>
  const n = (k: 'maxRedemptions' | 'perUserLimit', label: string) => <Field label={label} hint="Bỏ trống = không giới hạn"><input type="number" min={1} value={x[k] ?? ''} onChange={e => set(k, e.target.value ? Number(e.target.value) : null)} className={INPUT} /></Field>
  return (
    <form className="grid gap-4" onSubmit={e => { e.preventDefault(); write.mutate({ op: 'promotion.save', ...x, code: x.code.toUpperCase() }) }}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Mã" hint="Khách nhập ở bước đặt phòng"><input required value={x.code} onChange={e => set('code', e.target.value.toUpperCase())} className={INPUT} /></Field>
        <Field label="Loại"><select value={x.type} onChange={e => set('type', e.target.value as PromoDraft['type'])} className={INPUT}><option value="PERCENT">Giảm % tiền phòng</option><option value="FIXED">Giảm số tiền (VND)</option></select></Field>
        <Field label="Giá trị"><input type="number" required min={1} value={x.value} onChange={e => set('value', Number(e.target.value) || 0)} className={INPUT} /></Field>
        <Field label="Ở tối thiểu (đêm)"><input type="number" min={1} value={x.minNights} onChange={e => set('minNights', Number(e.target.value) || 1)} className={INPUT} /></Field>
        <Field label="Khách sạn"><select value={x.hotelId ?? ''} onChange={e => setX({ ...x, hotelId: e.target.value || null, ratePlanId: null })} className={INPUT}><option value="">Mọi khách sạn</option>{ctx.hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}</select></Field>
        <Field label="Gói giá" className="lg:col-span-3"><select value={x.ratePlanId ?? ''} onChange={e => set('ratePlanId', e.target.value || null)} className={INPUT}><option value="">Mọi gói</option>{ctx.ratePlans.filter(r => !x.hotelId || r.hotelId === x.hotelId).map(r => <option key={r.id} value={r.id}>{r.label}</option>)}</select></Field>
        {d('bookStart', 'Đặt từ ngày')}{d('bookEnd', 'Đặt đến ngày')}{d('stayStart', 'Ở từ đêm')}{d('stayEnd', 'Ở đến đêm')}
        {n('maxRedemptions', 'Tổng lượt dùng')}{n('perUserLimit', 'Lượt / khách')}
        <label className="flex h-10 items-center gap-2 self-end text-sm"><input type="checkbox" checked={x.active} onChange={e => set('active', e.target.checked)} className="size-4" />Đang bật</label>
      </div>
      <LInput label="Tên hiện cho khách" value={x.name} onChange={v => set('name', v)} required />
      <Result w={write} />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={write.isPending}>{x.id ? 'Lưu khuyến mãi' : 'Tạo khuyến mãi'}</Button>
        {x.id && <Button type="button" variant="outline" className="text-red-700" onClick={() => confirm(`Xoá mã ${x.code}? Mã đã dùng thì chỉ tắt.`) && write.mutate({ op: 'promotion.delete', id: x.id! })}><Trash2 aria-hidden />Xoá</Button>}
      </div>
    </form>
  )
}

export function PromotionsView() {
  const q = useAdminPromotions()
  if (q.isPending) return <Loading />
  if (q.isError || !q.data) return <DbFailed error={q.error} onRetry={() => q.refetch()} />
  const hotelName = (id: string | null) => (id ? q.data.hotels.find(h => h.id === id)?.name ?? '—' : 'Mọi khách sạn')
  return (
    <section className={`${CARD} max-w-site overflow-hidden`}>
      <div className="px-5 pt-5 pb-3"><h2 className="text-sm font-semibold">Mã khuyến mãi</h2><p className="mt-0.5 text-xs text-muted-foreground">Server kiểm điều kiện và tính lại khi khách nhập mã. Mọi đêm phải nằm trong khoảng “Ở từ / đến”.</p></div>
      <div className="divide-y divide-border border-t border-border">
        {q.data.items.map(p => (
          <Row key={p.id} summary={
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span className="font-mono font-semibold">{p.code}</span>
              <span>{p.type === 'PERCENT' ? `−${p.value}%` : `−${vnd(p.value)}`}</span>
              <Badge tone={p.active ? 'ok' : 'neutral'}>{p.active ? 'Đang bật' : 'Tắt'}</Badge>
              <span className="text-xs text-muted-foreground">{hotelName(p.hotelId)} · đã dùng {p.used}{p.maxRedemptions ? `/${p.maxRedemptions}` : ''}</span>
            </div>
          }><PromoForm key={JSON.stringify(p)} p={p} ctx={q.data} /></Row>
        ))}
        {!q.data.items.length && <Empty>Chưa có mã khuyến mãi.</Empty>}
        <Row summary={<span className="text-sm font-medium text-primary">+ Thêm mã khuyến mãi</span>}><PromoForm key={`new-${q.data.items.length}`} p={EMPTY_PROMO} ctx={q.data} /></Row>
      </div>
    </section>
  )
}

// ---------- Tiện ích ----------

function AmenityForm({ a }: { a: Partial<AdminAmenity> }) {
  const write = useAdminWrite()
  const [x, setX] = useState({ code: a.code ?? '', name: a.name ?? { vi: '' }, icon: a.icon ?? null })
  return (
    <form className="grid gap-3" onSubmit={e => { e.preventDefault(); write.mutate({ op: 'amenity.save', id: a.id, code: x.code, name: x.name, icon: (x.icon as (typeof ICON_KEYS)[number] | null) || null }) }}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Mã" hint="chữ thường, gạch nối"><input required value={x.code} onChange={e => setX({ ...x, code: e.target.value })} className={INPUT} /></Field>
        <Field label="Icon"><select value={x.icon ?? ''} onChange={e => setX({ ...x, icon: e.target.value || null })} className={INPUT}><option value="">(không icon)</option>{ICON_KEYS.map(k => <option key={k}>{k}</option>)}</select></Field>
      </div>
      <LInput label="Tên" value={x.name} onChange={v => setX({ ...x, name: v })} required />
      <Result w={write} />
      <div className="flex gap-2">
        <Button type="submit" disabled={write.isPending}>{a.id ? 'Lưu' : 'Thêm tiện ích'}</Button>
        {a.id && <Button type="button" variant="outline" className="text-red-700" onClick={() => confirm(`Xoá tiện ích này khỏi thư viện và mọi khách sạn (${a.used} chỗ dùng)?`) && write.mutate({ op: 'amenity.delete', id: a.id! })}><Trash2 aria-hidden />Xoá</Button>}
      </div>
    </form>
  )
}

export function AmenitiesView() {
  const q = useAdminAmenities()
  if (q.isPending) return <Loading />
  if (q.isError || !q.data) return <DbFailed error={q.error} onRetry={() => q.refetch()} />
  return (
    <section className={`${CARD} max-w-site overflow-hidden`}>
      <div className="px-5 pt-5 pb-3"><h2 className="text-sm font-semibold">Thư viện tiện ích</h2><p className="mt-0.5 text-xs text-muted-foreground">Gán cho từng khách sạn ở trang khách sạn → tab Thông tin.</p></div>
      <div className="divide-y divide-border border-t border-border">
        {q.data.map(a => (
          <Row key={a.id} summary={<div className="flex flex-wrap items-center gap-x-3 text-sm"><span className="font-medium">{a.name.vi}</span><span className="text-xs text-muted-foreground">{a.code}{a.icon ? ` · ${a.icon}` : ''} · {a.used} chỗ dùng</span></div>}>
            <AmenityForm key={JSON.stringify(a)} a={a} />
          </Row>
        ))}
        <Row summary={<span className="text-sm font-medium text-primary">+ Thêm tiện ích</span>}><AmenityForm key={`new-${q.data.length}`} a={{}} /></Row>
      </div>
    </section>
  )
}

// ---------- Người dùng ----------

const ROLE = { ADMIN: ['Quản trị', 'ok'], STAFF: ['Nhân viên', 'warn'], CUSTOMER: ['Khách', 'neutral'] } as const

export function UsersView() {
  const q = useAdminUsers()
  const [filter, setFilter] = useState('')
  if (q.isPending) return <Loading />
  if (q.isError || !q.data) return <DbFailed error={q.error} onRetry={() => q.refetch()} />
  const rows = q.data.filter(u => !filter || `${u.email} ${u.name}`.toLowerCase().includes(filter.toLowerCase()))
  return (
    <section className={`${CARD} max-w-site overflow-hidden`}>
      <div className="flex flex-wrap items-end justify-between gap-3 px-5 pt-5 pb-3">
        <div><h2 className="text-sm font-semibold">Người dùng <span className="font-normal text-muted-foreground tabular-nums">· {q.data.length}</span></h2>
          <p className="mt-0.5 text-xs text-pretty text-muted-foreground">Chỉ xem. Đổi quyền chạy SQL: UPDATE &quot;User&quot; SET role=&apos;ADMIN&apos; (hoặc STAFF) WHERE email=&apos;…&apos;</p></div>
        <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Tìm email / tên" aria-label="Tìm người dùng" className={`${INPUT} w-64`} />
      </div>
      <div className="overflow-x-auto border-t border-border">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs text-muted-foreground"><tr><th className="px-5 py-2.5 font-medium">Email</th><th className="px-3 py-2.5 font-medium">Tên</th><th className="px-3 py-2.5 font-medium">Quyền</th><th className="px-3 py-2.5 font-medium">Booking</th><th className="px-5 py-2.5 font-medium">Tạo lúc</th></tr></thead>
          <tbody className="divide-y divide-border">
            {rows.map(u => (
              <tr key={u.id}>
                <td className="px-5 py-2.5 font-medium">{u.email ?? '—'}</td>
                <td className="px-3 py-2.5">{u.name ?? '—'}</td>
                <td className="px-3 py-2.5"><Badge tone={ROLE[u.role][1]}>{ROLE[u.role][0]}</Badge></td>
                <td className="px-3 py-2.5 tabular-nums">{u.bookings}</td>
                <td className="px-5 py-2.5 whitespace-nowrap text-muted-foreground tabular-nums">{new Date(u.createdAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <Empty>Không có người dùng.</Empty>}
      </div>
    </section>
  )
}

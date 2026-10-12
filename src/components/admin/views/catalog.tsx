'use client'
// Sản phẩm của một khách sạn (Postgres, DATA_SOURCE=db): tab Thông tin (cơ bản + nội dung trang + tiện ích + thuế phí),
// tab Hạng phòng (thông số, phòng vật lý, ảnh), tab Ảnh (bộ ảnh + banner trang chủ). Lưu xong web thấy ngay (cache 'catalog').
import { useState, type FormEvent, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge, CARD, Empty, Skel } from '@/components/admin/ui'
import { Field, INPUT, JsonInput, LInput, ListEditor, Notice, type LValue } from '@/components/admin/form'
import { MediaSet } from '@/components/admin/media-picker'
import { adminErrorText, useAdminAmenities, useAdminHotelEdit, useAdminWrite } from '@/hooks/use-admin'
import { ICON_KEYS, STATUSES, type CatalogCommand } from '@/lib/catalog-commands'
import type { AdminHotelEdit, AdminRoomTypeEdit } from '@/types/admin'
import { DbFailed } from './rates'

const STATUS_TEXT = { DRAFT: 'Nháp', PUBLISHED: 'Đang bán', ARCHIVED: 'Lưu trữ' } as const
const statusTone = (s: keyof typeof STATUS_TEXT) => (s === 'PUBLISHED' ? 'ok' : s === 'DRAFT' ? 'warn' : 'neutral')
const L0 = (): LValue => ({ vi: '', en: '' })
const orNull = (s: string) => (s.trim() ? s.trim() : null)
const num = (s: string) => (s.trim() === '' ? null : Number(s))

function Card({ title, desc, children, footer }: { title: string; desc?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <section className={`${CARD} overflow-hidden`}>
      <div className="px-5 pt-5"><h3 className="text-sm font-semibold">{title}</h3>{desc && <p className="mt-0.5 text-xs text-pretty text-muted-foreground">{desc}</p>}</div>
      <div className="grid gap-4 p-5">{children}</div>
      {footer && <div className="flex flex-wrap items-center gap-3 border-t border-border bg-muted/40 px-5 py-3">{footer}</div>}
    </section>
  )
}

/** Kết quả lệnh ghi gần nhất (xanh / đỏ). */
function Result({ w }: { w: ReturnType<typeof useAdminWrite> }) {
  if (w.isSuccess) return <Notice ok>{w.data.message}</Notice>
  if (w.isError) return <Notice ok={false}>{adminErrorText(w.error)}</Notice>
  return null
}

export function useHotelEdit(slug: string) {
  const q = useAdminHotelEdit(slug)
  const loading = <div className={`${CARD} grid gap-3 p-5`}>{[0, 1, 2, 3].map(i => <Skel key={i} className="h-12" />)}</div>
  const failed = q.isError ? <DbFailed error={q.error} onRetry={() => q.refetch()} /> : null
  return { data: q.data, fallback: q.isPending ? loading : failed ?? (!q.data ? loading : null) }
}

// ---------- Tab Thông tin ----------

function BasicsAndContent({ data }: { data: AdminHotelEdit }) {
  const router = useRouter()
  const write = useAdminWrite()
  const [h, setH] = useState(data.hotel)
  const set = <K extends keyof typeof h>(k: K, v: (typeof h)[K]) => setH(x => ({ ...x, [k]: v }))
  const c = h.content
  const setC = <K extends keyof typeof c>(k: K, v: (typeof c)[K]) => setH(x => ({ ...x, content: { ...x.content, [k]: v } }))

  function save(e: FormEvent) {
    e.preventDefault()
    const cmd: CatalogCommand = {
      op: 'hotel.save', id: h.id, slug: h.slug.trim(), code: h.code.trim().toUpperCase(), name: h.name, status: h.status,
      area: h.area, address: h.address, mapQuery: h.mapQuery, lat: h.lat, lng: h.lng, stars: h.stars,
      checkInTime: h.checkInTime, checkOutTime: h.checkOutTime, phone: orNull(h.phone ?? ''), email: orNull(h.email ?? ''), zalo: orNull(h.zalo ?? ''),
      notifyEmail: orNull(h.notifyEmail ?? ''), operator: h.operator, openingDate: h.openingDate || null, gohostTenantId: orNull(h.gohostTenantId ?? ''),
      sortOrder: h.sortOrder, content: c,
    }
    write.mutate(cmd, { onSuccess: () => { if (h.slug !== data.hotel.slug) router.replace(`/admin/hotels/${h.slug}?tab=thong-tin`) } })
  }

  return (
    <form onSubmit={save} className="grid gap-4">
      <Card title="Thông tin cơ bản" desc="Đường dẫn rootyhospitality.com/hotel/{slug} — chỉ đổi được khi còn là nháp.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Tên khách sạn"><input required value={h.name} onChange={e => set('name', e.target.value)} className={INPUT} /></Field>
          <Field label="Mã" hint="Dùng trong mã đặt phòng RH-{mã}-…"><input required value={h.code} onChange={e => set('code', e.target.value.toUpperCase())} className={INPUT} /></Field>
          <Field label="Đường dẫn (slug)"><input required value={h.slug} disabled={data.hotel.status !== 'DRAFT'} onChange={e => set('slug', e.target.value)} className={INPUT} /></Field>
          <Field label="Trạng thái">
            <select value={h.status} onChange={e => set('status', e.target.value as typeof h.status)} className={INPUT}>{STATUSES.map(s => <option key={s} value={s}>{STATUS_TEXT[s]}</option>)}</select>
          </Field>
          <Field label="Nhận phòng từ"><input type="time" required value={h.checkInTime} onChange={e => set('checkInTime', e.target.value)} className={INPUT} /></Field>
          <Field label="Trả phòng trước"><input type="time" required value={h.checkOutTime} onChange={e => set('checkOutTime', e.target.value)} className={INPUT} /></Field>
          <Field label="Khai trương" hint="Ngày tương lai → chặn nhận phòng trước ngày này"><input type="date" value={h.openingDate ?? ''} onChange={e => set('openingDate', e.target.value || null)} className={INPUT} /></Field>
          <Field label="Hạng sao"><input type="number" min={1} max={5} value={h.stars ?? ''} onChange={e => set('stars', num(e.target.value))} className={INPUT} /></Field>
          <Field label="Điện thoại"><input value={h.phone ?? ''} onChange={e => set('phone', e.target.value)} className={INPUT} /></Field>
          <Field label="Email liên hệ"><input type="email" value={h.email ?? ''} onChange={e => set('email', e.target.value)} className={INPUT} /></Field>
          <Field label="Zalo (link)"><input type="url" value={h.zalo ?? ''} onChange={e => set('zalo', e.target.value)} placeholder="https://zalo.me/…" className={INPUT} /></Field>
          <Field label="Email nhận booking mới" hint="Lễ tân nhận email khi có booking"><input type="email" value={h.notifyEmail ?? ''} onChange={e => set('notifyEmail', e.target.value)} className={INPUT} /></Field>
          <Field label="Pháp nhân vận hành" className="sm:col-span-2"><input value={h.operator} onChange={e => set('operator', e.target.value)} className={INPUT} /></Field>
          <Field label="Ô tìm Google Maps" className="sm:col-span-2"><input value={h.mapQuery} onChange={e => set('mapQuery', e.target.value)} className={INPUT} /></Field>
          <Field label="Vĩ độ"><input type="number" step="any" value={h.lat ?? ''} onChange={e => set('lat', num(e.target.value))} className={INPUT} /></Field>
          <Field label="Kinh độ"><input type="number" step="any" value={h.lng ?? ''} onChange={e => set('lng', num(e.target.value))} className={INPUT} /></Field>
          <Field label="Gohost tenant ID" hint="Bỏ trống nếu không nối Gohost"><input value={h.gohostTenantId ?? ''} onChange={e => set('gohostTenantId', e.target.value)} className={INPUT} /></Field>
          <Field label="Thứ tự hiện"><input type="number" min={0} max={999} value={h.sortOrder} onChange={e => set('sortOrder', Number(e.target.value) || 0)} className={INPUT} /></Field>
        </div>
        <LInput label="Khu vực" value={h.area} onChange={v => set('area', v)} required />
        <LInput label="Địa chỉ" value={h.address} onChange={v => set('address', v)} required />
      </Card>

      <Card title="Nội dung trang khách sạn">
        <LInput label="Câu giới thiệu ngắn" value={c.tagline} onChange={v => setC('tagline', v)} />
        <LInput label="Mô tả" value={c.description} onChange={v => setC('description', v)} rows={5} />
        <ListEditor label="Điểm nổi bật" items={c.highlights} onChange={v => setC('highlights', v)} make={L0} addLabel="Thêm điểm nổi bật"
          render={(it, s) => <LInput label="Điểm nổi bật" value={it} onChange={s} required />} />
        <ListEditor label="Thông tin nhanh (icon · nhãn · nội dung)" items={c.facts} onChange={v => setC('facts', v)} make={() => ({ icon: 'map-pin' as const, label: L0(), value: L0() })}
          render={(it, s) => (
            <div className="grid gap-2">
              <select value={it.icon} aria-label="Icon" onChange={e => s({ ...it, icon: e.target.value as typeof it.icon })} className={`${INPUT} w-48`}>{ICON_KEYS.map(k => <option key={k}>{k}</option>)}</select>
              <LInput label="Nhãn" value={it.label} onChange={v => s({ ...it, label: v })} required />
              <LInput label="Nội dung" value={it.value} onChange={v => s({ ...it, value: v })} required />
            </div>
          )} />
        <ListEditor label="Chính sách (mục · nội dung) — 2 dòng đầu là Nhận phòng, Trả phòng" items={c.policies} onChange={v => setC('policies', v)} make={() => [L0(), L0()] as [LValue, LValue]}
          render={(it, s) => <div className="grid gap-2"><LInput label="Mục" value={it[0]} onChange={v => s([v, it[1]])} required /><LInput label="Nội dung" value={it[1]} onChange={v => s([it[0], v])} rows={2} required /></div>} />
        <LInput label="Tóm tắt chính sách huỷ (hiện dưới gói giá)" value={c.cancel_summary} onChange={v => setC('cancel_summary', v)} />
        <ListEditor label="Hỏi đáp" items={c.faq} onChange={v => setC('faq', v)} make={() => [L0(), L0()] as [LValue, LValue]}
          render={(it, s) => <div className="grid gap-2"><LInput label="Câu hỏi" value={it[0]} onChange={v => s([v, it[1]])} required /><LInput label="Trả lời" value={it[1]} onChange={v => s([it[0], v])} rows={3} required /></div>} />
      </Card>

      <Card title="Nâng cao" desc="Phần có bảng (đi lại, chính sách trẻ em) sửa dạng JSON cùng hình với src/content. Server kiểm lại khi lưu.">
        <JsonInput label="Đi lại (getting_here)" value={c.getting_here} onChange={v => setC('getting_here', v)} rows={12} />
        <JsonInput label="Bảng chính sách trẻ em (children) — null nếu không có" value={c.children} onChange={v => setC('children', v)} rows={8} />
        <Field label="Chỗ chờ khách sạn xác nhận (mỗi dòng một mục, chỉ admin thấy)">
          <textarea rows={3} value={c.pending.join('\n')} onChange={e => setC('pending', e.target.value.split('\n').filter(x => x.trim()))} className={`${INPUT} h-auto py-2`} />
        </Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={c.en_review} onChange={e => setC('en_review', e.target.checked)} className="size-4" />Bản tiếng Anh chờ Marketing duyệt</label>
      </Card>

      <div className="sticky bottom-0 z-10 grid gap-2 rounded-2xl border border-border bg-card/95 p-3 backdrop-blur">
        <Result w={write} />
        <Button type="submit" disabled={write.isPending} className="h-11">{write.isPending ? 'Đang lưu…' : 'Lưu thông tin & nội dung'}</Button>
      </div>
    </form>
  )
}

function Amenities({ data }: { data: AdminHotelEdit }) {
  const lib = useAdminAmenities()
  const write = useAdminWrite()
  const [items, setItems] = useState(data.amenities)
  const [pick, setPick] = useState('')
  const nameOf = (id: string) => lib.data?.find(a => a.id === id)?.name.vi ?? '…'
  const free = (lib.data ?? []).filter(a => !items.some(i => i.amenityId === a.id))
  return (
    <Card title="Tiện ích" desc="“Đã gồm trong giá” và “Không có” trên trang khách sạn. Thêm tiện ích mới ở menu Tiện ích."
      footer={<><Button type="button" disabled={write.isPending} onClick={() => write.mutate({ op: 'hotelAmenity.set', hotelId: data.hotel.id, items })}>Lưu tiện ích</Button><Result w={write} /></>}>
      <ListEditor label="Tiện ích của khách sạn" items={items} onChange={setItems} max={60}
        render={(it, s) => (
          <div className="grid gap-2">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <b>{nameOf(it.amenityId)}</b>
              <label className="flex items-center gap-1.5"><input type="radio" checked={it.available} onChange={() => s({ ...it, available: true })} />Có</label>
              <label className="flex items-center gap-1.5"><input type="radio" checked={!it.available} onChange={() => s({ ...it, available: false })} />Không có</label>
            </div>
            {it.available && <LInput label="Mô tả thêm" value={it.description} onChange={v => s({ ...it, description: v.vi || v.en ? v : null })} />}
          </div>
        )} />
      <div className="flex flex-wrap gap-2">
        <select value={pick} onChange={e => setPick(e.target.value)} aria-label="Chọn tiện ích để thêm" className={`${INPUT} w-auto min-w-56`}>
          <option value="">Chọn tiện ích để thêm…</option>
          {free.map(a => <option key={a.id} value={a.id}>{a.name.vi}</option>)}
        </select>
        <Button type="button" variant="outline" disabled={!pick} onClick={() => { setItems([...items, { amenityId: pick, available: true, description: null }]); setPick('') }}>Thêm</Button>
      </div>
    </Card>
  )
}

type TaxDraft = Omit<AdminHotelEdit['taxFees'][number], 'id'> & { id?: string }

function TaxRow({ t, hotelId, write }: { t: TaxDraft; hotelId: string; write: ReturnType<typeof useAdminWrite> }) {
    const [x, setX] = useState(t)
    return (
      <form onSubmit={e => { e.preventDefault(); write.mutate({ op: 'taxFee.save', hotelId, ...x, id: x.id }) }} className="grid gap-2 rounded-xl border border-border p-3">
        <LInput label="Tên" value={x.name} onChange={v => setX({ ...x, name: v })} required />
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Loại"><select value={x.type} onChange={e => setX({ ...x, type: e.target.value as typeof x.type })} className={`${INPUT} w-44`}><option value="PERCENT">% trên tiền phòng</option><option value="PER_NIGHT">VND / phòng / đêm</option><option value="PER_BOOKING">VND / booking</option></select></Field>
          <Field label="Giá trị"><input type="number" min={0} value={x.value} onChange={e => setX({ ...x, value: Number(e.target.value) || 0 })} className={`${INPUT} w-32`} /></Field>
          <label className="flex h-10 items-center gap-1.5 text-sm"><input type="checkbox" checked={x.included} onChange={e => setX({ ...x, included: e.target.checked })} />Đã gồm trong giá</label>
          <label className="flex h-10 items-center gap-1.5 text-sm"><input type="checkbox" checked={x.active} onChange={e => setX({ ...x, active: e.target.checked })} />Đang áp dụng</label>
          <Button type="submit" variant="outline" disabled={write.isPending}>{x.id ? 'Lưu' : 'Thêm'}</Button>
          {x.id && <Button type="button" variant="ghost" className="text-red-700" onClick={() => confirm('Xoá thuế / phí này?') && write.mutate({ op: 'taxFee.delete', id: x.id! })}><Trash2 aria-hidden />Xoá</Button>}
        </div>
      </form>
    )
}

function TaxFees({ data }: { data: AdminHotelEdit }) {
  const write = useAdminWrite()
  const blank: TaxDraft = { name: L0(), type: 'PERCENT', value: 8, included: true, active: true, sortOrder: data.taxFees.length }
  return (
    <Card title="Thuế & phí" desc="Đã gồm trong giá → chỉ hiện cho khách biết. Không gồm → cộng vào tổng khi đặt phòng.">
      {data.taxFees.map(t => <TaxRow key={t.id} t={t} hotelId={data.hotel.id} write={write} />)}
      <TaxRow key={`new-${data.taxFees.length}`} t={blank} hotelId={data.hotel.id} write={write} />
      <Result w={write} />
    </Card>
  )
}

function Danger({ data }: { data: AdminHotelEdit }) {
  const write = useAdminWrite()
  const router = useRouter()
  const has = data.hotel.bookings > 0
  return (
    <Card title="Xoá khách sạn" desc={has ? `Đã có ${data.hotel.bookings} booking → chỉ lưu trữ (ẩn khỏi web).` : 'Xoá hẳn khách sạn cùng hạng phòng, gói giá, lịch.'}
      footer={<><Button type="button" variant="outline" className="text-red-700" disabled={write.isPending}
        onClick={() => confirm(`${has ? 'Lưu trữ' : 'Xoá hẳn'} ${data.hotel.name}?`) && write.mutate({ op: 'hotel.delete', id: data.hotel.id }, { onSuccess: () => { if (!has) router.replace('/admin') } })}>
        <Trash2 aria-hidden />{has ? 'Lưu trữ khách sạn' : 'Xoá khách sạn'}</Button><Result w={write} /></>}>
      <span className="text-xs text-muted-foreground">Thao tác ghi vào nhật ký.</span>
    </Card>
  )
}

export function InfoPanel({ slug }: { slug: string }) {
  const { data, fallback } = useHotelEdit(slug)
  if (fallback || !data) return fallback
  return (
    <div className="grid gap-4">
      <BasicsAndContent key={JSON.stringify(data.hotel)} data={data} />
      <Amenities key={`a${JSON.stringify(data.amenities)}`} data={data} />
      <TaxFees key={`t${JSON.stringify(data.taxFees)}`} data={data} />
      <Danger data={data} />
    </div>
  )
}

// ---------- Tab Hạng phòng ----------

const EMPTY_ROOM_TYPE = (hotelId: string, n: number): Omit<AdminRoomTypeEdit, 'id' | 'rooms' | 'media' | 'bookings'> & { hotelId: string } => ({
  hotelId, slug: '', status: 'DRAFT', name: L0(), description: L0(), size: L0(), beds: null,
  maxAdults: 2, maxChildren: 1, maxOccupancy: 3, baseOccupancy: 2, totalRooms: 1, sortOrder: n, gohostRoomTypeId: null, content: { features: [] },
})

function RoomTypeForm({ hotelId, rt }: { hotelId: string; rt: Omit<AdminRoomTypeEdit, 'id' | 'rooms' | 'media' | 'bookings'> & { id?: string } }) {
  const write = useAdminWrite()
  const [r, setR] = useState(rt)
  const set = <K extends keyof typeof r>(k: K, v: (typeof r)[K]) => setR(x => ({ ...x, [k]: v }))
  const n = (k: 'maxAdults' | 'maxChildren' | 'maxOccupancy' | 'baseOccupancy' | 'totalRooms' | 'sortOrder', label: string, hint?: string) => (
    <Field label={label} hint={hint}><input type="number" min={0} value={r[k]} onChange={e => set(k, Number(e.target.value) || 0)} className={INPUT} /></Field>
  )
  return (
    <form className="grid gap-4" onSubmit={e => {
      e.preventDefault()
      write.mutate({
        op: 'roomType.save', id: r.id, hotelId, slug: r.slug.trim(), status: r.status, name: r.name, description: r.description, size: r.size,
        beds: r.beds?.vi ? r.beds : null, maxAdults: r.maxAdults, maxChildren: r.maxChildren, maxOccupancy: r.maxOccupancy, baseOccupancy: r.baseOccupancy,
        totalRooms: r.totalRooms, sortOrder: r.sortOrder, gohostRoomTypeId: orNull(r.gohostRoomTypeId ?? ''),
        content: { features: r.content.features, ...(r.content.view?.vi ? { view: r.content.view } : {}), ...(r.content.tagline?.vi ? { tagline: r.content.tagline } : {}), ...(r.content.note?.vi ? { note: r.content.note } : {}) },
      })
    }}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Đường dẫn (slug)" hint="vd superior, deluxe-bathtub"><input required value={r.slug} onChange={e => set('slug', e.target.value)} className={INPUT} /></Field>
        <Field label="Trạng thái"><select value={r.status} onChange={e => set('status', e.target.value as typeof r.status)} className={INPUT}>{STATUSES.map(s => <option key={s} value={s}>{STATUS_TEXT[s]}</option>)}</select></Field>
        {n('totalRooms', 'Tổng số phòng', 'Cả web và OTA')}
        {n('sortOrder', 'Thứ tự hiện')}
        {n('maxAdults', 'Người lớn tối đa')}
        {n('maxChildren', 'Trẻ em tối đa')}
        {n('maxOccupancy', 'Sức chứa tối đa')}
        {n('baseOccupancy', 'Số khách đã gồm trong giá', 'Vượt → phụ thu theo gói')}
        <Field label="Gohost room type ID" className="sm:col-span-2"><input value={r.gohostRoomTypeId ?? ''} onChange={e => set('gohostRoomTypeId', e.target.value)} className={INPUT} /></Field>
      </div>
      <LInput label="Tên hạng phòng" value={r.name} onChange={v => set('name', v)} required />
      <LInput label="Diện tích" value={r.size} onChange={v => set('size', v)} required hint="vd 19–22 m²" />
      <LInput label="Giường" value={r.beds} onChange={v => set('beds', v)} />
      <LInput label="Hướng nhìn" value={r.content.view} onChange={v => set('content', { ...r.content, view: v })} />
      <LInput label="Câu gợi tò mò trên thẻ phòng" value={r.content.tagline} onChange={v => set('content', { ...r.content, tagline: v })} />
      <LInput label="Mô tả" value={r.description} onChange={v => set('description', v)} rows={4} required />
      <LInput label="Lưu ý bắt buộc báo khách" value={r.content.note} onChange={v => set('content', { ...r.content, note: v })} rows={2} />
      <ListEditor label="Tiện nghi trong phòng" items={r.content.features} onChange={v => set('content', { ...r.content, features: v })} make={L0} addLabel="Thêm tiện nghi"
        render={(it, s) => <LInput label="Tiện nghi" value={it} onChange={s} required />} />
      <Result w={write} />
      <Button type="submit" disabled={write.isPending} className="h-11 w-fit">{r.id ? 'Lưu hạng phòng' : 'Tạo hạng phòng'}</Button>
    </form>
  )
}

function RoomRow({ room, rt, write }: { room?: AdminRoomTypeEdit['rooms'][number]; rt: AdminRoomTypeEdit; write: ReturnType<typeof useAdminWrite> }) {
    const [x, setX] = useState(room ?? { id: '', number: '', floor: null, note: null, active: true })
    return (
      <form onSubmit={e => { e.preventDefault(); write.mutate({ op: 'room.save', id: x.id || undefined, roomTypeId: rt.id, number: x.number, floor: x.floor, note: orNull(x.note ?? ''), active: x.active }) }}
        className="flex flex-wrap items-end gap-2">
        <Field label="Số phòng"><input required value={x.number} onChange={e => setX({ ...x, number: e.target.value })} className={`${INPUT} w-24`} /></Field>
        <Field label="Tầng"><input type="number" value={x.floor ?? ''} onChange={e => setX({ ...x, floor: num(e.target.value) })} className={`${INPUT} w-20`} /></Field>
        <Field label="Ghi chú" className="min-w-40 flex-1"><input value={x.note ?? ''} onChange={e => setX({ ...x, note: e.target.value })} className={INPUT} /></Field>
        <label className="flex h-10 items-center gap-1.5 text-sm"><input type="checkbox" checked={x.active} onChange={e => setX({ ...x, active: e.target.checked })} />Đang dùng</label>
        <Button type="submit" variant="outline" disabled={write.isPending}>{room ? 'Lưu' : 'Thêm phòng'}</Button>
        {room && <Button type="button" variant="ghost" className="text-red-700" aria-label={`Xoá phòng ${room.number}`} onClick={() => confirm(`Xoá phòng ${room.number}?`) && write.mutate({ op: 'room.delete', id: room.id })}><Trash2 aria-hidden /></Button>}
      </form>
    )
}

function Rooms({ rt }: { rt: AdminRoomTypeEdit }) {
  const write = useAdminWrite()
  return (
    <div className="grid gap-3">
      <h4 className="text-sm font-semibold">Phòng vật lý <span className="font-normal text-muted-foreground tabular-nums">· {rt.rooms.length} / {rt.totalRooms}</span></h4>
      {rt.rooms.map(room => <RoomRow key={room.id} room={room} rt={rt} write={write} />)}
      <RoomRow key={`new-${rt.rooms.length}`} rt={rt} write={write} />
      <Result w={write} />
    </div>
  )
}

function Details({ summary, children, open }: { summary: ReactNode; children: ReactNode; open?: boolean }) {
  return (
    <details className={`group ${CARD} overflow-hidden`} open={open}>
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-5 py-3 hover:bg-item-hover [&::-webkit-details-marker]:hidden">
        <div className="min-w-0 flex-1">{summary}</div><ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="grid gap-6 border-t border-border p-5">{children}</div>
    </details>
  )
}

export function RoomTypesPanel({ slug }: { slug: string }) {
  const { data, fallback } = useHotelEdit(slug)
  const write = useAdminWrite()
  if (fallback || !data) return fallback
  return (
    <div className="grid gap-3">
      {data.roomTypes.map(rt => (
        <Details key={rt.id} summary={
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="font-semibold">{rt.name.vi}</span><Badge tone={statusTone(rt.status)}>{STATUS_TEXT[rt.status]}</Badge>
            <span className="text-xs text-muted-foreground tabular-nums">{rt.slug} · {rt.totalRooms} phòng · {rt.media.length} ảnh{rt.bookings ? ` · ${rt.bookings} lượt đặt` : ''}</span>
          </div>
        }>
          <RoomTypeForm key={JSON.stringify(rt)} hotelId={data.hotel.id} rt={rt} />
          <Rooms rt={rt} />
          <MediaSet key={`m${JSON.stringify(rt.media)}`} title="Ảnh hạng phòng" target="roomType" targetId={rt.id} kind="ROOM" value={rt.media} />
          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
            <Button type="button" variant="outline" className="text-red-700" disabled={write.isPending}
              onClick={() => confirm(`${rt.bookings ? 'Lưu trữ' : 'Xoá hẳn'} hạng ${rt.name.vi}?`) && write.mutate({ op: 'roomType.delete', id: rt.id })}>
              <Trash2 aria-hidden />{rt.bookings ? 'Lưu trữ hạng phòng' : 'Xoá hạng phòng'}</Button>
            <Result w={write} />
          </div>
        </Details>
      ))}
      {!data.roomTypes.length && <section className={CARD}><Empty>Chưa có hạng phòng.</Empty></section>}
      <Details summary={<span className="text-sm font-medium text-primary">+ Thêm hạng phòng</span>}>
        <RoomTypeForm key={`new-${data.roomTypes.length}`} hotelId={data.hotel.id} rt={EMPTY_ROOM_TYPE(data.hotel.id, data.roomTypes.length)} />
      </Details>
    </div>
  )
}

// ---------- Tab Ảnh ----------

export function PhotosEditPanel({ slug }: { slug: string }) {
  const { data, fallback } = useHotelEdit(slug)
  if (fallback || !data) return fallback
  return (
    <div className="grid gap-4">
      <section className={`${CARD} p-5`}><MediaSet key={JSON.stringify(data.gallery)} title="Bộ ảnh khách sạn" hint="Thứ tự = thứ tự trên trang. Ảnh bìa dùng cho thẻ khách sạn và thẻ giá." target="hotel" targetId={data.hotel.id} kind="GALLERY" value={data.gallery} /></section>
      <section className={`${CARD} p-5`}><MediaSet key={JSON.stringify(data.hero)} title="Banner trang chủ" hint="Ảnh ngang; điểm lấy nét (object-position) để không cắt mất chủ thể, vd 50% 30%." target="hotel" targetId={data.hotel.id} kind="HERO" value={data.hero} /></section>
    </div>
  )
}

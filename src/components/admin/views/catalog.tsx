'use client'
// Sản phẩm của một khách sạn (Postgres, DATA_SOURCE=db). Mỗi tab có thanh mục con (?sec=) và một công tắc Tiếng Việt / English.
// · Thông tin khách sạn: Thông tin chung · Nội dung trang · Ảnh · Tiện ích · Thuế & phí
// · Hạng phòng: lưới thẻ → trang hạng phòng (?rt=) gồm Thông tin · Ảnh · Số phòng · Gói giá
// · Cài đặt (ráp ở views/hotel.tsx): TechPanel (đường dẫn, mã, toạ độ, Gohost, JSON) + DangerPanel
// Form lớn sửa trên bản nháp, thanh "Có thay đổi chưa lưu" dính đáy. Lưu xong web thấy ngay (cache 'catalog').
import { useState, type FormEvent, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, BedDouble, ChevronDown, ImageIcon, Plus, Trash2, Users } from 'lucide-react'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { Badge, CARD, Empty, Photo, Skel } from '@/components/admin/ui'
import { Card, Field, INPUT, JsonInput, LangCtx, LangSwitch, LInput, ListEditor, Notice, SaveBar, slugify, SubNav, type Lang, type LValue } from '@/components/admin/form'
import { MediaSet } from '@/components/admin/media-picker'
import { adminErrorText, useAdminAmenities, useAdminHotelEdit, useAdminPlans, useAdminWrite } from '@/hooks/use-admin'
import { ICON_KEYS, STATUSES } from '@/lib/catalog-commands'
import type { AdminHotelEdit, AdminRoomTypeEdit } from '@/types/admin'
import { DbFailed } from './rates'
import { RoomPlans } from './plans'

export const STATUS_TEXT = { DRAFT: 'Nháp', PUBLISHED: 'Đang bán', ARCHIVED: 'Lưu trữ' } as const
const STATUS_HINT = { DRAFT: 'Nháp — chưa hiện trên web', PUBLISHED: 'Đang bán — hiện trên web', ARCHIVED: 'Lưu trữ — ẩn khỏi web' } as const
export const statusTone = (s: keyof typeof STATUS_TEXT) => (s === 'PUBLISHED' ? 'ok' : s === 'DRAFT' ? 'warn' : 'neutral')
const ICON_TEXT: Record<(typeof ICON_KEYS)[number], string> = {
  'map-pin': 'Địa điểm', clock: 'Giờ', 'cable-car': 'Cáp treo', 'door-open': 'Cửa / nhận phòng', plane: 'Sân bay', bus: 'Xe buýt',
  'ferris-wheel': 'Vui chơi', coffee: 'Cà phê / ăn sáng', wifi: 'Wi-Fi', shirt: 'Giặt ủi', receipt: 'Hoá đơn', 'washing-machine': 'Máy giặt',
}
const L0 = (): LValue => ({ vi: '', en: '' })
const orNull = (s: string) => (s.trim() ? s.trim() : null)
const num = (s: string) => (s.trim() === '' ? null : Number(s))

type Write = ReturnType<typeof useAdminWrite>
const resultOf = (w: Write) => (w.isSuccess ? <Notice ok>{w.data.message}</Notice> : w.isError ? <Notice ok={false}>{adminErrorText(w.error)}</Notice> : null)

/** Chọn mục con: ?sec= hợp lệ, không thì `fallback`, không thì mục đầu. */
function useSec<T extends string>(items: readonly (readonly [T, string])[], fallback?: string | null): T {
  const s = useSearchParams().get('sec') ?? fallback
  return items.find(([id]) => id === s)?.[0] ?? items[0][0]
}

/** Khung tab có mục con: thanh mục bên trái (từ lg), nội dung bên phải; đầu nội dung là tên mục + công tắc ngôn ngữ (nếu mục có chữ 2 thứ tiếng). */
export function SectionLayout({ items, value, title, lang, setLang, children }: {
  items: readonly (readonly [string, string])[]; value: string; title: string; lang?: Lang; setLang?: (l: Lang) => void; children: ReactNode
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-6">
      <SubNav items={items} value={value} />
      <div className="grid min-w-0 content-start gap-4">
        <div className="flex min-h-9 flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold">{title}</h2>
          {lang && setLang && <LangSwitch value={lang} onChange={setLang} />}
        </div>
        <LangCtx value={lang ?? null}>{children}</LangCtx>
      </div>
    </div>
  )
}

export function useHotelEdit(slug: string) {
  const q = useAdminHotelEdit(slug)
  const loading = <div className={`${CARD} grid gap-3 p-5`}>{[0, 1, 2, 3].map(i => <Skel key={i} className="h-12" />)}</div>
  const failed = q.isError ? <DbFailed error={q.error} onRetry={() => q.refetch()} /> : null
  return { data: q.data, fallback: q.isPending ? loading : failed ?? (!q.data ? loading : null) }
}

// ---------- Form khách sạn (một lệnh hotel.save cho mọi mục) ----------

type HotelDraft = AdminHotelEdit['hotel']
type SetH = <K extends keyof HotelDraft>(k: K, v: HotelDraft[K]) => void
type SetC = <K extends keyof HotelDraft['content']>(k: K, v: HotelDraft['content'][K]) => void

/** Bản nháp của khách sạn: mỗi mục chỉ vẽ field của mình, lưu gửi cả bản ghi. Gắn key theo dữ liệu để tải lại sau khi lưu. */
function HotelForm({ data, write, children }: { data: AdminHotelEdit; write: Write; children: (h: HotelDraft, set: SetH, setC: SetC) => ReactNode }) {
  const router = useRouter()
  const [h, setH] = useState(data.hotel)
  const set: SetH = (k, v) => setH(x => ({ ...x, [k]: v }))
  const setC: SetC = (k, v) => setH(x => ({ ...x, content: { ...x.content, [k]: v } }))
  function save(e: FormEvent) {
    e.preventDefault()
    write.mutate({
      op: 'hotel.save', id: h.id, slug: h.slug.trim(), code: h.code.trim().toUpperCase(), name: h.name, status: h.status,
      area: h.area, address: h.address, mapQuery: h.mapQuery, lat: h.lat, lng: h.lng, stars: h.stars,
      checkInTime: h.checkInTime, checkOutTime: h.checkOutTime, phone: orNull(h.phone ?? ''), email: orNull(h.email ?? ''), zalo: orNull(h.zalo ?? ''),
      notifyEmail: orNull(h.notifyEmail ?? ''), operator: h.operator, openingDate: h.openingDate || null, gohostTenantId: orNull(h.gohostTenantId ?? ''),
      sortOrder: h.sortOrder, content: h.content,
    }, { onSuccess: () => { if (h.slug !== data.hotel.slug) router.replace(`/admin/hotels/${h.slug}?tab=cai-dat&sec=ky-thuat`) } })
  }
  return (
    <form onSubmit={save} className="grid gap-4">
      {children(h, set, setC)}
      <SaveBar dirty={JSON.stringify(h) !== JSON.stringify(data.hotel)} pending={write.isPending} onReset={() => setH(data.hotel)} result={resultOf(write)} />
    </form>
  )
}

function StatusSelect<S extends keyof typeof STATUS_TEXT>({ value, onChange }: { value: S; onChange: (s: S) => void }) {
  return (
    <Field label="Trạng thái">
      <select value={value} onChange={e => onChange(e.target.value as S)} className={INPUT}>{STATUSES.map(s => <option key={s} value={s}>{STATUS_HINT[s]}</option>)}</select>
    </Field>
  )
}

// ---------- Tab Thông tin khách sạn ----------

const INFO_SECS = [['chung', 'Thông tin chung'], ['noi-dung', 'Nội dung trang'], ['anh', 'Ảnh'], ['tien-ich', 'Tiện ích'], ['thue-phi', 'Thuế & phí']] as const

/** Hộp thư team nhận email booking (Hotel.notifyEmail, nhiều địa chỉ cách dấu phẩy) + báo khi nào (content.notify) + gửi thử. */
function TeamEmail({ h, set, setC, saved }: { h: HotelDraft; set: SetH; setC: SetC; saved: string | null }) {
  const test = useAdminWrite()
  const notify = h.content.notify ?? { booking: true, cancel: true }
  const dirty = (h.notifyEmail ?? '') !== (saved ?? '')
  return (
    <Card title="Email team nhận booking" desc="Mọi booking web của khách sạn này gửi về hộp thư này. Nên dùng hộp thư chung của team, không dùng email cá nhân.">
      <Field label="Hộp thư team" hint="Nhiều địa chỉ: cách nhau bằng dấu phẩy. Trả lời email báo booking là trả lời thẳng khách.">
        <div className="flex flex-wrap gap-2">
          <input value={h.notifyEmail ?? ''} onChange={e => set('notifyEmail', e.target.value)} placeholder="booking@…" className={`${INPUT} min-w-60 flex-1`} />
          <Button type="button" variant="outline" className="h-10" disabled={!saved || dirty || test.isPending} title={dirty ? 'Lưu trước rồi gửi thử' : undefined}
            onClick={() => test.mutate({ op: 'hotel.testNotify', id: h.id })}>{test.isPending ? 'Đang gửi…' : 'Gửi email thử'}</Button>
        </div>
      </Field>
      {resultOf(test)}
      <fieldset className="grid gap-2.5">
        <legend className="mb-2 text-sm font-medium">Báo khi</legend>
        <label className="flex items-center gap-2.5 text-sm"><input type="checkbox" checked={notify.booking} onChange={e => setC('notify', { ...notify, booking: e.target.checked })} className="size-4" />Có booking mới đã thanh toán</label>
        <label className="flex items-center gap-2.5 text-sm"><input type="checkbox" checked={notify.cancel} onChange={e => setC('notify', { ...notify, cancel: e.target.checked })} className="size-4" />Khách huỷ đặt phòng</label>
      </fieldset>
    </Card>
  )
}

function GeneralFields({ h, set, setC, savedEmail }: { h: HotelDraft; set: SetH; setC: SetC; savedEmail: string | null }) {
  return (
    <>
      <Card title="Giới thiệu">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Tên khách sạn"><input required value={h.name} onChange={e => set('name', e.target.value)} className={INPUT} /></Field>
          <StatusSelect value={h.status} onChange={s => set('status', s)} />
          <Field label="Hạng sao" hint="Bỏ trống nếu chưa xếp hạng"><input type="number" min={1} max={5} value={h.stars ?? ''} onChange={e => set('stars', num(e.target.value))} className={INPUT} /></Field>
          <Field label="Ngày khai trương" hint="Ngày tương lai → khách chỉ đặt được từ ngày này"><input type="date" value={h.openingDate ?? ''} onChange={e => set('openingDate', e.target.value || null)} className={INPUT} /></Field>
        </div>
        <LInput label="Khu vực" value={h.area} onChange={v => set('area', v)} required hint="vd Santo Port · Hòn Thơm" />
        <LInput label="Địa chỉ" value={h.address} onChange={v => set('address', v)} required />
      </Card>
      <Card title="Nhận & trả phòng">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nhận phòng từ"><input type="time" required value={h.checkInTime} onChange={e => set('checkInTime', e.target.value)} className={INPUT} /></Field>
          <Field label="Trả phòng trước"><input type="time" required value={h.checkOutTime} onChange={e => set('checkOutTime', e.target.value)} className={INPUT} /></Field>
        </div>
      </Card>
      <Card title="Liên hệ" desc="Hiện cho khách ở nút “Liên hệ đặt phòng” và trong email xác nhận.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Điện thoại"><input type="tel" value={h.phone ?? ''} onChange={e => set('phone', e.target.value)} className={INPUT} /></Field>
          <Field label="Email liên hệ"><input type="email" value={h.email ?? ''} onChange={e => set('email', e.target.value)} className={INPUT} /></Field>
          <Field label="Zalo (link)"><input type="url" value={h.zalo ?? ''} onChange={e => set('zalo', e.target.value)} placeholder="https://zalo.me/…" className={INPUT} /></Field>
        </div>
      </Card>
      <TeamEmail h={h} set={set} setC={setC} saved={savedEmail} />
    </>
  )
}

type Pair = [LValue, LValue]
function PairInput({ a, b, rows, it, set }: { a: string; b: string; rows: number; it: Pair; set: (v: Pair) => void }) {
  return <div className="grid gap-2"><LInput label={a} value={it[0]} onChange={v => set([v, it[1]])} required /><LInput label={b} value={it[1]} onChange={v => set([it[0], v])} rows={rows} required /></div>
}

function ContentFields({ c, setC }: { c: HotelDraft['content']; setC: SetC }) {
  return (
    <>
      <Card title="Giới thiệu">
        <LInput label="Câu giới thiệu ngắn" value={c.tagline} onChange={v => setC('tagline', v)} hint="Một câu dưới tên khách sạn" />
        <LInput label="Mô tả" value={c.description} onChange={v => setC('description', v)} rows={6} />
        <ListEditor label="Điểm nổi bật" items={c.highlights} onChange={v => setC('highlights', v)} make={L0} addLabel="Thêm điểm nổi bật"
          render={(it, s, i) => <LInput label={`Điểm ${i + 1}`} value={it} onChange={s} required />} />
      </Card>
      <Card title="Thông tin nhanh" desc="Các dòng có biểu tượng ngay dưới tên khách sạn (địa chỉ, giờ, đi lại…).">
        <ListEditor label="Dòng" items={c.facts} onChange={v => setC('facts', v)} make={() => ({ icon: 'map-pin' as const, label: L0(), value: L0() })} addLabel="Thêm dòng"
          render={(it, s) => (
            <div className="grid gap-2 sm:grid-cols-[180px_minmax(0,1fr)]">
              <Field label="Biểu tượng"><select value={it.icon} onChange={e => s({ ...it, icon: e.target.value as typeof it.icon })} className={INPUT}>{ICON_KEYS.map(k => <option key={k} value={k}>{ICON_TEXT[k]}</option>)}</select></Field>
              <LInput label="Nhãn" value={it.label} onChange={v => s({ ...it, label: v })} required />
              <div className="sm:col-span-2"><LInput label="Nội dung" value={it.value} onChange={v => s({ ...it, value: v })} required /></div>
            </div>
          )} />
      </Card>
      <Card title="Chính sách" desc="Hai dòng đầu là Nhận phòng, Trả phòng.">
        <ListEditor label="Mục" items={c.policies} onChange={v => setC('policies', v)} make={(): Pair => [L0(), L0()]} addLabel="Thêm mục" render={(it, s) => <PairInput a="Mục" b="Nội dung" rows={2} it={it} set={s} />} />
        <LInput label="Tóm tắt chính sách huỷ" value={c.cancel_summary} onChange={v => setC('cancel_summary', v)} hint="Hiện dưới gói giá" />
      </Card>
      <Card title="Hỏi đáp">
        <ListEditor label="Câu hỏi" items={c.faq} onChange={v => setC('faq', v)} make={(): Pair => [L0(), L0()]} addLabel="Thêm câu hỏi" render={(it, s) => <PairInput a="Câu hỏi" b="Trả lời" rows={3} it={it} set={s} />} />
      </Card>
    </>
  )
}

type Choice = 'none' | 'yes' | 'no'
function Seg({ value, onChange, label }: { value: Choice; onChange: (v: Choice) => void; label: string }) {
  const opts: [Choice, string][] = [['none', 'Không hiện'], ['yes', 'Có'], ['no', 'Không có']]
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex h-9 shrink-0 rounded-xl bg-muted p-1">
      {opts.map(([v, t]) => (
        <button key={v} type="button" role="radio" aria-checked={value === v} onClick={() => onChange(v)}
          className={cn('rounded-lg px-3 text-[13px] font-medium transition-colors', value === v ? (v === 'yes' ? 'bg-emerald-600 text-white' : v === 'no' ? 'bg-zinc-600 text-white' : 'bg-card shadow-sm') : 'text-muted-foreground hover:text-foreground')}>
          {t}
        </button>
      ))}
    </div>
  )
}

function Amenities({ data, write, lang }: { data: AdminHotelEdit; write: Write; lang: Lang }) {
  const lib = useAdminAmenities()
  const [items, setItems] = useState(data.amenities)
  const of = (id: string) => items.find(i => i.amenityId === id)
  const choose = (id: string, v: Choice) => {
    if (v === 'none') return setItems(items.filter(i => i.amenityId !== id))
    setItems(of(id) ? items.map(i => (i.amenityId === id ? { ...i, available: v === 'yes' } : i)) : [...items, { amenityId: id, available: v === 'yes', description: null }])
  }
  const note = (id: string, text: string) => setItems(items.map(i => {
    if (i.amenityId !== id) return i
    const d = { vi: i.description?.vi ?? '', en: i.description?.en ?? '', [lang]: text }
    return { ...i, description: d.vi || d.en ? d : null }
  }))
  if (lib.isPending) return <div className={`${CARD} grid gap-3 p-5`}>{[0, 1, 2, 3].map(i => <Skel key={i} className="h-10" />)}</div>
  if (!lib.data) return <DbFailed error={lib.error} onRetry={() => lib.refetch()} />
  return (
    <form onSubmit={e => { e.preventDefault(); write.mutate({ op: 'hotelAmenity.set', hotelId: data.hotel.id, items }) }} className="grid gap-4">
      <Card title="Tiện ích" desc="“Có” → mục Đã gồm trong giá · “Không có” → mục Không có, trên trang khách sạn. Thêm loại tiện ích mới ở menu Tiện ích.">
        {!lib.data.length ? <Empty>Thư viện tiện ích trống.</Empty> : (
          <ul className="-my-2 divide-y divide-border">
            {lib.data.map(a => {
              const it = of(a.id)
              return (
                <li key={a.id} className="grid gap-2 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <span className="text-sm font-medium">{lang === 'en' ? a.name.en || a.name.vi : a.name.vi}</span>
                  <Seg label={a.name.vi} value={it ? (it.available ? 'yes' : 'no') : 'none'} onChange={v => choose(a.id, v)} />
                  {it?.available && (
                    <input value={it.description?.[lang] ?? ''} onChange={e => note(a.id, e.target.value)} aria-label={`Ghi chú ${a.name.vi}`}
                      placeholder={lang === 'en' ? it.description?.vi || 'Note (optional)' : 'Ghi chú thêm (tuỳ chọn), vd 6:30 – 9:30'} className={`${INPUT} h-9 sm:col-span-2`} />
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </Card>
      <SaveBar dirty={JSON.stringify(items) !== JSON.stringify(data.amenities)} pending={write.isPending} onReset={() => setItems(data.amenities)} result={resultOf(write)} label="Lưu tiện ích" />
    </form>
  )
}

type TaxDraft = Omit<AdminHotelEdit['taxFees'][number], 'id'> & { id?: string }

function TaxRow({ t, hotelId, write }: { t: TaxDraft; hotelId: string; write: Write }) {
  const [x, setX] = useState(t)
  return (
    <form onSubmit={e => { e.preventDefault(); write.mutate({ op: 'taxFee.save', hotelId, ...x, id: x.id }) }} className="grid gap-3 py-4 first:pt-0 last:pb-0">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_200px_140px]">
        <LInput label={x.id ? 'Tên' : 'Thêm thuế / phí'} value={x.name} onChange={v => setX({ ...x, name: v })} required />
        <Field label="Cách tính"><select value={x.type} onChange={e => setX({ ...x, type: e.target.value as typeof x.type })} className={INPUT}><option value="PERCENT">% trên tiền phòng</option><option value="PER_NIGHT">VND / phòng / đêm</option><option value="PER_BOOKING">VND / booking</option></select></Field>
        <Field label={x.type === 'PERCENT' ? 'Giá trị (%)' : 'Giá trị (VND)'}><input type="number" min={0} value={x.value} onChange={e => setX({ ...x, value: Number(e.target.value) || 0 })} className={INPUT} /></Field>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" checked={x.included} onChange={e => setX({ ...x, included: e.target.checked })} className="size-4" />Đã gồm trong giá</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={x.active} onChange={e => setX({ ...x, active: e.target.checked })} className="size-4" />Đang áp dụng</label>
        <span className="ml-auto flex gap-2">
          {x.id && <Button type="button" variant="ghost" className="text-red-700" onClick={() => confirm('Xoá thuế / phí này?') && write.mutate({ op: 'taxFee.delete', id: x.id! })}><Trash2 aria-hidden />Xoá</Button>}
          <Button type="submit" variant={x.id ? 'outline' : 'default'} disabled={write.isPending || JSON.stringify(x) === JSON.stringify(t)}>{x.id ? 'Lưu' : 'Thêm'}</Button>
        </span>
      </div>
    </form>
  )
}

function TaxFees({ data, write }: { data: AdminHotelEdit; write: Write }) {
  const blank: TaxDraft = { name: L0(), type: 'PERCENT', value: 8, included: true, active: true, sortOrder: data.taxFees.length }
  return (
    <Card title="Thuế & phí" desc="Đã gồm trong giá → chỉ ghi cho khách biết. Không gồm → cộng vào tổng tiền khi đặt phòng.">
      <div className="divide-y divide-border">
        {data.taxFees.map(t => <TaxRow key={JSON.stringify(t)} t={t} hotelId={data.hotel.id} write={write} />)}
        <TaxRow key={`new-${data.taxFees.length}`} t={blank} hotelId={data.hotel.id} write={write} />
      </div>
      {resultOf(write)}
    </Card>
  )
}

export function InfoPanel({ slug }: { slug: string }) {
  const tab = useSearchParams().get('tab')
  const sec = useSec(INFO_SECS, tab === 'anh' || tab === 'anh-ks' ? 'anh' : tab === 'noi-dung' ? 'noi-dung' : null)
  const { data, fallback } = useHotelEdit(slug)
  const write = useAdminWrite()
  const [lang, setLang] = useState<Lang>('vi')
  if (fallback || !data) return fallback
  const title = INFO_SECS.find(([id]) => id === sec)![1]
  const bilingual = sec !== 'anh'
  return (
    <SectionLayout items={INFO_SECS} value={sec} title={title} lang={bilingual ? lang : undefined} setLang={setLang}>
      {sec === 'chung' && <HotelForm key={JSON.stringify(data.hotel)} data={data} write={write}>{(h, set, setC) => <GeneralFields h={h} set={set} setC={setC} savedEmail={data.hotel.notifyEmail} />}</HotelForm>}
      {sec === 'noi-dung' && <HotelForm key={JSON.stringify(data.hotel)} data={data} write={write}>{(h, _set, setC) => <ContentFields c={h.content} setC={setC} />}</HotelForm>}
      {sec === 'anh' && (
        <>
          <Card><MediaSet key={JSON.stringify(data.gallery)} title="Bộ ảnh khách sạn" hint="Thứ tự = thứ tự trên trang. Ảnh bìa dùng cho thẻ khách sạn và thẻ giá." target="hotel" targetId={data.hotel.id} kind="GALLERY" value={data.gallery} /></Card>
          <Card><MediaSet key={JSON.stringify(data.hero)} title="Banner trang chủ" hint="Ảnh ngang. Điểm lấy nét giữ chủ thể không bị cắt, vd 50% 30%." target="hotel" targetId={data.hotel.id} kind="HERO" value={data.hero} /></Card>
        </>
      )}
      {sec === 'tien-ich' && <Amenities key={JSON.stringify(data.amenities)} data={data} write={write} lang={lang} />}
      {sec === 'thue-phi' && <TaxFees data={data} write={write} />}
    </SectionLayout>
  )
}

// ---------- Tab Cài đặt (phần của khách sạn) ----------

export function TechPanel({ slug }: { slug: string }) {
  const { data, fallback } = useHotelEdit(slug)
  const write = useAdminWrite()
  if (fallback || !data) return fallback
  const draft = data.hotel.status === 'DRAFT'
  return (
    <HotelForm key={JSON.stringify(data.hotel)} data={data} write={write}>
      {(h, set, setC) => (
        <>
          <Card title="Đường dẫn & mã">
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Đường dẫn" hint={draft ? `rootyhospitality.com/hotel/${h.slug}` : 'Chỉ đổi được khi khách sạn còn là nháp'}>
                <input required value={h.slug} disabled={!draft} onChange={e => set('slug', slugify(e.target.value))} className={INPUT} />
              </Field>
              <Field label="Mã khách sạn" hint="Trong mã đặt phòng RH-{mã}-…"><input required value={h.code} onChange={e => set('code', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} className={INPUT} /></Field>
              <Field label="Thứ tự hiện" hint="Nhỏ hiện trước"><input type="number" min={0} max={999} value={h.sortOrder} onChange={e => set('sortOrder', Number(e.target.value) || 0)} className={INPUT} /></Field>
            </div>
          </Card>
          <Card title="Bản đồ & pháp nhân">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Ô tìm Google Maps" className="sm:col-span-2"><input value={h.mapQuery} onChange={e => set('mapQuery', e.target.value)} className={INPUT} /></Field>
              <Field label="Vĩ độ"><input type="number" step="any" value={h.lat ?? ''} onChange={e => set('lat', num(e.target.value))} className={INPUT} /></Field>
              <Field label="Kinh độ"><input type="number" step="any" value={h.lng ?? ''} onChange={e => set('lng', num(e.target.value))} className={INPUT} /></Field>
              <Field label="Pháp nhân vận hành" className="sm:col-span-2"><input value={h.operator} onChange={e => set('operator', e.target.value)} className={INPUT} /></Field>
            </div>
          </Card>
          <Card title="Gohost" desc="Chỉ cần khi muốn đối chiếu / nhập giá từ Gohost. Web bán độc lập, không cần ID này.">
            <Field label="Gohost tenant ID"><input value={h.gohostTenantId ?? ''} onChange={e => set('gohostTenantId', e.target.value)} className={`${INPUT} font-mono text-[13px]`} /></Field>
          </Card>
          <Card title="Nội dung dạng bảng (JSON)" desc="Đi lại và bảng chính sách trẻ em — cùng hình với src/content. Server kiểm lại khi lưu.">
            <JsonInput label="Đi lại (getting_here)" value={h.content.getting_here} onChange={v => setC('getting_here', v)} rows={12} />
            <JsonInput label="Chính sách trẻ em (children) — null nếu không có" value={h.content.children} onChange={v => setC('children', v)} rows={8} />
          </Card>
          <Card title="Ghi chú nội bộ">
            <Field label="Chỗ chờ khách sạn xác nhận" hint="Mỗi dòng một mục, chỉ admin thấy (trang Tổng quan)">
              <textarea rows={3} value={h.content.pending.join('\n')} onChange={e => setC('pending', e.target.value.split('\n').filter(x => x.trim()))} className={`${INPUT} h-auto py-2`} />
            </Field>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={h.content.en_review} onChange={e => setC('en_review', e.target.checked)} className="size-4" />Bản tiếng Anh chờ Marketing duyệt</label>
          </Card>
        </>
      )}
    </HotelForm>
  )
}

export function DangerPanel({ slug }: { slug: string }) {
  const { data, fallback } = useHotelEdit(slug)
  const write = useAdminWrite()
  const router = useRouter()
  if (fallback || !data) return fallback
  const has = data.hotel.bookings > 0
  return (
    <Card title={has ? 'Lưu trữ khách sạn' : 'Xoá khách sạn'} desc={has ? `Đã có ${data.hotel.bookings} booking → chỉ lưu trữ được (ẩn khỏi web, giữ lịch sử).` : 'Xoá hẳn khách sạn cùng hạng phòng, gói giá, lịch giá. Không hoàn tác được.'}
      footer={<><Button type="button" variant="outline" className="text-red-700" disabled={write.isPending}
        onClick={() => confirm(`${has ? 'Lưu trữ' : 'Xoá hẳn'} ${data.hotel.name}?`) && write.mutate({ op: 'hotel.delete', id: data.hotel.id }, { onSuccess: () => { if (!has) router.replace('/admin') } })}>
        <Trash2 aria-hidden />{has ? 'Lưu trữ khách sạn' : 'Xoá khách sạn'}</Button>{resultOf(write)}</>}>
      <span className="text-[13px] text-muted-foreground">Thao tác ghi vào nhật ký.</span>
    </Card>
  )
}

// ---------- Tab Hạng phòng ----------

type RoomTypeDraft = Omit<AdminRoomTypeEdit, 'id' | 'rooms' | 'media' | 'bookings'> & { id?: string }
const EMPTY_ROOM_TYPE = (n: number): RoomTypeDraft => ({
  slug: '', status: 'DRAFT', name: L0(), description: L0(), size: L0(), beds: null,
  maxAdults: 2, maxChildren: 1, maxOccupancy: 3, baseOccupancy: 2, totalRooms: 1, sortOrder: n, gohostRoomTypeId: null, content: { features: [] },
})
const draftOf = (rt: AdminRoomTypeEdit) => Object.fromEntries(Object.entries(rt).filter(([k]) => !['rooms', 'media', 'bookings'].includes(k))) as RoomTypeDraft

function RoomTypeForm({ hotelId, rt, write, onCreated }: { hotelId: string; rt: RoomTypeDraft; write: Write; onCreated?: () => void }) {
  const [r, setR] = useState(rt)
  const set = <K extends keyof RoomTypeDraft>(k: K, v: RoomTypeDraft[K]) => setR(x => ({ ...x, [k]: v }))
  const n = (k: 'maxAdults' | 'maxChildren' | 'maxOccupancy' | 'baseOccupancy' | 'totalRooms', label: string, hint?: string) => (
    <Field label={label} hint={hint}><input type="number" min={0} value={r[k]} onChange={e => set(k, Number(e.target.value) || 0)} className={INPUT} /></Field>
  )
  function save(e: FormEvent) {
    e.preventDefault()
    write.mutate({
      op: 'roomType.save', id: r.id, hotelId, slug: r.slug.trim() || slugify(r.name.vi), status: r.status, name: r.name, description: r.description, size: r.size,
      beds: r.beds?.vi ? r.beds : null, maxAdults: r.maxAdults, maxChildren: r.maxChildren, maxOccupancy: r.maxOccupancy, baseOccupancy: r.baseOccupancy,
      totalRooms: r.totalRooms, sortOrder: r.sortOrder, gohostRoomTypeId: orNull(r.gohostRoomTypeId ?? ''),
      content: { features: r.content.features, ...(r.content.view?.vi ? { view: r.content.view } : {}), ...(r.content.tagline?.vi ? { tagline: r.content.tagline } : {}), ...(r.content.note?.vi ? { note: r.content.note } : {}) },
    }, { onSuccess: () => onCreated?.() })
  }
  return (
    <form className="grid gap-4" onSubmit={save}>
      <Card title="Tên & mô tả">
        <div className="grid gap-3 sm:grid-cols-2">
          <LInput label="Tên hạng phòng" value={r.name} onChange={v => set('name', v)} required />
          <StatusSelect value={r.status} onChange={s => set('status', s)} />
        </div>
        <LInput label="Câu gợi tò mò trên thẻ phòng" value={r.content.tagline} onChange={v => set('content', { ...r.content, tagline: v })} />
        <LInput label="Mô tả" value={r.description} onChange={v => set('description', v)} rows={5} required />
        <div className="grid gap-3 sm:grid-cols-3">
          <LInput label="Diện tích" value={r.size} onChange={v => set('size', v)} required hint="vd 19–22 m²" />
          <LInput label="Giường" value={r.beds} onChange={v => set('beds', v)} hint="vd 1 giường đôi" />
          <LInput label="Hướng nhìn" value={r.content.view} onChange={v => set('content', { ...r.content, view: v })} />
        </div>
        <LInput label="Lưu ý bắt buộc báo khách" value={r.content.note} onChange={v => set('content', { ...r.content, note: v })} rows={2} hint="vd phòng không có cửa sổ" />
      </Card>
      <Card title="Sức chứa & số phòng">
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {n('totalRooms', 'Tổng số phòng', 'Cả web và OTA')}
          {n('maxAdults', 'Người lớn tối đa')}
          {n('maxChildren', 'Trẻ em tối đa')}
          {n('maxOccupancy', 'Tổng khách tối đa')}
          {n('baseOccupancy', 'Khách gồm trong giá', 'Vượt → phụ thu theo gói')}
        </div>
      </Card>
      <Card title="Tiện nghi trong phòng">
        <ListEditor label="Tiện nghi" items={r.content.features} onChange={v => set('content', { ...r.content, features: v })} make={L0} addLabel="Thêm tiện nghi"
          render={(it, s, i) => <LInput label={`Tiện nghi ${i + 1}`} value={it} onChange={s} required />} />
      </Card>
      <details className={`group ${CARD}`}>
        <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 px-5 text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
          <span className="flex-1">Nâng cao</span><span className="text-[13px] font-normal text-muted-foreground">đường dẫn, thứ tự, Gohost</span>
          <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
        </summary>
        <div className="grid gap-3 border-t border-border p-5 sm:grid-cols-3">
          <Field label="Đường dẫn" hint="Bỏ trống = tạo từ tên"><input value={r.slug} onChange={e => set('slug', slugify(e.target.value))} placeholder={slugify(r.name.vi)} className={INPUT} /></Field>
          <Field label="Thứ tự hiện"><input type="number" min={0} value={r.sortOrder} onChange={e => set('sortOrder', Number(e.target.value) || 0)} className={INPUT} /></Field>
          <Field label="Gohost room type ID"><input value={r.gohostRoomTypeId ?? ''} onChange={e => set('gohostRoomTypeId', e.target.value)} className={`${INPUT} font-mono text-[13px]`} /></Field>
        </div>
      </details>
      <SaveBar dirty={!r.id || JSON.stringify(r) !== JSON.stringify(rt)} pending={write.isPending} onReset={() => setR(rt)} result={resultOf(write)} label={r.id ? 'Lưu hạng phòng' : 'Tạo hạng phòng'} />
    </form>
  )
}

function RoomRow({ room, rtId, write }: { room?: AdminRoomTypeEdit['rooms'][number]; rtId: string; write: Write }) {
  const init = room ?? { id: '', number: '', floor: null, note: null, active: true }
  const [x, setX] = useState(init)
  const label = room ? `phòng ${room.number}` : 'phòng mới'
  return (
    <form onSubmit={e => { e.preventDefault(); write.mutate({ op: 'room.save', id: x.id || undefined, roomTypeId: rtId, number: x.number, floor: x.floor, note: orNull(x.note ?? ''), active: x.active }) }}
      className="grid grid-cols-[88px_72px_minmax(0,1fr)] items-center gap-2 py-2 sm:grid-cols-[96px_80px_minmax(0,1fr)_auto_auto]">
      <input required value={x.number} placeholder="Số" aria-label={`Số ${label}`} onChange={e => setX({ ...x, number: e.target.value })} className={INPUT} />
      <input type="number" value={x.floor ?? ''} placeholder="Tầng" aria-label={`Tầng ${label}`} onChange={e => setX({ ...x, floor: num(e.target.value) })} className={INPUT} />
      <input value={x.note ?? ''} placeholder="Ghi chú (vd có bồn tắm)" aria-label={`Ghi chú ${label}`} onChange={e => setX({ ...x, note: e.target.value })} className={INPUT} />
      <label className="col-span-2 flex h-10 items-center gap-2 text-sm sm:col-span-1"><input type="checkbox" checked={x.active} onChange={e => setX({ ...x, active: e.target.checked })} className="size-4" />Đang dùng</label>
      <span className="flex justify-end gap-1">
        {room && <Button type="button" variant="ghost" size="icon" className="text-red-700" aria-label={`Xoá ${label}`} onClick={() => confirm(`Xoá phòng ${room.number}?`) && write.mutate({ op: 'room.delete', id: room.id })}><Trash2 aria-hidden /></Button>}
        <Button type="submit" variant={room ? 'outline' : 'default'} disabled={write.isPending || JSON.stringify(x) === JSON.stringify(init)}>{room ? 'Lưu' : <><Plus aria-hidden />Thêm</>}</Button>
      </span>
    </form>
  )
}

function Rooms({ rt, write }: { rt: AdminRoomTypeEdit; write: Write }) {
  return (
    <Card title={`Số phòng · ${rt.rooms.length} / ${rt.totalRooms}`} desc="Danh sách phòng thật của hạng này (số phòng, tầng) — để lễ tân xếp phòng. Không ảnh hưởng số phòng bán web.">
      <div className="divide-y divide-border">
        {rt.rooms.map(room => <RoomRow key={JSON.stringify(room)} room={room} rtId={rt.id} write={write} />)}
        <RoomRow key={`new-${rt.rooms.length}`} rtId={rt.id} write={write} />
      </div>
      {resultOf(write)}
    </Card>
  )
}

const RT_SECS = [['thong-tin', 'Thông tin'], ['anh', 'Ảnh'], ['so-phong', 'Số phòng'], ['goi', 'Gói giá']] as const

function RoomTypeDetail({ slug, data, rt }: { slug: string; data: AdminHotelEdit; rt?: AdminRoomTypeEdit }) {
  const router = useRouter()
  const write = useAdminWrite()
  const remove = useAdminWrite()
  const [lang, setLang] = useState<Lang>('vi')
  const sec = useSec(rt ? RT_SECS : RT_SECS.slice(0, 1))
  const back = '?tab=hang-phong'
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link href={back} scroll={false} className="inline-flex h-9 items-center gap-1.5 rounded-xl px-2 text-sm text-foreground/70 hover:bg-item-hover hover:text-foreground"><ArrowLeft className="size-4" aria-hidden />Hạng phòng</Link>
        <h2 className="text-lg font-semibold">{rt ? rt.name.vi : 'Thêm hạng phòng'}</h2>
        {rt && <Badge tone={statusTone(rt.status)}>{STATUS_TEXT[rt.status]}</Badge>}
        {rt && (
          <Button type="button" variant="ghost" size="sm" className="ml-auto text-red-700" disabled={remove.isPending}
            onClick={() => confirm(`${rt.bookings ? 'Lưu trữ' : 'Xoá hẳn'} hạng ${rt.name.vi}?`) && remove.mutate({ op: 'roomType.delete', id: rt.id }, { onSuccess: () => { if (!rt.bookings) router.replace(back, { scroll: false }) } })}>
            <Trash2 aria-hidden />{rt.bookings ? 'Lưu trữ' : 'Xoá hạng phòng'}
          </Button>
        )}
      </div>
      {resultOf(remove)}
      <SectionLayout items={rt ? RT_SECS : RT_SECS.slice(0, 1)} value={sec} title={RT_SECS.find(([id]) => id === sec)![1]}
        lang={sec === 'thong-tin' ? lang : undefined} setLang={setLang}>
        {sec === 'thong-tin' && (rt
          ? <RoomTypeForm key={JSON.stringify(draftOf(rt))} hotelId={data.hotel.id} rt={draftOf(rt)} write={write} />
          : <RoomTypeForm hotelId={data.hotel.id} rt={EMPTY_ROOM_TYPE(data.roomTypes.length)} write={write} onCreated={() => router.replace(back, { scroll: false })} />)}
        {rt && sec === 'anh' && <Card><MediaSet key={JSON.stringify(rt.media)} title="Ảnh hạng phòng" hint="Ảnh đầu tiên là ảnh trên thẻ phòng." target="roomType" targetId={rt.id} kind="ROOM" value={rt.media} /></Card>}
        {rt && sec === 'so-phong' && <Rooms rt={rt} write={write} />}
        {rt && sec === 'goi' && <RoomPlans slug={slug} roomTypeId={rt.id} />}
      </SectionLayout>
    </div>
  )
}

export function RoomTypesPanel({ slug }: { slug: string }) {
  const rtId = useSearchParams().get('rt')
  const { data, fallback } = useHotelEdit(slug)
  const plans = useAdminPlans(slug)
  if (fallback || !data) return fallback
  const rt = data.roomTypes.find(r => r.id === rtId)
  if (rtId === 'new' || rt) return <RoomTypeDetail key={rtId} slug={slug} data={data} rt={rt} />
  const planCount = (id: string) => plans.data?.roomTypes.find(r => r.id === id)?.plans.filter(p => p.active).length

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {data.roomTypes.map(r => {
        const n = planCount(r.id)
        return (
          <Link key={r.id} href={`?tab=hang-phong&rt=${r.id}`} scroll={false}
            className={`${CARD} group overflow-hidden transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none`}>
            <div className="relative">
              <Photo src={r.media[0]?.path ?? null} sizes="(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 100vw" className="aspect-[16/9]" />
              <span className="absolute top-3 left-3"><Badge tone={statusTone(r.status)}>{STATUS_TEXT[r.status]}</Badge></span>
            </div>
            <div className="grid gap-2 p-4">
              <p className="text-[15px] font-semibold group-hover:underline">{r.name.vi}</p>
              <p className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><BedDouble className="size-4" aria-hidden />{r.totalRooms} phòng{r.size.vi ? ` · ${r.size.vi}` : ''}</span>
                <span className="inline-flex items-center gap-1.5"><Users className="size-4" aria-hidden />{r.maxAdults} NL + {r.maxChildren} TE</span>
                <span className="inline-flex items-center gap-1.5"><ImageIcon className="size-4" aria-hidden />{r.media.length} ảnh</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {n === undefined ? null : n ? <Badge tone="neutral">{n} gói giá</Badge> : <Badge tone="warn">Chưa có gói giá</Badge>}
                {!r.media.length && <Badge tone="warn">Chưa có ảnh</Badge>}
              </div>
            </div>
          </Link>
        )
      })}
      <Link href="?tab=hang-phong&rt=new" scroll={false}
        className="grid min-h-48 place-items-center rounded-2xl border border-dashed border-border-strong text-sm font-medium text-foreground/70 transition-colors hover:bg-item-hover hover:text-foreground">
        <span className="inline-flex items-center gap-2"><Plus className="size-4" aria-hidden />Thêm hạng phòng</span>
      </Link>
      {!data.roomTypes.length && <p className="text-sm text-muted-foreground sm:col-span-2 xl:col-span-3">Chưa có hạng phòng nào.</p>}
    </div>
  )
}

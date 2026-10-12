'use client'
// Trang một khách sạn trong admin.
// · DATA_SOURCE=db (DbHotelView): 4 tab theo mức dùng — Giá & phòng trống (views/rates.tsx) · Hạng phòng · Thông tin khách sạn
//   (views/catalog.tsx) · Cài đặt (chính sách huỷ/cọc, thông số kỹ thuật, kết nối Gohost chỉ xem, xoá). Link ?tab= cũ được đổi sang tab mới.
// · Nguồn gohost (FileHotelView, bản cũ — wireframe A): Phòng & ánh xạ · Giá & phòng trống (GET Gohost) · Nội dung · Ảnh, chỉ xem.
import type { FormEvent } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ExternalLink, Link2, TriangleAlert } from 'lucide-react'
import { cn } from 'cn'
import { Button, buttonVariants } from '@/components/ui/button'
import { ConnectBadge } from '@/components/admin/status'
import { CopyId } from '@/components/admin/copy-id'
import { DateRangeInput } from '@/components/admin/date-range'
import { Badge, CARD, Empty, GohostError, LoadFailed, Photo, Skel, shortVnd, vndPlain } from '@/components/admin/ui'
import { fmtDate, fmtDayMonth, today } from '@/lib/format'
import { defaultStay, firstCheckin, validRange } from '@/lib/stay'
import { useAdminAvailability, useAdminHotel, useAdminHotelEdit } from '@/hooks/use-admin'
import { DbFailed, RatesPanel } from './rates'
import { DangerPanel, InfoPanel, RoomTypesPanel, SectionLayout, STATUS_TEXT, statusTone, TechPanel } from './catalog'
import { PoliciesPanel } from './plans'
import type { AdminHotel } from '@/types/admin'
import type { HotelCheck } from '@/types/admin'

// [id, nhãn, nhãn dưới sm].
const TABS_FILE = [['phong', 'Phòng & ánh xạ', 'Phòng'], ['gia', 'Giá & phòng trống', 'Giá'], ['noi-dung', 'Nội dung', 'Nội dung'], ['anh', 'Ảnh', 'Ảnh']] as const
type Tab = (typeof TABS_FILE)[number][0]

// ---------- Tab Phòng & ánh xạ ----------
type GhRoom = HotelCheck['ghRooms'][number]
const occText = (r: GhRoom) => `${r.occ_adults} NL + ${r.occ_children} TE${r.occ_infants ? ` + ${r.occ_infants} EB` : ''}`
function rateRange(r: GhRoom) {
  const all = (r.rate_plans ?? []).flatMap(p => p.default_rates ?? []).filter(n => n > 0)
  if (!all.length) return '—'
  const [min, max] = [Math.min(...all), Math.max(...all)]
  return min === max ? vndPlain(min) : `${vndPlain(min)} – ${vndPlain(max)}`
}

function MapPanel({ c, file, properties }: { c: HotelCheck; file: string; properties: AdminHotel['properties'] }) {
  if (c.state === 'none') return (
    <div className="px-5 pb-5">
      <Empty>Khách sạn chưa nối Gohost. Chọn đúng property bên dưới, chép ID vào gohost_tenant_id trong {file}.</Empty>
      {properties && properties.length > 0 && (
        <div className="grid gap-3">
          {properties.map(p => (
            <div key={p.id} className="rounded-xl border border-border px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-medium">{p.title} <span className="font-normal text-muted-foreground">· {p.prefix}</span></p><CopyId id={p.id} /></div>
              <ul className="mt-2 grid gap-1 text-sm text-foreground/80">
                {p.rooms.map(r => <li key={r.id} className="flex flex-wrap items-center justify-between gap-2"><span>{r.title} <span className="text-muted-foreground tabular-nums">· {r.quantity} phòng</span></span><CopyId id={r.id} /></li>)}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
  if (c.state === 'unknown') return <Empty>Chưa đọc được Gohost nên chưa có hạng phòng để ánh xạ.</Empty>
  if (c.state === 'missing') return <Empty>Không thấy khách sạn trên Gohost: gohost_tenant_id “{c.tenant}” không khớp property nào mà key đọc được.</Empty>
  if (!c.ghRooms.length) return <Empty>Gohost chưa có hạng phòng nào cho khách sạn này.</Empty>

  const byId = new Map(c.contentRooms.flatMap(r => (r.gohost_room_type_id ? [[r.gohost_room_type_id, r] as const] : [])))
  const contentCell = (r: GhRoom) => {
    const room = byId.get(r.id)
    if (room) return <span className="inline-flex items-center gap-1.5 whitespace-nowrap"><Link2 className="size-4 text-emerald-700" aria-hidden />{room.name.vi}</span>
    return r.is_virtual ? <span className="text-muted-foreground">Phòng ảo</span> : <Badge tone="warn">Chưa có nội dung</Badge>
  }
  const leftovers = [
    c.unlinkedContent.length ? `Nội dung chưa gắn Gohost: ${c.unlinkedContent.map(r => r.name.vi).join(', ')}.` : 'Nội dung chưa gắn Gohost: không có.',
    c.orphanContent.length ? `Trỏ tới ID không có trên Gohost: ${c.orphanContent.map(r => r.name.vi).join(', ')}.` : '',
  ].filter(Boolean).join(' ')
  return (
    <>
      <ul className="divide-y divide-border sm:hidden">
        {c.ghRooms.map(r => (
          <li key={r.id} className="px-4 py-3">
            <div className="flex items-start justify-between gap-3"><p className="min-w-0 text-sm font-medium">{r.title}</p>{byId.get(r.id) ? <Badge tone="ok">Có nội dung</Badge> : r.is_virtual ? <Badge tone="neutral">Phòng ảo</Badge> : <Badge tone="warn">Chưa có nội dung</Badge>}</div>
            <CopyId id={r.id} />
            <p className="text-xs text-muted-foreground">{r.quantity} phòng · {occText(r)} · {rateRange(r)}</p>
          </li>
        ))}
      </ul>
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-border text-xs text-muted-foreground">
            <tr><th className="px-5 py-2.5 font-medium">Hạng phòng trên Gohost</th><th className="px-3 py-2.5 font-medium">Nội dung web</th><th className="px-3 py-2.5 text-right font-medium">SL</th><th className="px-3 py-2.5 font-medium">Sức chứa</th><th className="px-3 py-2.5 font-medium">Gói giá</th><th className="px-5 py-2.5 text-right font-medium">Giá mặc định T2→CN</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {c.ghRooms.map(r => (
              <tr key={r.id}>
                <td className="px-5 py-2.5"><p className="font-medium whitespace-nowrap">{r.title}</p><CopyId id={r.id} /></td>
                <td className="px-3 py-2.5">{contentCell(r)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{r.quantity}</td>
                <td className="px-3 py-2.5 whitespace-nowrap">{occText(r)}</td>
                <td className="px-3 py-2.5 whitespace-nowrap">{(r.rate_plans ?? []).map(p => p.title).join(' · ') || '—'}</td>
                <td className="px-5 py-2.5 text-right whitespace-nowrap tabular-nums">{rateRange(r)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="border-t border-border px-5 py-3 text-xs text-pretty text-muted-foreground">{leftovers} Thêm hạng mới: chép ID rồi điền gohost_room_type_id trong {file}.</p>
    </>
  )
}

// ---------- Tab Giá & phòng trống ----------
function PricePanel({ c, opening }: { c: HotelCheck; opening: string | null }) {
  const router = useRouter()
  const sp = useSearchParams()
  const now = today()
  const fallback = defaultStay(now, opening)
  const checkin = sp.get('in') ?? fallback.checkin
  const checkout = sp.get('out') ?? fallback.checkout
  const valid = validRange(checkin, checkout, now, opening)
  const connected = c.state === 'ok'
  const { data, isFetching, isError, refetch } = useAdminAvailability(c.slug, connected && valid ? { checkin, checkout } : null)

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    router.push(`?${new URLSearchParams({ tab: 'gia', in: String(f.get('in')), out: String(f.get('out')) })}`, { scroll: false })
  }
  const form = (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
      <DateRangeInput key={`${checkin}|${checkout}`} id="gia-dates" label="Nhận – trả phòng" from={valid ? checkin : fallback.checkin} to={valid ? checkout : fallback.checkout} min={firstCheckin(now, opening)} />
      <Button type="submit" variant="default" disabled={isFetching}>{isFetching ? 'Đang xem…' : 'Xem giá'}</Button>
      <p className="basis-full text-xs text-pretty text-muted-foreground">Cùng lời gọi web đang dùng (GET /room_types, cache 3 phút). Mỗi lần xem tốn 1 lượt nếu chưa có trong cache.</p>
    </form>
  )
  if (!connected) return <section className={`${CARD} p-5`}>{form}<Empty>{c.state === 'none' ? 'Khách sạn chưa nối Gohost nên chưa có giá.' : 'Chưa đọc được Gohost.'}</Empty></section>
  if (!valid) return <section className={`${CARD} p-5`}>{form}<Empty>Khoảng ngày không hợp lệ: chọn 1 – 30 đêm, từ hôm nay tới 365 ngày tới.</Empty></section>
  if (isError) return <section className={`${CARD} p-5`}>{form}<div className="mt-4"><LoadFailed onRetry={() => refetch()} /></div></section>
  if (!data) return <section className={`${CARD} grid gap-3 p-5`} aria-busy>{form}{[0, 1, 2].map(i => <Skel key={i} className="h-10" />)}</section>
  if (data.error || !data.rooms) return <section className={`${CARD} p-5`}>{form}<div className="mt-4"><GohostError code={data.error ?? 'UPSTREAM'} /></div></section>

  const rooms = data.rooms
  const nameOf = (id: string, title: string) => c.contentRooms.find(r => r.gohost_room_type_id === id)?.name.vi ?? title
  const left = (n: number) => (n <= 0 ? <Badge tone="err">Hết phòng</Badge> : n <= 1 ? <Badge tone="warn">Còn {n}</Badge> : <span className="tabular-nums">{n}</span>)
  const nights = (p: (typeof rooms)[number]['plans'][number]) => p.days_breakdown.map(d => `${fmtDayMonth(d.day)} ${shortVnd(d.price)}`).join(' · ')
  return (
    <section className={`${CARD} p-5`}>
      {form}
      {!rooms.length ? <Empty>Gohost không trả hạng phòng nào cho khoảng ngày này.</Empty> : (
        <>
          <ul className="mt-4 divide-y divide-border rounded-xl border border-border sm:hidden">
            {rooms.map(r => (
              <li key={r.room_type_id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3"><p className="min-w-0 text-sm font-medium">{nameOf(r.room_type_id, r.title)}</p>{r.quantity <= 0 ? <Badge tone="err">Hết phòng</Badge> : <Badge tone={r.quantity <= 1 ? 'warn' : 'neutral'}>Còn {r.quantity}</Badge>}</div>
                {r.quantity > 0 && r.plans.map(p => <div key={p.rate_plan_id}><p className="mt-1 text-xs text-muted-foreground">{p.title} · {nights(p)}</p><p className="mt-1 text-sm font-medium tabular-nums">Tổng {vndPlain(p.total)}</p></div>)}
              </li>
            ))}
          </ul>
          <div className="mt-4 hidden overflow-x-auto rounded-xl border border-border sm:block">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="border-b border-border bg-muted/60 text-xs text-muted-foreground">
                <tr><th className="px-4 py-2.5 font-medium">Hạng phòng</th><th className="px-3 py-2.5 font-medium">Còn</th><th className="px-3 py-2.5 font-medium">Gói</th><th className="px-3 py-2.5 font-medium">Từng đêm</th><th className="px-4 py-2.5 text-right font-medium">Tổng</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rooms.map(r => (
                  <tr key={r.room_type_id}>
                    <td className="px-4 py-2.5 align-top font-medium whitespace-nowrap">{nameOf(r.room_type_id, r.title)}</td>
                    <td className="px-3 py-2.5 align-top">{left(r.quantity)}</td>
                    <td className="px-3 py-2.5 align-top whitespace-nowrap">{r.plans.length ? r.plans.map(p => <p key={p.rate_plan_id}>{p.title}</p>) : '—'}</td>
                    <td className="px-3 py-2.5 align-top text-xs whitespace-nowrap text-muted-foreground tabular-nums">{r.plans.length ? r.plans.map(p => <p key={p.rate_plan_id} className="leading-5">{nights(p)}</p>) : '—'}</td>
                    <td className="px-4 py-2.5 text-right align-top font-medium whitespace-nowrap tabular-nums">{r.plans.length ? r.plans.map(p => <p key={p.rate_plan_id}>{vndPlain(p.total)}</p>) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}

// ---------- Tab Nội dung ----------
function ContentPanel({ data, file }: { data: AdminHotel; file: string }) {
  const { content, rows } = data
  const cell = (missing: number, value: string, review?: boolean) =>
    missing ? <Badge tone="warn">Thiếu {missing}</Badge> : review ? <Badge tone="warn">Chờ duyệt</Badge> : <Badge tone="ok">{value}</Badge>
  return (
    <section className={`${CARD} overflow-hidden`}>
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border text-xs text-muted-foreground"><tr><th className="px-5 py-2.5 font-medium">Mục nội dung</th><th className="px-3 py-2.5 font-medium">Tiếng Việt</th><th className="px-5 py-2.5 font-medium">Tiếng Anh</th></tr></thead>
        <tbody className="divide-y divide-border">
          {rows.map(r => (
            <tr key={r.label}>
              <td className={cn('px-5 py-2.5 font-medium', r.label.startsWith('Hạng phòng') ? 'whitespace-nowrap' : 'text-pretty')}>{r.label}</td>
              <td className="px-3 py-2.5">{cell(r.viMissing, r.value)}</td>
              <td className="px-5 py-2.5">{cell(r.enMissing, r.value, content.en_review)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-border px-5 py-3 text-xs text-pretty text-muted-foreground">Sửa nội dung: {file} (commit). Nguồn: PDF thông tin lưu trú trên Drive.{content.en_review ? ' Bản tiếng Anh soạn từ PDF tiếng Việt, chờ Marketing duyệt.' : ''}</p>
      {content.pending.length > 0 && (
        <div className="border-t border-border px-5 py-4">
          <p className="text-sm font-medium">Chờ khách sạn xác nhận <span className="font-normal text-muted-foreground tabular-nums">{content.pending.length}</span></p>
          <ul className="mt-2 grid gap-1.5 text-sm text-foreground/80">{content.pending.map(p => <li key={p} className="flex gap-2 text-pretty"><TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-700" aria-hidden />{p}</li>)}</ul>
        </div>
      )}
    </section>
  )
}

// ---------- Tab Ảnh ----------
function PhotoPanel({ c }: { c: HotelCheck }) {
  if (!c.photos.length) return <section className={CARD}><Empty>Chưa có ảnh. Web đang hiện khung “Ảnh đang cập nhật”.</Empty></section>
  return (
    <section className={CARD}>
      <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4 xl:grid-cols-6">
        {c.photos.map(p => (
          <figure key={p.src} className="min-w-0">
            <Photo src={p.src} sizes="(min-width: 1280px) 16vw, (min-width: 640px) 25vw, 50vw" className="aspect-[4/3] rounded-xl" />
            <figcaption className="mt-1.5 truncate text-xs text-muted-foreground" title={p.label}>{p.label}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}

function Loading() {
  return (
    <div aria-busy>
      <Skel className="h-7 w-56" /><Skel className="mt-2 h-6 w-72" />
      <div className="mt-5 flex gap-4">{[0, 1, 2, 3].map(i => <Skel key={i} className="h-8 w-28" />)}</div>
      <div className={`${CARD} mt-4 grid gap-3 p-5`}>{[0, 1, 2, 3].map(i => <Skel key={i} className="h-10" />)}</div>
    </div>
  )
}

function TabBar<T extends string>({ tabs, tab, counts }: { tabs: readonly (readonly [T, string, string])[]; tab: T; counts?: Partial<Record<T, number>> }) {
  return (
    <div role="tablist" aria-label="Phần của khách sạn" className="flex min-w-full gap-2 overflow-x-auto shadow-[inset_0_-1px_0_var(--tab-rail)]">
      {tabs.map(([id, label, short]) => {
        const sel = tab === id
        return (
          <Link key={id} href={`?tab=${id}`} scroll={false} role="tab" aria-selected={sel}
            className={cn('relative box-content inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl px-2 pb-px text-[15px] font-medium whitespace-nowrap after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full',
              sel ? 'text-foreground after:bg-foreground' : 'text-foreground/70 after:bg-transparent hover:text-foreground')}>
            <span className="sm:hidden">{short}</span><span className="hidden sm:inline">{label}</span>
            {counts?.[id] != null && <span className="text-xs font-normal text-foreground/70 tabular-nums">{counts[id]}</span>}
          </Link>
        )
      })}
    </div>
  )
}

// ---------- DATA_SOURCE=db ----------

const TABS_DB = [['lich', 'Giá & phòng trống', 'Giá'], ['hang-phong', 'Hạng phòng', 'Phòng'], ['thong-tin', 'Thông tin khách sạn', 'Thông tin'], ['cai-dat', 'Cài đặt', 'Cài đặt']] as const
type DbTab = (typeof TABS_DB)[number][0]
/** Tab cũ (link trong Tổng quan, bookmark) → tab mới. */
const OLD_TAB: Record<string, DbTab> = { gia: 'lich', goi: 'hang-phong', anh: 'thong-tin', 'anh-ks': 'thong-tin', 'noi-dung': 'thong-tin', phong: 'cai-dat' }
const SETTING_SECS = [['chinh-sach', 'Chính sách huỷ & cọc'], ['ky-thuat', 'Thông số kỹ thuật'], ['gohost', 'Kết nối Gohost'], ['xoa', 'Xoá khách sạn']] as const

/** Ánh xạ Gohost chỉ xem (đối chiếu ID khi cần nhập giá từ Gohost). Chỉ gọi Gohost khi mở mục này. */
function GohostSection({ slug }: { slug: string }) {
  const { data, isPending, isError, refetch } = useAdminHotel(slug)
  if (isPending) return <div className={`${CARD} grid gap-3 p-5`}>{[0, 1, 2].map(i => <Skel key={i} className="h-10" />)}</div>
  if (isError || !data) return <LoadFailed onRetry={() => refetch()} />
  return (
    <>
      <p className="text-[13px] text-pretty text-muted-foreground">Web bán độc lập bằng giá và tồn trong Postgres. Bảng này chỉ để đối chiếu hạng phòng trên Gohost (bán OTA) khi cần nhập giá bằng <code>yarn db:import-gohost</code>.</p>
      {data.error && <GohostError code={data.error} />}
      <div className="flex items-center gap-2"><ConnectBadge state={data.check.state} /></div>
      <section className={`${CARD} overflow-hidden`}><MapPanel c={data.check} file="mục Thông số kỹ thuật (khách sạn) / Nâng cao (hạng phòng)" properties={data.properties} /></section>
    </>
  )
}

function SettingsPanel({ slug }: { slug: string }) {
  const sp = useSearchParams()
  const s = sp.get('sec') ?? (sp.get('tab') === 'phong' ? 'gohost' : null)
  const sec = SETTING_SECS.find(([id]) => id === s)?.[0] ?? SETTING_SECS[0][0]
  return (
    <SectionLayout items={SETTING_SECS} value={sec} title={SETTING_SECS.find(([id]) => id === sec)![1]}>
      {sec === 'chinh-sach' && <PoliciesPanel slug={slug} />}
      {sec === 'ky-thuat' && <TechPanel slug={slug} />}
      {sec === 'gohost' && <GohostSection slug={slug} />}
      {sec === 'xoa' && <DangerPanel slug={slug} />}
    </SectionLayout>
  )
}

function DbHotelView({ slug }: { slug: string }) {
  const tabParam = useSearchParams().get('tab') ?? ''
  const tab: DbTab = TABS_DB.find(([id]) => id === tabParam)?.[0] ?? OLD_TAB[tabParam] ?? 'lich'
  const { data, isPending, isError, error, refetch } = useAdminHotelEdit(slug)
  if (isPending) return <div className="max-w-site"><Loading /></div>
  if (isError || !data) return <div className="max-w-site"><DbFailed error={error} onRetry={() => refetch()} /></div>
  const h = data.hotel
  const opening = h.openingDate && h.openingDate > today() ? `Khai trương ${fmtDate(h.openingDate)}` : null
  return (
    <div className="max-w-site">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold text-balance">{h.name}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <Badge tone={statusTone(h.status)}>{STATUS_TEXT[h.status]}</Badge>
            <span className="text-sm text-muted-foreground">{[h.area.vi, `${data.roomTypes.length} hạng phòng`, opening].filter(Boolean).join(' · ')}</span>
          </div>
        </div>
        {h.status === 'PUBLISHED' && <a href={`/hotel/${slug}`} target="_blank" rel="noopener" className={buttonVariants({ variant: 'outline' })}><ExternalLink aria-hidden />Xem trên web</a>}
      </div>
      <div className="mt-5"><TabBar tabs={TABS_DB} tab={tab} counts={{ 'hang-phong': data.roomTypes.length }} /></div>
      <div className="mt-5">
        {tab === 'lich' && <RatesPanel slug={slug} />}
        {tab === 'hang-phong' && <RoomTypesPanel slug={slug} />}
        {tab === 'thong-tin' && <InfoPanel slug={slug} />}
        {tab === 'cai-dat' && <SettingsPanel slug={slug} />}
      </div>
    </div>
  )
}

// ---------- Nguồn gohost (bản cũ, chỉ xem) ----------

function FileHotelView({ slug }: { slug: string }) {
  const sp = useSearchParams()
  const tabParam = sp.get('tab')
  const tab: Tab = TABS_FILE.find(([id]) => id === tabParam)?.[0] ?? TABS_FILE[0][0]
  const { data, isPending, isError, refetch } = useAdminHotel(slug)
  if (isPending) return <div className="max-w-site"><Loading /></div>
  if (isError || !data) return <div className="max-w-site"><LoadFailed onRetry={() => refetch()} /></div>

  const { check: c, error, properties } = data
  const file = `src/content/${slug}.ts`
  const counts: Partial<Record<Tab, number>> = { phong: c.state === 'ok' ? c.ghRooms.length : undefined, anh: c.photos.length }
  return (
    <div className="max-w-site">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-semibold text-balance">{c.name}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <ConnectBadge state={c.state} />
            <span className="text-sm text-muted-foreground">{c.area}{c.tenant ? ` · tenant ${c.tenant.length > 14 ? `${c.tenant.slice(0, 4)}…${c.tenant.slice(-4)}` : c.tenant}` : ''}</span>
          </div>
        </div>
        <div className="flex shrink-0 gap-2"><a href={`/hotel/${slug}`} target="_blank" rel="noopener" className={buttonVariants()}><ExternalLink aria-hidden />Xem trên web</a></div>
      </div>
      {error && <div className="mt-4"><GohostError code={error} /></div>}
      <div className="mt-5"><TabBar tabs={TABS_FILE} tab={tab} counts={counts} /></div>
      <div className="mt-4">
        {tab === 'phong' && <section className={`${CARD} overflow-hidden`}><MapPanel c={c} file={file} properties={properties} /></section>}
        {tab === 'gia' && <PricePanel c={c} opening={data.content.opening} />}
        {tab === 'noi-dung' && <ContentPanel data={data} file={file} />}
        {tab === 'anh' && <PhotoPanel c={c} />}
      </div>
    </div>
  )
}

export function HotelView({ slug, db }: { slug: string; db: boolean }) {
  return db ? <DbHotelView slug={slug} /> : <FileHotelView slug={slug} />
}

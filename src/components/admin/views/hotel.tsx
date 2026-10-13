'use client'
// Trang một khách sạn trong admin: 4 tab theo mức dùng — Giá & phòng trống (views/rates.tsx) · Hạng phòng · Thông tin khách sạn
// (views/catalog.tsx) · Cài đặt (chính sách huỷ/cọc, thông số kỹ thuật, kết nối Gohost chỉ xem, xoá). Link ?tab= cũ được đổi sang tab mới.
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ExternalLink, Link2 } from 'lucide-react'
import { cn } from 'cn'
import { buttonVariants } from '@/components/ui/button'
import { ConnectBadge } from '@/components/admin/status'
import { CopyId } from '@/components/admin/copy-id'
import { Badge, CARD, Empty, GohostError, LoadFailed, Skel, vndPlain } from '@/components/admin/ui'
import { fmtDate, today } from '@/lib/format'
import { useAdminHotel, useAdminHotelEdit } from '@/hooks/use-admin'
import { DbFailed, RatesPanel } from './rates'
import { DangerPanel, InfoPanel, RoomTypesPanel, SectionLayout, STATUS_TEXT, statusTone, TechPanel } from './catalog'
import { PoliciesPanel } from './plans'
import type { AdminHotel, HotelCheck } from '@/types/admin'

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

export function HotelView({ slug }: { slug: string }) {
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


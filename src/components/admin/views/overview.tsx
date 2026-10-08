'use client'
// Tổng quan (wireframe A · "Việc cần xử lý trước"): dải trạng thái Gohost · việc cần xử lý theo mức chặn · thẻ từng khách sạn.
import Link from 'next/link'
import { ChevronRight, CircleAlert, TriangleAlert } from 'lucide-react'
import { ApiStatus, ConnectBadge } from '@/components/admin/status'
import { CARD, Dl, Empty, GROUP_LABEL, LoadFailed, Photo, ROW_LINK, Skel, TEXT_LINK, vnd } from '@/components/admin/ui'
import { fmtDate, today } from '@/lib/format'
import { useAdminOverview } from '@/hooks/use-admin'
import type { HotelCheck, Issue } from '@/types/admin'

function IssueRow({ x }: { x: Issue }) {
  const chan = x.level === 'chan'
  return (
    <li>
      <Link href={x.href} className={ROW_LINK}>
        <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${chan ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
          {chan ? <CircleAlert className="size-4" aria-hidden /> : <TriangleAlert className="size-4" aria-hidden />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-pretty text-foreground">{x.title}</p>
          <p className="mt-0.5 text-xs text-pretty text-muted-foreground">{x.hotel}<span className="hidden sm:inline"> · {x.desc}</span></p>
        </div>
        <span className="hidden shrink-0 items-center gap-1 text-sm font-medium text-foreground/70 group-hover:text-foreground sm:inline-flex">{x.go}<ChevronRight className="size-4" aria-hidden /></span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground sm:hidden" aria-hidden />
      </Link>
    </li>
  )
}

function Issues({ issues }: { issues: Issue[] }) {
  const groups = [['chan', 'Chặn hiển thị trên web'], ['sua', 'Cần sửa']] as const
  return (
    <section className={`${CARD} py-5`}>
      <header className="flex items-start justify-between gap-3 px-5">
        <h2 className="text-base font-semibold">Việc cần xử lý{issues.length > 0 && <> <span className="font-normal text-muted-foreground tabular-nums">{issues.length}</span></>}</h2>
      </header>
      {!issues.length ? <Empty>Không còn việc nào. Nội dung và dữ liệu Gohost của mọi khách sạn đã khớp.</Empty> : groups.map(([level, label]) => {
        const rows = issues.filter(x => x.level === level)
        return rows.length ? (
          <div key={level}>
            <p className={`mt-4 px-5 ${GROUP_LABEL}`}>{label}</p>
            <ul className="mt-1 grid gap-1 px-2">{rows.map(x => <IssueRow key={`${x.hotel}|${x.title}`} x={x} />)}</ul>
          </div>
        ) : null
      })}
    </section>
  )
}

function HotelCard({ c, issueCount }: { c: HotelCheck; issueCount: number }) {
  const unknown = <span className="text-muted-foreground">—</span>
  const mapped = c.state === 'ok' ? `${c.ghRooms.length - c.unmappedGohost.length}/${c.ghRooms.length}` : c.state === 'none' ? `0/${c.contentRooms.length}` : unknown
  return (
    <section className={`${CARD} flex flex-col overflow-hidden`}>
      <Photo src={c.cover} sizes="(min-width: 768px) 50vw, 100vw" className="aspect-[16/7]" />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-semibold">{c.name}</h3>
            <p className="text-xs text-muted-foreground">{c.area}{c.opening && c.opening > today() ? ` · Khai trương ${fmtDate(c.opening)}` : ''}</p>
          </div>
          <ConnectBadge state={c.state} />
        </div>
        <div className="mt-4">
          <Dl rows={[
            ['Hạng phòng đã ánh xạ', mapped],
            ['Ảnh', c.photos.length ? `${c.photos.length} ảnh` : <span className="text-amber-700">Chưa có</span>],
            ['Bản tiếng Anh', c.enMissing ? <span className="text-amber-700">Thiếu {c.enMissing}</span> : c.enReview ? <span className="text-amber-700">Chờ duyệt</span> : 'Đủ'],
            ['Giá từ', c.fromPrice ? vnd(c.fromPrice) : unknown],
          ]} />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{issueCount ? `${issueCount} việc cần xử lý` : 'Không còn việc cần xử lý'}</p>
        <div className="mt-auto pt-4"><Link href={`/admin/hotels/${c.slug}`} className={TEXT_LINK}>Xem chi tiết</Link></div>
      </div>
    </section>
  )
}

function Loading() {
  return (
    <>
      <div className={`${CARD} flex h-12 items-center px-5`}><Skel className="h-4 w-72" /></div>
      <section className={`${CARD} py-5`} aria-busy>
        <div className="px-5"><Skel className="h-5 w-40" /></div>
        <div className="mt-4 grid gap-4 px-5">{[0, 1, 2].map(i => <div key={i} className="flex gap-3"><Skel className="size-8 shrink-0" /><div className="grid flex-1 gap-2"><Skel className="h-4 w-1/2" /><Skel className="h-3 w-3/4" /></div></div>)}</div>
      </section>
      <div className="grid gap-4 md:grid-cols-2">{[0, 1].map(i => <div key={i} className={`${CARD} overflow-hidden`}><Skel className="aspect-[16/7] rounded-none" /><div className="grid gap-2 p-5">{[0, 1, 2, 3].map(j => <Skel key={j} className="h-4" />)}</div></div>)}</div>
    </>
  )
}

export function OverviewView() {
  const { data, isPending, isError, refetch } = useAdminOverview()
  return (
    <div className="grid max-w-[1200px] grid-cols-1 gap-4">
      {isPending ? <Loading /> : isError || !data ? <LoadFailed onRetry={() => refetch()} /> : (
        <>
          <ApiStatus status={data.status} error={data.error} />
          <Issues issues={data.issues} />
          <div className="grid gap-4 md:grid-cols-2">{data.checks.map(c => <HotelCard key={c.slug} c={c} issueCount={data.issues.filter(x => x.hotel === c.name).length} />)}</div>
        </>
      )}
    </div>
  )
}

'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Search, MapPin, CalendarDays, Users, Minus, Plus } from 'lucide-react'
import { repo } from '@/lib/repo'
import { AREA_LABEL } from '@/lib/labels'
import { addDays, diffDays, fmtRange, guestsLabel, TODAY } from '@/lib/format'
import { DEFAULT_SEARCH, searchToParams, type SearchState } from '@/lib/search-params'
import { Button, cn } from '../ui'
import { Dialog } from '../ui/overlay'

type Form = Pick<SearchState, 'dest' | 'checkin' | 'checkout' | 'adults' | 'children' | 'rooms' | 'ages'>

function Counter({ label, value, min, max, onChange, sub }: { label: string; value: number; min: number; max: number; onChange: (n: number) => void; sub?: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div><p className="text-sm font-medium">{label}</p>{sub && <p className="text-xs text-muted">{sub}</p>}</div>
      <div className="flex items-center gap-3">
        <button type="button" aria-label={`Giảm ${label}`} disabled={value <= min} onClick={() => onChange(value - 1)} className="grid size-8 place-items-center rounded-full border border-border disabled:opacity-40"><Minus className="size-4" /></button>
        <span className="w-5 text-center font-semibold" aria-live="polite">{value}</span>
        <button type="button" aria-label={`Tăng ${label}`} disabled={value >= max} onClick={() => onChange(value + 1)} className="grid size-8 place-items-center rounded-full border border-border disabled:opacity-40"><Plus className="size-4" /></button>
      </div>
    </div>
  )
}

function GuestsEditor({ f, set }: { f: Form; set: (p: Partial<Form>) => void }) {
  return (
    <div className="divide-y divide-border">
      <Counter label="Người lớn" value={f.adults} min={1} max={12} onChange={adults => set({ adults })} />
      <Counter label="Trẻ em" sub="0–17 tuổi" value={f.children} min={0} max={6} onChange={children => set({ children, ages: Array.from({ length: children }, (_, i) => f.ages[i] ?? 6) })} />
      {f.children > 0 && (
        <div className="grid grid-cols-3 gap-2 py-2">
          {f.ages.map((age, i) => (
            <label key={i} className="text-xs text-muted">Tuổi bé {i + 1}
              <select value={age} onChange={e => set({ ages: f.ages.map((a, k) => (k === i ? Number(e.target.value) : a)) })} className="mt-1 h-9 w-full rounded-md border border-border bg-surface px-2 text-sm text-fg">
                {Array.from({ length: 18 }, (_, n) => <option key={n} value={n}>{n} tuổi</option>)}
              </select>
            </label>
          ))}
        </div>
      )}
      <Counter label="Số phòng" value={f.rooms} min={1} max={6} onChange={rooms => set({ rooms })} />
    </div>
  )
}

export function SearchBar({ initial, variant = 'hero' }: { initial?: Partial<Form>; variant?: 'hero' | 'inline' }) {
  const router = useRouter()
  const hotels = repo.hotelsSync()
  const [f, setF] = useState<Form>({ dest: '', ...DEFAULT_SEARCH, ...initial })
  const [sheet, setSheet] = useState(false)
  const set = (p: Partial<Form>) => setF(x => {
    const n = { ...x, ...p }
    if (n.checkout <= n.checkin) n.checkout = addDays(n.checkin, 1)
    return n
  })
  const submit = (e?: React.FormEvent) => {
    e?.preventDefault()
    setSheet(false)
    const hotel = hotels.find(h => h.slug === f.dest)
    // Chọn đích danh 1 khách sạn → mở thẳng trang khách sạn (giữ ngày & khách)
    router.push(hotel ? `/${hotel.slug}?${searchToParams({ ...f, dest: undefined })}#phong` : `/tim-kiem?${searchToParams(f)}`)
  }
  const nights = diffDays(f.checkin, f.checkout)

  const fields = (stack: boolean) => (
    <div className={cn('grid gap-2', stack ? 'grid-cols-1' : 'grid-cols-[1.3fr_1fr_1fr_1.2fr_auto] items-end')}>
      <label className="block">
        <span className="mb-1 flex items-center gap-1 text-xs font-semibold text-muted"><MapPin className="size-3.5" /> Điểm đến / Khách sạn</span>
        <select value={f.dest} onChange={e => set({ dest: e.target.value })} className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm">
          <option value="">Phú Quốc – tất cả</option>
          <optgroup label="Khu vực">{(['bac-dao', 'trung-tam', 'nam-dao'] as const).map(a => <option key={a} value={a}>{AREA_LABEL[a]}</option>)}</optgroup>
          <optgroup label="Khách sạn">{hotels.map(h => <option key={h.slug} value={h.slug}>{h.name}</option>)}</optgroup>
        </select>
      </label>
      <label className="block">
        <span className="mb-1 flex items-center gap-1 text-xs font-semibold text-muted"><CalendarDays className="size-3.5" /> Nhận phòng</span>
        <input type="date" required min={TODAY} value={f.checkin} onChange={e => e.target.value && set({ checkin: e.target.value })} className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm" />
      </label>
      <label className="block">
        <span className="mb-1 flex items-center gap-1 text-xs font-semibold text-muted"><CalendarDays className="size-3.5" /> Trả phòng · {nights} đêm</span>
        <input type="date" required min={addDays(f.checkin, 1)} value={f.checkout} onChange={e => e.target.value && set({ checkout: e.target.value })} className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm" />
      </label>
      {stack ? (
        <div><span className="mb-1 flex items-center gap-1 text-xs font-semibold text-muted"><Users className="size-3.5" /> Khách & phòng</span><GuestsEditor f={f} set={set} /></div>
      ) : (
        <details className="group relative">
          <summary className="list-none">
            <span className="mb-1 flex items-center gap-1 text-xs font-semibold text-muted"><Users className="size-3.5" /> Khách & phòng</span>
            <span className="flex h-11 cursor-pointer items-center rounded-lg border border-border bg-surface px-3 text-sm">{guestsLabel(f.adults, f.children)} · {f.rooms} phòng</span>
          </summary>
          <div className="absolute right-0 z-30 mt-2 w-80 rounded-xl border border-border bg-surface p-4 shadow-xl">
            <GuestsEditor f={f} set={set} />
          </div>
        </details>
      )}
      {!stack && <Button type="submit" size="lg" className="h-11"><Search className="size-4" /> Tìm</Button>}
    </div>
  )

  return (
    <form onSubmit={submit} role="search" aria-label="Tìm khách sạn">
      {variant === 'hero' && <p className="mb-3 text-sm font-semibold text-fg">Where do you want to stay? <span className="font-normal text-muted">· Bạn muốn ở đâu?</span></p>}
      <div className="hidden md:block">{fields(false)}</div>
      {/* Mobile: thu gọn thành 1 nút, mở sheet */}
      <button type="button" onClick={() => setSheet(true)} className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-left md:hidden">
        <Search className="size-5 text-primary" />
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">{hotels.find(h => h.slug === f.dest)?.name ?? (f.dest ? AREA_LABEL[f.dest as keyof typeof AREA_LABEL] : 'Phú Quốc – tất cả')}</span>
          <span className="block truncate text-xs text-muted">{fmtRange(f.checkin, f.checkout)} · {guestsLabel(f.adults, f.children)} · {f.rooms} phòng</span>
        </span>
      </button>
      <Dialog open={sheet} onClose={() => setSheet(false)} title="Tìm khách sạn" side="bottom"
        footer={<Button size="lg" className="w-full" onClick={() => submit()}><Search className="size-4" /> Tìm phòng</Button>}>
        {fields(true)}
      </Dialog>
    </form>
  )
}

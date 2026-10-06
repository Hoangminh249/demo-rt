'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Search } from 'lucide-react'
import { repo } from '@/lib/repo'
import { AREA_LABEL } from '@/lib/labels'
import { fmtRange, guestsLabel } from '@/lib/format'
import { DEFAULT_SEARCH, searchToParams, type SearchState } from '@/lib/search-params'
import { Button } from '@/components/ui/button'
import { Dialog } from '../ui/overlay'
import { DateRangeField, DestinationField, GuestsField, PartyEditor, type Party } from './stay-fields'

type Form = Pick<SearchState, 'dest' | 'checkin' | 'checkout' | 'adults' | 'children' | 'rooms' | 'ages'>

/** Thanh tìm: Điểm đến · Ngày · Khách & phòng · Tìm. Mobile thu thành một nút mở sheet. */
export function SearchBar({ initial, variant = 'hero' }: { initial?: Partial<Form>; variant?: 'hero' | 'inline' }) {
  const router = useRouter()
  const hotels = repo.hotelsSync()
  const [f, setF] = useState<Form>({ dest: '', ...DEFAULT_SEARCH, ...initial })
  const [sheet, setSheet] = useState(false)
  const party: Party = { adults: f.adults, children: f.children, ages: f.ages, rooms: f.rooms }
  const setParty = (p: Party) => setF(x => ({ ...x, ...p }))

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault()
    setSheet(false)
    const hotel = hotels.find(h => h.slug === f.dest)
    // Chọn đích danh một khách sạn → mở thẳng trang khách sạn (giữ ngày & khách)
    router.push(hotel ? `/${hotel.slug}?${searchToParams({ ...f, dest: undefined })}#phong` : `/tim-kiem?${searchToParams(f)}`)
  }
  const destLabel = hotels.find(h => h.slug === f.dest)?.name ?? (f.dest ? AREA_LABEL[f.dest as keyof typeof AREA_LABEL] : 'Phú Quốc – tất cả khách sạn')

  return (
    <form onSubmit={submit} role="search" aria-label="Tìm phòng">
      <div className="hidden items-end gap-3 md:grid md:grid-cols-2 lg:grid-cols-[1.2fr_1.1fr_1fr_auto] [&>*]:min-w-0">
        <DestinationField id={`${variant}-dest`} value={f.dest ?? ''} onChange={dest => setF(x => ({ ...x, dest }))} compact={variant === 'inline'} />
        <DateRangeField id={`${variant}-dates`} checkin={f.checkin} checkout={f.checkout} onChange={r => setF(x => ({ ...x, ...r }))} compact={variant === 'inline'} />
        <GuestsField id={`${variant}-guests`} party={party} onChange={setParty} compact={variant === 'inline'} />
        <Button type="submit" variant="default" className="h-10 min-h-10 px-5"><Search aria-hidden /> Tìm phòng</Button>
      </div>

      {/* Mobile: một nút tóm tắt, bấm mở sheet */}
      <button type="button" onClick={() => setSheet(true)} className="flex w-full items-center gap-3 rounded-xl border border-border-strong bg-card px-4 py-3 text-left md:hidden">
        <Search className="size-5 shrink-0 text-primary" aria-hidden />
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">{destLabel}</span>
          <span className="block truncate text-xs text-muted-foreground">{fmtRange(f.checkin, f.checkout)} · {guestsLabel(f.adults, f.children)} · {f.rooms} phòng</span>
        </span>
      </button>
      <Dialog open={sheet} onClose={() => setSheet(false)} title="Tìm phòng" side="bottom"
        footer={<Button variant="default" size="lg" className="w-full" onClick={() => submit()}><Search aria-hidden /> Tìm phòng</Button>}>
        <div className="space-y-4">
          <DestinationField id="m-dest" value={f.dest ?? ''} onChange={dest => setF(x => ({ ...x, dest }))} />
          <DateRangeField id="m-dates" checkin={f.checkin} checkout={f.checkout} onChange={r => setF(x => ({ ...x, ...r }))} />
          <div><p className="mb-1 text-sm font-medium">Khách & phòng</p><PartyEditor party={party} onChange={setParty} /></div>
        </div>
      </Dialog>
    </form>
  )
}

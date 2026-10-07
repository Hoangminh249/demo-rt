'use client'
// Cột phải trang khách sạn: thẻ giá dính (giống thẻ giá trang tour rootytrip) + khối "Chỉ có khi đặt với Rooty".
import { Gift, Headset, PlaneLanding, Ship } from 'lucide-react'
import { fmtPrice } from '@/lib/format'
import { BTN } from '@/components/site/kit'
import { DateRangeField, GuestsField } from '@/components/site/stay-fields'
import { useStay } from './use-stay'

export function PriceCard({ fromPrice }: { fromPrice: number }) {
  const [stay, setStay] = useStay()
  return (
    <div className="rounded-2xl bg-white p-5 shadow-card">
      <p className="text-[14px] text-muted-foreground">Giá từ</p>
      <p><span className="text-[28px] font-semibold text-foreground">{fmtPrice(fromPrice)}</span><span className="text-[14px] text-muted-foreground"> /đêm</span></p>
      <div className="mt-4 grid gap-3">
        <DateRangeField id="pc-dates" label="Nhận – trả phòng" stay={stay} onChange={setStay} />
        <GuestsField id="pc-guests" stay={stay} onChange={setStay} />
      </div>
      <a href="#phong" className={`${BTN} mt-4 h-12 w-full`}>Xem phòng trống</a>
      <p className="mt-3 flex gap-1.5 text-[14px] text-muted-foreground"><Gift className="mt-0.5 size-4 shrink-0 text-orange" aria-hidden />Đặt trực tiếp từ 2 đêm: tặng xe đón sân bay</p>
    </div>
  )
}

export function OnlyRooty() {
  const items = [[PlaneLanding, 'Xe Rooty Trip đón tận cửa ra sân bay'], [Ship, 'Đặt kèm tour cano, cáp treo, du thuyền RIVUS'], [Headset, 'Hotline người Phú Quốc 7:30 – 21:00']] as const
  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <p className="font-bold text-brand">Chỉ có khi đặt với Rooty</p>
      <ul className="mt-3 grid gap-3 text-[15px]">
        {items.map(([Icon, t]) => <li key={t} className="flex gap-2.5"><Icon className="mt-0.5 size-4 shrink-0 text-orange" aria-hidden />{t}</li>)}
      </ul>
    </div>
  )
}

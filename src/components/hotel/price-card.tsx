'use client'
// Cột phải trang khách sạn: thẻ giá dính (giống thẻ giá trang tour rootytrip) + khối "Chỉ có khi đặt với Rooty".
import { useTranslations } from 'next-intl'
import { Gift, Headset, PlaneLanding, Ship } from 'lucide-react'
import { BTN } from '@/components/site/kit'
import { Price } from '@/components/site/currency'
import { DateRangeField, GuestsField } from '@/components/site/stay-fields'
import { useStay } from './use-stay'

export function PriceCard({ fromPrice }: { fromPrice: number }) {
  const t = useTranslations()
  const [stay, setStay] = useStay()
  return (
    <div className="rounded-2xl bg-white p-5 shadow-card">
      <p className="text-[14px] text-muted-foreground">{t('Common.from')}</p>
      <p><span className="text-[28px] font-semibold text-foreground"><Price vnd={fromPrice} /></span><span className="text-[14px] text-muted-foreground"> {t('Common.perNight')}</span></p>
      <div className="mt-4 grid gap-3">
        <DateRangeField id="pc-dates" label={t('Fields.datesShort')} stay={stay} onChange={setStay} />
        <GuestsField id="pc-guests" stay={stay} onChange={setStay} />
      </div>
      <a href="#phong" className={`${BTN} mt-4 h-12 w-full`}>{t('Common.seeRooms')}</a>
      <p className="mt-3 flex gap-1.5 text-[14px] text-muted-foreground"><Gift className="mt-0.5 size-4 shrink-0 text-orange" aria-hidden />{t('Hotel.gift')}</p>
    </div>
  )
}

const ONLY_ICONS = [PlaneLanding, Ship, Headset]

export function OnlyRooty() {
  const t = useTranslations('Hotel')
  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <p className="font-bold text-brand">{t('onlyRooty')}</p>
      <ul className="mt-3 grid gap-3 text-[15px]">
        {(t.raw('onlyItems') as string[]).map((x, i) => { const Icon = ONLY_ICONS[i]; return <li key={x} className="flex gap-2.5"><Icon className="mt-0.5 size-4 shrink-0 text-orange" aria-hidden />{x}</li> })}
      </ul>
    </div>
  )
}

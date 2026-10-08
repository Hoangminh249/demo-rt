'use client'
// Cột phải trang khách sạn: thẻ giá dính (giống thẻ giá trang tour rootytrip). "Giá từ" lấy từ Gohost; chưa có thì không đoán số.
import { useTranslations } from 'next-intl'
import { MessageCircle } from 'lucide-react'
import { fmtPrice, today } from '@/lib/format'
import { firstCheckin } from '@/lib/stay'
import { BTN } from '@/components/site/kit'
import { DateRangeField, GuestsField } from '@/components/site/stay-fields'
import { useStay } from './use-stay'
import type { Contact } from '@/types/hotel'

export function PriceCard({ fromPrice, opening, contact }: { fromPrice: number | null; opening: string | null; contact: Contact }) {
  const t = useTranslations()
  const [stay, setStay] = useStay(opening)
  return (
    <div className="rounded-2xl bg-white p-5 shadow-card">
      {fromPrice ? (
        <>
          <p className="text-[14px] text-muted-foreground">{t('Common.from')}</p>
          <p><span className="text-[28px] font-semibold text-foreground">{fmtPrice(fromPrice)}</span><span className="text-[14px] text-muted-foreground"> {t('Common.perNight')}</span></p>
        </>
      ) : <p className="text-[17px] font-semibold text-brand">{t('Hotel.priceByDate')}</p>}
      <div className="mt-4 grid gap-3">
        <DateRangeField id="pc-dates" label={t('Fields.datesShort')} stay={stay} min={firstCheckin(today(), opening)} onChange={setStay} />
        <GuestsField id="pc-guests" stay={stay} onChange={setStay} />
      </div>
      <a href="#phong" className={`${BTN} mt-4 h-12 w-full`}>{t('Common.seeRooms')}</a>
      <a href={contact.zalo} target="_blank" rel="noopener" className="mt-3 flex min-h-10 items-center gap-1.5 text-[14px] text-muted-foreground hover:text-primary">
        <MessageCircle className="size-4 shrink-0 text-orange" aria-hidden />{t('Hotel.bookVia', { phone: contact.phone_display })}
      </a>
    </div>
  )
}

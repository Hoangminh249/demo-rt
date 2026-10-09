'use client'
// Cột phải trang khách sạn: thẻ giá dính, kính sáng trên quầng màu ảnh khách sạn. "Giá từ" lấy từ Gohost; chưa có thì không đoán số.
// "Đã gồm trong giá phòng" nằm trong thẻ này (không còn là section riêng).
import { useTranslations } from 'next-intl'
import { MessageCircle } from 'lucide-react'
import { fmtPrice, today } from '@/lib/format'
import { firstCheckin } from '@/lib/stay'
import { BTN, GlowCard, IncludedGrid } from '@/components/site/kit'
import { DateRangeField, GuestsField } from '@/components/site/stay-fields'
import { useStay } from './use-stay'
import type { Contact, Hotel } from '@/types/hotel'

export function PriceCard({ fromPrice, opening, contact, cover, included }: { fromPrice: number | null; opening: string | null; contact: Contact; cover: string | null; included: Hotel['included'] }) {
  const t = useTranslations()
  const [stay, setStay] = useStay(opening)
  return (
    <GlowCard src={cover}>
      {fromPrice ? (
        <>
          <p className="text-[14px] text-muted-foreground">{t('Common.from')}</p>
          <p><span className="text-[30px] font-bold text-brand">{fmtPrice(fromPrice)}</span><span className="text-[14px] text-muted-foreground"> {t('Common.perNight')}</span></p>
        </>
      ) : <p className="text-[17px] font-semibold text-brand">{t('Hotel.priceByDate')}</p>}
      <div className="mt-4 grid gap-3">
        <DateRangeField id="pc-dates" label={t('Fields.datesShort')} stay={stay} min={firstCheckin(today(), opening)} onChange={setStay} />
        <GuestsField id="pc-guests" stay={stay} onChange={setStay} />
      </div>
      <a href="#phong" className={`${BTN} mt-4 h-12 w-full rounded-xl shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_6px_16px_rgb(35_128_111/0.22)]`}>{t('Common.seeRooms')}</a>
      <div className="mt-4"><IncludedGrid items={included} title={t('Hotel.included')} more={n => t('Hotel.moreIncluded', { n })} /></div>
      <a href={contact.zalo} target="_blank" rel="noopener" className="mt-2 flex min-h-10 items-center gap-1.5 text-[14px] text-muted-foreground hover:text-primary">
        <MessageCircle className="size-4 shrink-0 text-orange" aria-hidden />{t('Hotel.bookVia', { phone: contact.phone_display })}
      </a>
    </GlowCard>
  )
}

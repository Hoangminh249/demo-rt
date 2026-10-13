'use client'
// Cột phải trang khách sạn: thẻ giá dính, kính sáng trên quầng màu ảnh khách sạn. "Giá từ" lấy từ DB; chưa có thì không đoán số.
// Đổi ngày / khách trên bản nháp, bấm "Áp dụng" mới cập nhật URL (danh sách phòng tải lại) và cuộn tới khối phòng.
// "Đã gồm trong giá phòng" nằm trong thẻ này (không còn là section riêng).
import { useIsFetching } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { MessageCircle } from 'lucide-react'
import { fmtPrice, today } from '@/lib/format'
import { firstCheckin, stayQuery } from '@/lib/stay'
import { roomKeys } from '@/hooks/use-rooms'
import { GlowCard, IncludedGrid } from '@/components/site/kit'
import { StayForm } from '@/components/site/stay-fields'
import { useStay } from './use-stay'
import type { Contact, Hotel } from '@/types/hotel'

export function PriceCard({ slug, fromPrice, opening, contact, cover, included }: { slug: string; fromPrice: number | null; opening: string | null; contact: Contact; cover: string | null; included: Hotel['included'] }) {
  const t = useTranslations()
  const [stay, setStay] = useStay(opening)
  const loading = useIsFetching({ queryKey: roomKeys.all(slug) }) > 0
  return (
    <GlowCard src={cover}>
      {fromPrice ? (
        <>
          <p className="text-[14px] text-muted-foreground">{t('Common.from')}</p>
          <p><span className="text-[30px] font-bold text-brand">{fmtPrice(fromPrice)}</span><span className="text-[14px] text-muted-foreground"> {t('Common.perNight')}</span></p>
        </>
      ) : <p className="text-[17px] font-semibold text-brand">{t('Hotel.priceByDate')}</p>}
      <StayForm key={stayQuery(stay)} id="pc" stay={stay} min={firstCheckin(today(), opening)} pending={loading} className="mt-4"
        onApply={s => { setStay(s); document.getElementById('phong')?.scrollIntoView({ behavior: 'smooth' }) }} />
      <div className="mt-4"><IncludedGrid items={included} title={t('Hotel.included')} more={n => t('Hotel.moreIncluded', { n })} /></div>
      <a href={contact.zalo} target="_blank" rel="noopener" className="mt-2 flex min-h-10 items-center gap-1.5 text-[14px] text-muted-foreground hover:text-primary">
        <MessageCircle className="size-4 shrink-0 text-orange" aria-hidden />{t('Hotel.bookVia', { phone: contact.phone_display })}
      </a>
    </GlowCard>
  )
}

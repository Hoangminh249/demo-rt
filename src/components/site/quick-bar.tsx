'use client'
// Thanh chọn nhanh trên banner trang chủ: chọn khách sạn + ngày + số khách → sang trang khách sạn đó.
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { DEFAULT_STAY, hotelHref } from '@/lib/stay'
import { BTN } from './kit'
import { DateRangeField, GuestsField, HotelField } from './stay-fields'

export function QuickBar({ hotels }: { hotels: { slug: string; name: string }[] }) {
  const t = useTranslations('Fields')
  const router = useRouter()
  const [slug, setSlug] = useState(hotels[0].slug)
  const [stay, setStay] = useState(DEFAULT_STAY)
  return (
    <form
      onSubmit={e => { e.preventDefault(); router.push(`${hotelHref(slug, stay)}#phong`) }}
      className="grid gap-3 rounded-2xl bg-white p-4 shadow-card md:grid-cols-2 md:p-5 lg:grid-cols-[1.2fr_1.3fr_1fr_auto] lg:items-end"
    >
      <HotelField id="qb-hotel" value={slug} hotels={hotels} onChange={setSlug} />
      <DateRangeField id="qb-dates" stay={stay} onChange={setStay} />
      <GuestsField id="qb-guests" stay={stay} onChange={setStay} />
      <button type="submit" className={`${BTN} h-12 px-7 md:self-end`}>{t('submit')}</button>
    </form>
  )
}

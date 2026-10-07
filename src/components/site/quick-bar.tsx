'use client'
// Thanh chọn nhanh trên banner trang chủ: chọn khách sạn + ngày + số khách → sang trang khách sạn đó.
// Ngày mặc định tính ở server (trang chủ) rồi truyền vào, để HTML server và trình duyệt khớp nhau.
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { defaultStay, firstCheckin, hotelHref } from '@/lib/stay'
import type { Stay } from '@/lib/types'
import { BTN } from './kit'
import { DateRangeField, GuestsField, HotelField } from './stay-fields'

type QuickHotel = { slug: string; name: string; opening: string | null }

export function QuickBar({ hotels, now, initial }: { hotels: QuickHotel[]; now: string; initial: Stay }) {
  const t = useTranslations('Fields')
  const router = useRouter()
  const [slug, setSlug] = useState(hotels[0]?.slug ?? '')
  const [stay, setStay] = useState(initial)
  const opening = hotels.find(h => h.slug === slug)?.opening ?? null
  const min = firstCheckin(now, opening)

  // Đổi sang khách sạn chưa khai trương mà ngày đang chọn sớm hơn ngày khai trương → dời về ngày mặc định của khách sạn đó.
  function pickHotel(next: string) {
    setSlug(next)
    const nextOpening = hotels.find(h => h.slug === next)?.opening ?? null
    if (stay.checkin < firstCheckin(now, nextOpening)) setStay({ ...defaultStay(now, nextOpening), adults: stay.adults, children: stay.children })
  }

  if (!hotels.length) return null
  return (
    <form
      onSubmit={e => { e.preventDefault(); router.push(`${hotelHref(slug, stay)}#phong`) }}
      className="grid gap-3 rounded-2xl bg-white p-4 shadow-card md:grid-cols-2 md:p-5 lg:grid-cols-[1.2fr_1.3fr_1fr_auto] lg:items-end"
    >
      <HotelField id="qb-hotel" value={slug} hotels={hotels} onChange={pickHotel} />
      <DateRangeField id="qb-dates" stay={stay} min={min} onChange={setStay} />
      <GuestsField id="qb-guests" stay={stay} onChange={setStay} />
      <button type="submit" className={`${BTN} h-12 px-7 md:self-end`}>{t('submit')}</button>
    </form>
  )
}

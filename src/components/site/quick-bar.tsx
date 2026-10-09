'use client'
// Thanh tìm phòng trang chủ: chọn khách sạn + ngày + số khách → sang trang khách sạn đó.
// Một dải trắng chia ô (máy tính: một hàng; điện thoại: xếp dọc), đè lên mép dưới banner.
// Ngày mặc định tính ở server (trang chủ) rồi truyền vào, để HTML server và trình duyệt khớp nhau.
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ArrowRight } from 'lucide-react'
import { useRouter } from '@/i18n/navigation'
import { defaultStay, firstCheckin, hotelHref } from '@/lib/stay'
import type { Stay } from '@/types/hotel'
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
      aria-label={t('search')}
      onSubmit={e => { e.preventDefault(); router.push(`${hotelHref(slug, stay)}#phong`) }}
      className="glass-light grid overflow-hidden rounded-xl p-1.5 lg:grid-cols-[1.1fr_2fr_1fr_auto]"
    >
      <div className="border-b border-border lg:border-r lg:border-b-0"><HotelField id="qb-hotel" boxed value={slug} hotels={hotels} onChange={pickHotel} /></div>
      <div className="border-b border-border lg:border-r lg:border-b-0"><DateRangeField id="qb-dates" boxed stay={stay} min={min} onChange={setStay} /></div>
      <GuestsField id="qb-guests" boxed stay={stay} onChange={setStay} />
      <button type="submit" className={`${BTN} group/cta mt-1.5 h-12 px-7 lg:mt-0 lg:ml-1.5 lg:h-auto`}>
        {t('submit')}<ArrowRight className="size-4 transition-transform duration-200 group-hover/cta:translate-x-[3px]" aria-hidden />
      </button>
    </form>
  )
}

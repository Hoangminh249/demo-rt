'use client'
// Giá + phòng trống của MỘT hạng phòng cho ngày ở trên URL, và gói giá đang chọn (?plan=).
// Dùng chung cho trang phòng (danh sách gói + thẻ đặt phòng) và các bước đặt phòng — mỗi bước tính lại từ Gohost, không tin số của bước trước.
import { useSyncExternalStore } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRoomAvailability } from '@/hooks/use-rooms'
import { mergeRooms, type RoomState } from '@/lib/rooms'
import type { Room } from '@/types/hotel'
import { useStay } from '@/components/hotel/use-stay'

const noop = () => () => {}

export interface OfferHotel { slug: string; code: string; name: string; online: boolean; opening: string | null; cancel_summary: string }

/** 'contact' = chưa có giá trực tuyến (KS chưa nối Gohost, phòng chưa ánh xạ, Gohost không trả gói) → liên hệ đặt phòng. */
export type OfferStatus = 'loading' | 'error' | 'contact' | Exclude<RoomState, 'unmapped' | 'no_rates'>

export function useRoomOffer(hotel: OfferHotel, room: Room) {
  const [stay, setStay, setParams] = useStay(hotel.opening)
  const planId = useSearchParams().get('plan')
  const q = useRoomAvailability(hotel.slug, stay.checkin, stay.checkout, hotel.online && !!room.room_type_id)
  const offer = q.data ? mergeRooms([room], q.data, stay)[0] : undefined
  // Ba khối của trang (gói giá, thẻ đặt phòng, thanh đáy) nằm ở các Suspense riêng, hydrate lần lượt: khối hydrate sau có thể đã
  // thấy dữ liệu trong cache trong khi HTML server vẽ "đang tải" → lệch. Lần render lúc hydrate luôn là "đang tải".
  const hydrated = useSyncExternalStore(noop, () => true, () => false)
  const status: OfferStatus = !hotel.online || !room.room_type_id ? 'contact'
    : q.isPending || !hydrated ? 'loading'
    : q.isError ? 'error'
    : !offer || offer.state === 'unmapped' || offer.state === 'no_rates' ? 'contact'
    : offer.state
  const plans = status === 'available' ? offer!.plans : []
  // Không có ?plan= (hoặc gói đó không còn) thì chọn gói rẻ nhất.
  const plan = plans.find(p => p.rate_plan_id === planId) ?? [...plans].sort((a, b) => a.total - b.total)[0]
  const setPlan = (id: string) => setParams(new URLSearchParams({ plan: id }).toString())
  return { stay, setStay, status, offer, plans, plan, setPlan, retry: () => q.refetch() }
}

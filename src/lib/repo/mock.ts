// Repo giả lập. Phần nội dung (hotel, room type) đọc đồng bộ để trang dựng tĩnh;
// phần phòng trống + giá theo ngày là async, giống lời gọi Gohost
// GET /properties/{tenant_id}/room_types/search?checkin_date&checkout_date&occupancy_adults&occupancy_children.
import { DEMO_SOLD, FULL_NIGHTS, HOTELS, RATE_PLANS, ROOM_TYPES } from '@/data/hotels'
import { HOTELS_EN, PLAN_NAMES_EN, ROOMS_EN } from '@/data/hotels.en'
import { addDays, diffDays, isWeekendNight, nightsBetween, TODAY } from '../format'
import { daysBreakdown } from '../pricing'
import type { DayPrice, Hotel, Locale, RatePlan, RoomType, Stay } from '../types'

const wait = () => new Promise(r => setTimeout(r, 350 + Math.random() * 300))

export interface PlanOffer { plan: RatePlan; days_breakdown: DayPrice[]; nightly: number; total: number }
export interface RoomOffer { rt: RoomType; left: number; fits: boolean; plans: PlanOffer[] }

const roomsOf = (hotelId: string) => ROOM_TYPES.filter(r => r.hotel_id === hotelId)
const plansOf = (rtId: string) => RATE_PLANS.filter(p => p.room_type_id === rtId)

// Bản dịch ghép đè lên bản tiếng Việt (CMS thật trả thẳng nội dung theo ngôn ngữ).
function localizeHotel(h: Hotel, locale: Locale): Hotel {
  const en = HOTELS_EN[h.id]
  if (locale === 'vi' || !en) return h
  return {
    ...h, ...en,
    facts: h.facts.map((f, i) => ({ ...f, label: en.facts[i][0], value: en.facts[i][1] })),
    amenities: h.amenities.map((a, i) => ({ ...a, label: en.amenities[i] })),
    restaurants: h.restaurants.map((r, i) => ({ ...r, meta: en.restaurants[i][0], desc: en.restaurants[i][1] })),
    experiences: h.experiences.map((e, i) => ({ ...e, name: en.experiences[i][0], desc: en.experiences[i][1] })),
  }
}
const localizeRoom = (rt: RoomType, locale: Locale): RoomType => (locale === 'en' ? { ...rt, ...ROOMS_EN[rt.room_type_id] } : rt)
const localizePlan = (p: RatePlan, locale: Locale): RatePlan =>
  locale === 'en' ? { ...p, name: p.has_breakfast ? PLAN_NAMES_EN.breakfast : PLAN_NAMES_EN.roomOnly } : p

function leftOn(rt: RoomType, day: string) {
  const s = DEMO_SOLD[rt.room_type_id]
  if (FULL_NIGHTS.includes(day) || (s.full_month && day.startsWith(s.full_month))) return 0
  return Math.max(0, rt.quantity - (isWeekendNight(day) ? s.weekend : s.base))
}
const leftFor = (rt: RoomType, stay: Stay) => Math.min(...nightsBetween(stay.checkin, stay.checkout).map(d => leftOn(rt, d)))
const fits = (rt: RoomType, stay: Stay) => stay.adults <= rt.max_adults && stay.children <= rt.max_children

function offer(rt: RoomType, stay: Stay, locale: Locale): RoomOffer {
  const nights = diffDays(stay.checkin, stay.checkout)
  return {
    rt: localizeRoom(rt, locale), left: leftFor(rt, stay), fits: fits(rt, stay),
    plans: plansOf(rt.room_type_id).map(p => {
      const plan = localizePlan(p, locale)
      const days_breakdown = daysBreakdown(rt, plan, stay.checkin, stay.checkout)
      const total = days_breakdown.reduce((s, d) => s + d.price, 0)
      return { plan, days_breakdown, nightly: Math.round(total / nights / 1000) * 1000, total }
    }),
  }
}

export const mockRepo = {
  // --- nội dung (Rooty CMS, mỗi ngôn ngữ một bản) ---
  listHotels: (locale: Locale): Hotel[] => HOTELS.map(h => localizeHotel(h, locale)),
  getHotel: (slug: string, locale: Locale): Hotel | null => {
    const h = HOTELS.find(x => x.slug === slug)
    return h ? localizeHotel(h, locale) : null
  },
  hotelSlugs: () => HOTELS.map(h => h.slug),
  /** Giá thấp nhất/đêm ngoài mùa cao điểm, để hiện "Giá từ" khi khách chưa chọn ngày. */
  fromPrice: (hotelId: string) => Math.min(...roomsOf(hotelId).flatMap(rt => plansOf(rt.room_type_id).map(p => Math.round((rt.base_price * p.factor) / 1000) * 1000))),

  // --- phòng trống + giá theo ngày (Gohost) ---
  async searchRooms(hotelId: string, stay: Stay, locale: Locale): Promise<RoomOffer[]> {
    await wait()
    return roomsOf(hotelId).map(rt => offer(rt, stay, locale))
  },

  /** Khi khách sạn kín phòng: tìm tối đa 3 khoảng cùng số đêm, trong ±10 ngày, còn hạng phòng đủ chỗ. */
  async suggestStays(hotelId: string, stay: Stay): Promise<Stay[]> {
    await wait()
    const nights = diffDays(stay.checkin, stay.checkout)
    const out: Stay[] = []
    for (const shift of [-1, 1, -2, 2, -3, 3, 4, 5, 6, 7, 8, 9, 10]) {
      const checkin = addDays(stay.checkin, shift)
      if (checkin < TODAY) continue
      const s = { ...stay, checkin, checkout: addDays(checkin, nights) }
      if (roomsOf(hotelId).some(rt => fits(rt, s) && leftFor(rt, s) > 0)) out.push(s)
      if (out.length === 3) break
    }
    return out.sort((a, b) => a.checkin.localeCompare(b.checkin))
  },
}

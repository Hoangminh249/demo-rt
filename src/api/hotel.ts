// Khách sạn + phòng: nội dung Rooty (src/content) ghép với phòng trống, giá Gohost (src/api/gohost.ts) theo ID.
// Cửa duy nhất để trang server lấy dữ liệu khách sạn — component KHÔNG import src/content hay src/lib/gohost.
// Đổi nơi lưu nội dung (CMS) sau này: chỉ sửa file này, giữ nguyên tên hàm và kiểu trả về.
import 'server-only'
import { HOTELS } from '@/content'
import { isGohostError } from '@/lib/gohost'
import { minDefaultRate } from '@/lib/rooms'
import { table, tr } from '@/lib/tr'
import type { Locale, L } from '@/types/global'
import type { Hotel, HotelContent, RoomAvailability } from '@/types/hotel'
import type { BookingTarget } from '@/types/booking'
import { gohostApi } from './gohost'

function localize(h: HotelContent, locale: Locale): Hotel {
  const t = (l: L) => tr(l, locale)
  return {
    slug: h.slug,
    code: h.code,
    online: h.gohost_tenant_id !== null,
    opening: h.opening,
    name: h.name,
    area: t(h.area),
    address: t(h.address),
    map_url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(h.map_query)}`,
    operator: h.operator,
    tagline: t(h.tagline),
    description: t(h.description),
    highlights: h.highlights.map(t),
    facts: h.facts.map(f => ({ icon: f.icon, label: t(f.label), value: t(f.value) })),
    included: h.included.map(i => ({ icon: i.icon, label: t(i.label), desc: i.desc && t(i.desc) })),
    not_available: h.not_available.map(t),
    getting_here: h.getting_here.map(g => ({ title: t(g.title), body: g.body && t(g.body), tables: g.tables.map(x => table(x, locale)), notes: g.notes.map(t) })),
    policies: h.policies.map(([k, v]) => [t(k), t(v)]),
    children: h.children && table(h.children, locale),
    cancel_summary: t(h.cancel_summary),
    faq: h.faq.map(([q, a]) => [t(q), t(a)]),
    cover: h.cover,
    gallery: h.gallery,
    hero: h.hero,
    rooms: h.rooms.map(r => ({
      room_type_id: r.gohost_room_type_id,
      slug: r.slug,
      name: t(r.name),
      size: t(r.size),
      beds: r.beds && t(r.beds),
      view: r.view && t(r.view),
      features: r.features.map(t),
      description: t(r.description),
      note: r.note && t(r.note),
      images: r.images,
    })),
  }
}

const content = (slug: string) => HOTELS.find(h => h.slug === slug)

export const hotelApi = {
  // --- nội dung (src/content) ---
  list: (locale: Locale): Hotel[] => HOTELS.map(h => localize(h, locale)),
  get: (slug: string, locale: Locale): Hotel | null => {
    const h = content(slug)
    return h ? localize(h, locale) : null
  },
  slugs: () => HOTELS.map(h => h.slug),
  roomParams: () => HOTELS.flatMap(h => h.rooms.map(r => ({ slug: h.slug, room: r.slug }))),
  /** Khách sạn + phòng cho các bước đặt phòng (?hotel=&room=). null khi URL sai. */
  bookingTarget: (hotel: string | undefined, room: string | undefined, locale: Locale): BookingTarget | null => {
    const h = hotel ? content(hotel) : undefined
    const r = h?.rooms.find(x => x.slug === room)
    if (!h || !r) return null
    const l = localize(h, locale)
    return {
      hotel: { slug: l.slug, code: l.code, name: l.name, online: l.online, opening: l.opening, cancel_summary: l.cancel_summary, address: l.address, map_url: l.map_url },
      room: l.rooms.find(x => x.slug === room)!,
      times: { checkin: l.policies[0]?.[1] ?? '', checkout: l.policies[1]?.[1] ?? '' }, // file KS mở đầu bằng Nhận phòng, Trả phòng
      children: l.children,
    }
  },

  // --- Gohost ---
  /** "Giá từ …/đêm". null khi KS chưa nối Gohost, chưa ánh xạ phòng, hoặc Gohost lỗi — UI ẩn giá, không đoán. */
  async fromPrice(slug: string): Promise<number | null> {
    const h = content(slug)
    if (!h?.gohost_tenant_id) return null
    try {
      const property = (await gohostApi.properties()).find(p => p.id === h.gohost_tenant_id)
      const mapped = new Set(h.rooms.flatMap(r => (r.gohost_room_type_id ? [r.gohost_room_type_id] : [])))
      return property ? minDefaultRate(property.room_types ?? [], mapped) : null
    } catch (e) {
      if (isGohostError(e)) return null
      throw e
    }
  },

  /** Phòng trống + gói giá theo khoảng ngày, mọi hạng phòng Gohost (kể cả hết phòng). Ném GohostError khi lỗi. */
  async availability(slug: string, checkin: string, checkout: string): Promise<RoomAvailability[]> {
    const tenant = content(slug)?.gohost_tenant_id
    if (!tenant) return []
    return (await gohostApi.roomTypes({ tenant, checkin, checkout })).map(rt => ({
      room_type_id: rt.id,
      title: rt.title,
      quantity: rt.quantity ?? 0,
      occ_adults: rt.occ_adults ?? 0,
      occ_children: rt.occ_children ?? 0,
      occ_infants: rt.occ_infants ?? 0,
      plans: (rt.rate_plans ?? []).map(p => ({
        rate_plan_id: p.id,
        title: p.title,
        has_breakfast: Boolean(p.has_breakfast),
        days_breakdown: p.days_breakdown ?? [],
        total: p.estimated_total_price ?? (p.days_breakdown ?? []).reduce((sum, d) => sum + d.price, 0),
      })),
    }))
  },
}

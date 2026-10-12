// Khách sạn + phòng: nội dung Rooty (src/content) ghép với phòng trống + giá theo ID.
// Nguồn giá + tồn: DATA_SOURCE=db → Postgres của Rooty (src/api/inventory.ts, ghép theo slug hạng phòng);
// mặc định → Gohost (src/api/gohost.ts, ghép theo gohost_room_type_id).
// Cửa duy nhất để trang server lấy dữ liệu khách sạn — component KHÔNG import src/content hay src/lib/gohost.
// Đổi nơi lưu nội dung (CMS) sau này: chỉ sửa file này, giữ nguyên tên hàm và kiểu trả về.
import 'server-only'
import { HOTELS } from '@/content'
import { isDbSource } from '@/lib/db'
import { today } from '@/lib/format'
import { isGohostError } from '@/lib/gohost'
import { minDefaultRate } from '@/lib/rooms'
import { firstCheckin } from '@/lib/stay'
import { table, tr } from '@/lib/tr'
import type { Locale, L } from '@/types/global'
import type { DayPrice, Hotel, HotelContent, RoomAvailability } from '@/types/hotel'
import type { BookingTarget } from '@/types/booking'
import { gohostApi } from './gohost'
import { inventoryApi } from './inventory'

function localize(h: HotelContent, locale: Locale): Hotel {
  const t = (l: L) => tr(l, locale)
  return {
    slug: h.slug,
    code: h.code,
    online: isDbSource() || h.gohost_tenant_id !== null,
    calendar: isDbSource(),
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
      room_type_id: isDbSource() ? r.slug : r.gohost_room_type_id,
      slug: r.slug,
      name: t(r.name),
      size: t(r.size),
      beds: r.beds && t(r.beds),
      view: r.view && t(r.view),
      features: r.features.map(t),
      description: t(r.description),
      tagline: r.tagline && t(r.tagline),
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

  // --- Giá + phòng trống (Gohost hoặc Postgres) ---
  /** "Giá từ …/đêm". null khi chưa có giá, chưa nối nguồn, hoặc nguồn lỗi — UI ẩn giá, không đoán. */
  async fromPrice(slug: string): Promise<number | null> {
    const h = content(slug)
    if (h && isDbSource()) {
      return inventoryApi.fromPrice(slug, firstCheckin(today(), h.opening)).catch(e => {
        if (!(e instanceof Error && e.message === 'DB_UNAVAILABLE')) console.error('[db] fromPrice', e)
        return null
      })
    }
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

  /** Phòng trống + gói giá theo khoảng ngày, mọi hạng phòng (kể cả hết phòng). Ném GohostError / lỗi DB khi lỗi. */
  async availability(slug: string, checkin: string, checkout: string): Promise<RoomAvailability[]> {
    if (isDbSource()) return inventoryApi.availability(slug, checkin, checkout)
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

  /** Lịch giá thấp nhất từng đêm, 90 ngày từ `from` (chỉ nguồn db; Gohost không có giá theo ngày rẻ lượt gọi). */
  calendar: (slug: string, from: string, room: string | null): Promise<DayPrice[]> =>
    isDbSource() ? inventoryApi.calendar(slug, from, undefined, room) : Promise.resolve([]),
}

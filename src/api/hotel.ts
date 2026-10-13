// Khách sạn + phòng: nội dung (src/api/catalog.ts, Postgres) ghép với phòng trống + giá (src/api/inventory.ts, theo slug hạng phòng).
// Cửa duy nhất để trang server lấy dữ liệu khách sạn — component KHÔNG import src/content hay src/api.
import 'server-only'
import { today } from '@/lib/format'
import { firstCheckin } from '@/lib/stay'
import { table, tr } from '@/lib/tr'
import type { Locale, L } from '@/types/global'
import type { DayPrice, Hotel, HotelContent, RoomAvailability } from '@/types/hotel'
import type { BookingTarget } from '@/types/booking'
import { catalogApi } from './catalog'
import { inventoryApi } from './inventory'

function localize(h: HotelContent, locale: Locale): Hotel {
  const t = (l: L) => tr(l, locale)
  return {
    slug: h.slug,
    code: h.code,
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
      room_type_id: r.slug,
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

const content = async (slug: string) => (await catalogApi.contents()).find(h => h.slug === slug)

export const hotelApi = {
  // --- nội dung (catalog) ---
  list: async (locale: Locale): Promise<Hotel[]> => (await catalogApi.contents()).map(h => localize(h, locale)),
  get: async (slug: string, locale: Locale): Promise<Hotel | null> => {
    const h = await content(slug)
    return h ? localize(h, locale) : null
  },
  slugs: async () => (await catalogApi.contents()).map(h => h.slug),
  /** Khách sạn + phòng cho các bước đặt phòng (?hotel=&room=). null khi URL sai. */
  bookingTarget: async (hotel: string | undefined, room: string | undefined, locale: Locale): Promise<BookingTarget | null> => {
    const h = hotel ? await content(hotel) : undefined
    const r = h?.rooms.find(x => x.slug === room)
    if (!h || !r) return null
    const l = localize(h, locale)
    return {
      hotel: { slug: l.slug, code: l.code, name: l.name, opening: l.opening, cancel_summary: l.cancel_summary, address: l.address, map_url: l.map_url },
      room: l.rooms.find(x => x.slug === room)!,
      times: { checkin: l.policies[0]?.[1] ?? '', checkout: l.policies[1]?.[1] ?? '' }, // file KS mở đầu bằng Nhận phòng, Trả phòng
      children: l.children,
    }
  },

  // --- Giá + phòng trống (Postgres) ---
  /** "Giá từ …/đêm". null khi chưa có giá hoặc DB lỗi — UI ẩn giá, không đoán. */
  async fromPrice(slug: string): Promise<number | null> {
    const h = await content(slug)
    if (!h) return null
    return inventoryApi.fromPrice(slug, firstCheckin(today(), h.opening)).catch(e => {
      if (!(e instanceof Error && e.message === 'DB_UNAVAILABLE')) console.error('[db] fromPrice', e)
      return null
    })
  },

  /** Phòng trống + gói giá theo khoảng ngày, mọi hạng phòng (kể cả hết phòng). Ném lỗi DB khi lỗi. */
  availability: (slug: string, checkin: string, checkout: string): Promise<RoomAvailability[]> => inventoryApi.availability(slug, checkin, checkout),

  /** Lịch giá thấp nhất từng đêm, 90 ngày từ `from`. */
  calendar: (slug: string, from: string, room: string | null): Promise<DayPrice[]> => inventoryApi.calendar(slug, from, undefined, room),
}

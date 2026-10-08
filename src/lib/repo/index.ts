// Cửa duy nhất để UI lấy dữ liệu. Component KHÔNG import src/content hay src/lib/gohost trực tiếp.
// Nội dung (ảnh, mô tả, chính sách, bản dịch) từ src/content; phòng, giá, tồn từ Gohost (chỉ GET, qua src/lib/gohost).
// Đổi nơi lưu nội dung (CMS) sau này: chỉ sửa file này, giữ nguyên tên hàm và kiểu trả về.
import 'server-only'
import { HOTELS, SITE } from '@/content'
import { PAGES } from '@/content/pages'
import { getProperties, getRoomTypes, isGohostError } from '../gohost'
import { minDefaultRate } from '../rooms'
import type { BookingTarget, Hotel, HotelContent, InfoTable, InfoTableContent, L, Locale, Page, PageSlug, RoomAvailability } from '../types'

const tr = (l: L, locale: Locale) => (locale === 'en' && l.en) || l.vi
const table = (x: InfoTableContent, locale: Locale): InfoTable => ({
  caption: tr(x.caption, locale),
  head: x.head.map(h => tr(h, locale)),
  rows: x.rows.map(r => r.map(c => tr(c, locale))),
  note: x.note && tr(x.note, locale),
})

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
const CANCEL_KEYS = ['Huỷ phòng', 'Đổi ngày', 'Lễ, Tết', 'Gián đoạn phương tiện ra đảo']

export const repo = {
  // --- nội dung (src/content) ---
  listHotels: (locale: Locale): Hotel[] => HOTELS.map(h => localize(h, locale)),
  getHotel: (slug: string, locale: Locale): Hotel | null => {
    const h = content(slug)
    return h ? localize(h, locale) : null
  },
  hotelSlugs: () => HOTELS.map(h => h.slug),
  site: (locale: Locale) => ({ ...SITE, owner: { ...SITE.owner, address: tr(SITE.owner.address, locale) } }),
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
  roomParams: () => HOTELS.flatMap(h => h.rooms.map(r => ({ slug: h.slug, room: r.slug }))),
  page: (slug: PageSlug, locale: Locale): Page => {
    const p = PAGES[slug]
    const t = (l: L) => tr(l, locale)
    return {
      slug, eyebrow: t(p.eyebrow), title: t(p.title), lead: t(p.lead), updated: p.updated, draft: p.draft,
      sections: p.sections.map(s => ({ id: s.id, title: t(s.title), body: s.body.map(t), list: s.list?.map(t), link: s.link && { href: s.link.href, label: t(s.link.label) } })),
    }
  },
  /** Các dòng huỷ / đổi ngày / lễ Tết / gián đoạn trong chính sách từng khách sạn — trang huỷ đọc thẳng, không chép lại. */
  cancelPolicies: (locale: Locale) => HOTELS.map(h => ({
    slug: h.slug,
    name: h.name,
    rows: h.policies.filter(([k]) => CANCEL_KEYS.includes(k.vi)).map(([k, v]) => [tr(k, locale), tr(v, locale)] as [string, string]),
  })),

  // --- Gohost ---
  /** "Giá từ …/đêm". null khi KS chưa nối Gohost, chưa ánh xạ phòng, hoặc Gohost lỗi — UI ẩn giá, không đoán. */
  async fromPrice(slug: string): Promise<number | null> {
    const h = content(slug)
    if (!h?.gohost_tenant_id) return null
    try {
      const property = (await getProperties()).find(p => p.id === h.gohost_tenant_id)
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
    return (await getRoomTypes(tenant, checkin, checkout)).map(rt => ({
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

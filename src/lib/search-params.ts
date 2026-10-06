// Bộ lọc tìm kiếm ↔ URL (chia sẻ link được).
import type { SearchQuery } from './repo'
import type { Area, HotelTag } from './types'
import { addDays, diffDays, isISODate, TODAY } from './format'

export const DEFAULT_SEARCH = { checkin: '2026-10-12', checkout: '2026-10-15', adults: 2, children: 1, rooms: 1, ages: [6] }

export interface SearchState extends SearchQuery { ages: number[]; view?: 'list' | 'map' }

const num = (v: string | null, d: number, min: number, max: number) => {
  const n = Number(v)
  return v != null && Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : d
}
const list = (v: string | null) => (v ? v.split(',').filter(Boolean) : [])

export function parseSearch(sp: URLSearchParams | { get(k: string): string | null }): SearchState {
  let checkin = sp.get('in')
  let checkout = sp.get('out')
  if (!isISODate(checkin) || checkin < TODAY) checkin = DEFAULT_SEARCH.checkin
  if (!isISODate(checkout) || checkout <= checkin) checkout = addDays(checkin, 3)
  if (diffDays(checkin, checkout) > 30) checkout = addDays(checkin, 30)
  const children = num(sp.get('c'), DEFAULT_SEARCH.children, 0, 6)
  const ages = list(sp.get('ages')).map(Number).filter(n => n >= 0 && n <= 17)
  return {
    dest: sp.get('dest') ?? '',
    checkin, checkout,
    adults: num(sp.get('a'), DEFAULT_SEARCH.adults, 1, 12),
    children,
    ages: Array.from({ length: children }, (_, i) => ages[i] ?? 6),
    rooms: num(sp.get('r'), DEFAULT_SEARCH.rooms, 1, 6),
    areas: list(sp.get('area')) as Area[],
    stars: list(sp.get('stars')).map(Number),
    tags: list(sp.get('tags')) as HotelTag[],
    maxPrice: sp.get('max') ? Number(sp.get('max')) : undefined,
    sort: (sp.get('sort') as SearchQuery['sort']) ?? 'recommended',
    promo: sp.get('promo') ?? undefined,
    view: sp.get('view') === 'map' ? 'map' : 'list',
  }
}

export function searchToParams(s: Partial<SearchState>): string {
  const p = new URLSearchParams()
  if (s.dest) p.set('dest', s.dest)
  if (s.checkin) p.set('in', s.checkin)
  if (s.checkout) p.set('out', s.checkout)
  if (s.adults != null) p.set('a', String(s.adults))
  if (s.children != null) p.set('c', String(s.children))
  if (s.ages?.length && s.children) p.set('ages', s.ages.slice(0, s.children).join(','))
  if (s.rooms != null) p.set('r', String(s.rooms))
  if (s.areas?.length) p.set('area', s.areas.join(','))
  if (s.stars?.length) p.set('stars', s.stars.join(','))
  if (s.tags?.length) p.set('tags', s.tags.join(','))
  if (s.maxPrice) p.set('max', String(s.maxPrice))
  if (s.sort && s.sort !== 'recommended') p.set('sort', s.sort)
  if (s.promo) p.set('promo', s.promo)
  if (s.view === 'map') p.set('view', 'map')
  return p.toString()
}

/** Link đặt phòng cho một hạng phòng + gói. */
export const bookingHref = (hotelSlug: string, s: Pick<SearchState, 'checkin' | 'checkout' | 'adults' | 'children' | 'rooms'> & { ages?: number[]; promo?: string }, roomTypeId?: string, ratePlanId?: string) => {
  const p = new URLSearchParams(searchToParams(s))
  if (roomTypeId) p.set('room', roomTypeId)
  if (ratePlanId) p.set('plan', ratePlanId)
  return `/${hotelSlug}/dat-phong?${p}`
}

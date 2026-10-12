// Nội dung khách sạn (chữ, ảnh, tiện ích, hạng phòng) — một cửa cho web + admin. Chỉ server.
// Nguồn db: đọc Postgres (admin sửa được), dựng lại đúng kiểu HotelContent như file src/content để UI không đổi.
// Nguồn gohost, hoặc DB lỗi / đang `next build`: đọc src/content (file). Cache tag 'catalog' — admin ghi xong gọi revalidateCatalog().
import 'server-only'
import { revalidateTag, unstable_cache } from 'next/cache'
import { HOTELS } from '@/content'
import { db, isDbSource } from '@/lib/db'
import type { HotelContent, RoomContent } from '@/types/hotel'

export const CATALOG_TAG = 'catalog'

const iso = (d: Date) => d.toISOString().slice(0, 10)
const EMPTY_L = { vi: '' }

/** Phần trình bày lưu trong Hotel.content (Json). Khách sạn mới tạo ở admin có thể thiếu field → điền mặc định. */
type HotelJson = Pick<HotelContent, 'tagline' | 'description' | 'highlights' | 'facts' | 'getting_here' | 'policies' | 'children' | 'cancel_summary' | 'faq' | 'pending' | 'en_review'>
const HOTEL_DEFAULTS: HotelJson = {
  tagline: EMPTY_L, description: EMPTY_L, highlights: [], facts: [], getting_here: [], policies: [], children: null,
  cancel_summary: EMPTY_L, faq: [], pending: [], en_review: false,
}
type RoomJson = Pick<RoomContent, 'features' | 'view' | 'tagline' | 'note'>

async function load(all: boolean): Promise<HotelContent[]> {
  const hotels = await db().hotel.findMany({
    where: all ? { status: { not: 'ARCHIVED' } } : { status: 'PUBLISHED' },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    include: {
      media: { orderBy: { sortOrder: 'asc' }, include: { media: { select: { path: true } } } },
      amenities: { orderBy: { sortOrder: 'asc' }, include: { amenity: true } },
      roomTypes: {
        where: all ? { status: { not: 'ARCHIVED' } } : { status: 'PUBLISHED' },
        orderBy: { sortOrder: 'asc' },
        include: { media: { orderBy: { sortOrder: 'asc' }, include: { media: { select: { path: true } } } } },
      },
    },
  })
  return hotels.map(h => {
    const content = { ...HOTEL_DEFAULTS, ...(h.content as Partial<HotelJson>) }
    const gallery = h.media.filter(m => m.kind === 'GALLERY')
    return {
      ...content,
      slug: h.slug, code: h.code, gohost_tenant_id: h.gohostTenantId,
      opening: h.openingDate ? iso(h.openingDate) : null,
      name: h.name, area: h.area as unknown as HotelContent['area'], address: h.address as unknown as HotelContent['address'],
      map_query: h.mapQuery, operator: h.operator,
      included: h.amenities.filter(a => a.available).map(a => ({
        icon: (a.amenity.icon ?? 'receipt') as HotelContent['included'][number]['icon'],
        label: a.amenity.name as unknown as HotelContent['included'][number]['label'],
        ...(a.description ? { desc: a.description as unknown as HotelContent['included'][number]['label'] } : {}),
      })),
      not_available: h.amenities.filter(a => !a.available).map(a => a.amenity.name as unknown as HotelContent['not_available'][number]),
      cover: gallery.find(m => m.isCover)?.media.path ?? gallery[0]?.media.path ?? null,
      gallery: gallery.map(m => m.media.path),
      hero: h.media.filter(m => m.kind === 'HERO').map(m => ({ src: m.media.path, focus: m.focus ?? 'center' })),
      rooms: h.roomTypes.map(rt => ({
        ...(rt.content as Partial<RoomJson>),
        features: (rt.content as Partial<RoomJson>).features ?? [],
        gohost_room_type_id: rt.gohostRoomTypeId,
        slug: rt.slug,
        name: rt.name as unknown as RoomContent['name'],
        size: rt.size as unknown as RoomContent['size'],
        ...(rt.beds ? { beds: rt.beds as unknown as RoomContent['size'] } : {}),
        description: rt.description as unknown as RoomContent['description'],
        images: rt.media.map(m => m.media.path),
      })),
    }
  })
}

const cached = unstable_cache(load, ['catalog-v1'], { tags: [CATALOG_TAG], revalidate: 300 })

/**
 * Khách sạn cho web (`all` = false: chỉ PUBLISHED) hoặc admin (`all` = true: cả DRAFT).
 * Nguồn gohost / DB lỗi / đang build → nội dung file src/content.
 */
async function contents(all = false): Promise<HotelContent[]> {
  if (!isDbSource()) return HOTELS
  try {
    return await cached(all)
  } catch (e) {
    if (!(e instanceof Error && e.message === 'DB_UNAVAILABLE')) console.error('[catalog] đọc DB lỗi, dùng src/content', e)
    return HOTELS
  }
}

/** Admin ghi xong: web thấy ngay (trang tĩnh dựng lại ở lượt xem kế tiếp). */
export const revalidateCatalog = () => revalidateTag(CATALOG_TAG, { expire: 0 })

export const catalogApi = { contents, revalidate: revalidateCatalog }

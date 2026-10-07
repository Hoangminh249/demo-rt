// Dữ liệu cho /admin (chỉ xem): đối chiếu nội dung Rooty (src/content) với Gohost theo ID, đếm chỗ thiếu, lập danh sách việc.
// Không ghi gì: sửa nội dung là sửa src/content/*.ts (commit), sửa giá / phòng / booking là làm trong Gohost.
import 'server-only'
import { cache } from 'react'
import { HOTELS } from '@/content'
import { getBooking, getBookings, getProperties, gohostStatus, isGohostError, type GhRoomType, type GohostErrorCode } from '../gohost'
import { repo } from './index'
import type { HotelContent, L, RoomAvailability, RoomContent } from '../types'

export type { GohostErrorCode } from '../gohost'

/** ok = đọc được trên Gohost · none = nội dung chưa có tenant · unknown = không đọc được Gohost · missing = tenant không có trên Gohost */
export type ConnectState = 'ok' | 'none' | 'unknown' | 'missing'

export interface HotelCheck {
  slug: string
  name: string
  area: string
  opening: string | null
  cover: string | null
  tenant: string | null
  state: ConnectState
  ghRooms: GhRoomType[]
  unmappedGohost: GhRoomType[] // hạng trên Gohost chưa có nội dung → web không hiện
  orphanContent: RoomContent[] // nội dung trỏ tới ID không có trên Gohost
  unlinkedContent: RoomContent[] // nội dung chưa có gohost_room_type_id
  contentRooms: RoomContent[]
  photos: { src: string; label: string }[]
  roomsWithPhotos: number
  enMissing: number
  enReview: boolean
  pending: string[]
  fromPrice: number | null
}

export interface Issue { level: 'chan' | 'sua'; hotel: string; title: string; desc: string; go: string; href: string }

// ---------- Đếm chữ thiếu bản dịch ----------
const isL = (v: unknown): v is L => !!v && typeof v === 'object' && 'vi' in v && typeof (v as L).vi === 'string'
function collectL(v: unknown, out: L[] = []): L[] {
  if (isL(v)) out.push(v)
  else if (Array.isArray(v)) v.forEach(x => collectL(x, out))
  else if (v && typeof v === 'object') Object.values(v).forEach(x => collectL(x, out))
  return out
}
const missingEn = (v: unknown) => collectL(v).filter(l => !l.en?.trim()).length
const missingVi = (v: unknown) => collectL(v).filter(l => !l.vi.trim()).length

function photosOf(h: HotelContent) {
  const seen = new Set<string>()
  const out: { src: string; label: string }[] = []
  const add = (src: string, label: string) => { if (!seen.has(src)) { seen.add(src); out.push({ src, label }) } }
  if (h.cover) add(h.cover, `Ảnh bìa · ${h.cover.split('/').pop()}`)
  h.gallery.forEach(src => add(src, src.split('/').pop() ?? src))
  h.rooms.forEach(r => r.images.forEach(src => add(src, `${r.name.vi} · ${src.split('/').pop()}`)))
  return out
}

/** Danh mục Gohost (cache 1 giờ); lỗi thì trả mã lỗi, không ném. */
const readCatalog = cache(async () => {
  try {
    return { properties: await getProperties(), error: null as GohostErrorCode | null }
  } catch (e) {
    if (isGohostError(e)) return { properties: null, error: e.message }
    throw e
  }
})

async function check(h: HotelContent): Promise<HotelCheck> {
  const { properties, error } = await readCatalog()
  const property = h.gohost_tenant_id && properties ? properties.find(p => p.id === h.gohost_tenant_id) : undefined
  const state: ConnectState = !h.gohost_tenant_id ? 'none' : error || !properties ? 'unknown' : property ? 'ok' : 'missing'
  const ghRooms = state === 'ok' ? (property?.room_types ?? []) : []
  const ghIds = new Set(ghRooms.map(r => r.id))
  const contentIds = new Set(h.rooms.flatMap(r => (r.gohost_room_type_id ? [r.gohost_room_type_id] : [])))
  return {
    slug: h.slug,
    name: h.name,
    area: h.area.vi,
    opening: h.opening,
    cover: h.cover,
    tenant: h.gohost_tenant_id,
    state,
    ghRooms,
    unmappedGohost: ghRooms.filter(r => !contentIds.has(r.id) && !r.is_virtual),
    orphanContent: state === 'ok' ? h.rooms.filter(r => r.gohost_room_type_id && !ghIds.has(r.gohost_room_type_id)) : [],
    unlinkedContent: h.rooms.filter(r => !r.gohost_room_type_id),
    contentRooms: h.rooms,
    photos: photosOf(h),
    roomsWithPhotos: h.rooms.filter(r => r.images.length).length,
    enMissing: missingEn(h),
    enReview: Boolean(h.en_review),
    pending: h.pending,
    fromPrice: await repo.fromPrice(h.slug),
  }
}

const short = (name: string) => name.split(' ')[0]
const quote = (list: { title?: string; name?: L }[]) => list.map(x => `“${x.title ?? x.name?.vi}”`).join(', ')

export function issuesOf(checks: HotelCheck[]): Issue[] {
  const out: Issue[] = []
  for (const c of checks) {
    const href = (tab: string) => `/admin/hotels/${c.slug}?tab=${tab}`
    if (c.state === 'none') out.push({ level: 'chan', hotel: c.name, title: 'Chưa nối Gohost', desc: 'Nội dung chưa có gohost_tenant_id: web không có giá, phòng trống trực tuyến, chỉ có nút liên hệ.', go: `Mở ${short(c.name)}`, href: href('phong') })
    if (c.state === 'missing') out.push({ level: 'chan', hotel: c.name, title: 'Không thấy khách sạn trên Gohost', desc: `gohost_tenant_id “${c.tenant}” không khớp property nào mà key đọc được.`, go: `Mở ${short(c.name)}`, href: href('phong') })
    if (c.unmappedGohost.length) out.push({ level: 'chan', hotel: c.name, title: `${c.unmappedGohost.length} hạng phòng Gohost chưa có nội dung`, desc: `Gohost có ${quote(c.unmappedGohost)}, chưa gắn với nội dung nào nên web chưa hiện.`, go: 'Ánh xạ phòng', href: href('phong') })
    if (c.orphanContent.length) out.push({ level: 'chan', hotel: c.name, title: `${c.orphanContent.length} hạng phòng trỏ tới ID không có trên Gohost`, desc: `${quote(c.orphanContent)} có gohost_room_type_id sai: web không lấy được giá.`, go: 'Ánh xạ phòng', href: href('phong') })
    if (c.state === 'ok' && c.unlinkedContent.length) out.push({ level: 'sua', hotel: c.name, title: `${c.unlinkedContent.length} hạng phòng chưa gắn Gohost`, desc: `${quote(c.unlinkedContent)} chưa có gohost_room_type_id: web hiện kèm nút liên hệ, chưa có giá.`, go: 'Ánh xạ phòng', href: href('phong') })
    const coverMissing = !c.cover
    const roomsMissing = c.contentRooms.length - c.roomsWithPhotos
    if (coverMissing || roomsMissing) out.push({ level: 'sua', hotel: c.name, title: coverMissing && !c.photos.length ? 'Chưa có ảnh' : 'Thiếu ảnh', desc: `${coverMissing ? 'Không có ảnh bìa, ' : ''}${c.roomsWithPhotos}/${c.contentRooms.length} hạng phòng có ảnh. Web đang hiện khung “Ảnh đang cập nhật”.`, go: 'Xem ảnh', href: href('anh') })
    if (c.enMissing) out.push({ level: 'sua', hotel: c.name, title: 'Thiếu bản tiếng Anh', desc: `${c.enMissing} mục chưa có bản tiếng Anh: trang /en hiện chữ tiếng Việt ở các mục đó.`, go: 'Xem nội dung', href: href('noi-dung') })
    else if (c.enReview) out.push({ level: 'sua', hotel: c.name, title: 'Bản tiếng Anh chờ duyệt', desc: 'Bản dịch soạn từ PDF tiếng Việt, Marketing chưa duyệt.', go: 'Xem nội dung', href: href('noi-dung') })
    if (c.pending.length) out.push({ level: 'sua', hotel: c.name, title: `${c.pending.length} chỗ tài liệu mâu thuẫn`, desc: 'Chờ khách sạn xác nhận. Web đang ghi bản ít hứa hơn.', go: 'Xem danh sách', href: href('noi-dung') })
  }
  return out.sort((a, b) => (a.level === b.level ? 0 : a.level === 'chan' ? -1 : 1))
}

/** Tổng quan: dùng chung cho trang Tổng quan và số đếm trên sidebar (cache() gộp trong một lượt render). */
export const overview = cache(async () => {
  const checks = await Promise.all(HOTELS.map(check))
  const { error } = await readCatalog()
  return { status: gohostStatus(), error, checks, issues: issuesOf(checks) }
})

export async function hotelCheck(slug: string) {
  const h = HOTELS.find(x => x.slug === slug)
  if (!h) return null
  const [c, { properties, error }] = await Promise.all([check(h), readCatalog()])
  return { check: c, error, content: h, properties: properties?.map(p => ({ id: p.id, title: p.title })) ?? null }
}

// ---------- Tab Nội dung: từng mục, đủ / thiếu theo ngôn ngữ ----------
export interface ContentRow { label: string; value: string; viMissing: number; enMissing: number }
export function contentRows(h: HotelContent): ContentRow[] {
  const row = (label: string, value: string, v: unknown): ContentRow => ({ label, value, viMissing: missingVi(v), enMissing: missingEn(v) })
  return [
    row('Tên, khu vực, địa chỉ', 'Đủ', [h.area, h.address, h.facts]),
    row('Mô tả, điểm nổi bật', 'Đủ', [h.tagline, h.description, h.highlights]),
    row('Đã gồm · không có', `${h.included.length} · ${h.not_available.length}`, [h.included, h.not_available]),
    row('Đi lại', `${h.getting_here.length} khối`, h.getting_here),
    row('Chính sách', `${h.policies.length} mục`, [h.policies, h.children, h.cancel_summary]),
    row('Hỏi đáp', `${h.faq.length} câu`, h.faq),
    row(`Hạng phòng (${h.rooms.length})`, 'Đủ', h.rooms),
  ]
}

// ---------- Giá & phòng trống: cùng lời gọi web đang dùng ----------
export async function availabilityCheck(slug: string, checkin: string, checkout: string): Promise<{ rooms: RoomAvailability[] | null; error: GohostErrorCode | null }> {
  try {
    return { rooms: await repo.availability(slug, checkin, checkout), error: null }
  } catch (e) {
    if (isGohostError(e)) return { rooms: null, error: e.message }
    throw e
  }
}

// ---------- Booking ----------
export const connectedHotels = () => HOTELS.filter(h => h.gohost_tenant_id).map(h => ({ slug: h.slug, name: h.name, tenant: h.gohost_tenant_id! }))

export async function bookingList(tenant: string, q: { start: string; end: string; status?: string; page?: number }) {
  try {
    return { data: await getBookings(tenant, q), error: null as GohostErrorCode | null }
  } catch (e) {
    if (isGohostError(e)) return { data: null, error: e.message }
    throw e
  }
}

export async function bookingDetail(tenant: string, code: string) {
  try {
    return { data: await getBooking(tenant, code), error: null as GohostErrorCode | null }
  } catch (e) {
    if (isGohostError(e)) return { data: null, error: e.message }
    throw e
  }
}

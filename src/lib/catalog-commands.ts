// Lệnh ghi SẢN PHẨM của admin (khách sạn, hạng phòng, phòng, tiện ích, ảnh, khuyến mãi, thuế phí) — đi cùng endpoint
// POST /api/admin/db với các lệnh giá/tồn (src/lib/admin-commands.ts). zod kiểm ở server; hook trình duyệt dùng chung kiểu.
// Không import gì của server.
import { z } from 'zod'
import type { IconKey } from '@/types/global'

const id = z.string().trim().min(1).max(40)
const date = z.iso.date()
const money = z.int().min(0).max(1_000_000_000)
const slug = z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Đường dẫn: chữ thường không dấu, số, gạch nối').max(60)
/** Slug khách sạn: 'new' là trang Thêm khách sạn của admin. */
const hotelSlug = slug.refine(v => v !== 'new', 'Đường dẫn "new" đã dùng cho trang admin')
const text = (max = 200) => z.string().trim().max(max)
/** Chữ hai ngôn ngữ; vi bắt buộc khi `required`. */
const L = (max = 300, required = true) => z.object({ vi: required ? text(max).min(1, 'Chưa nhập tiếng Việt') : text(max), en: text(max).optional() })
const Lopt = (max = 300) => L(max, false).optional()
/** Một hoặc nhiều email cách nhau bằng dấu phẩy (hộp thư team nhận booking). */
const emails = text(500).refine(v => v.split(',').every(e => z.email().safeParse(e.trim()).success), 'Email không hợp lệ (nhiều địa chỉ: cách nhau bằng dấu phẩy)')

export const ICON_KEYS = ['map-pin', 'clock', 'cable-car', 'door-open', 'plane', 'bus', 'ferris-wheel', 'coffee', 'wifi', 'shirt', 'receipt', 'washing-machine'] as const satisfies readonly IconKey[]
export const STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const

const table = z.object({ caption: L(200), head: z.array(L(100)).max(8), rows: z.array(z.array(L(300)).max(8)).max(40), note: Lopt(500) })

/** Phần trình bày của khách sạn (Hotel.content) — cùng hình HotelContent (src/types/hotel.ts). */
export const HotelContentIn = z.object({
  tagline: L(300, false),
  description: L(3000, false),
  highlights: z.array(L(300)).max(20),
  facts: z.array(z.object({ icon: z.enum(ICON_KEYS), label: L(80), value: L(200) })).max(12),
  getting_here: z.array(z.object({ title: L(150), body: Lopt(2000), tables: z.array(table).max(6), notes: z.array(L(600)).max(20) })).max(10),
  policies: z.array(z.tuple([L(120), L(1500)])).max(30),
  children: table.nullable(),
  cancel_summary: L(300, false),
  faq: z.array(z.tuple([L(300), L(2000)])).max(40),
  pending: z.array(text(500)).max(30),
  en_review: z.boolean(),
  /** Email team (Hotel.notifyEmail) nhận báo khi nào. Thiếu = báo cả hai. */
  notify: z.object({ booking: z.boolean(), cancel: z.boolean() }).optional(),
})

const orNull = <T extends z.ZodType>(s: T) => s.nullable()

export const CatalogCommand = z.discriminatedUnion('op', [
  z.object({ op: z.literal('hotel.create'), slug: hotelSlug, code: z.string().trim().regex(/^[A-Z0-9]{2,12}$/, 'Mã: 2–12 chữ in hoa / số'), name: text(120).min(1) }),
  z.object({
    op: z.literal('hotel.save'), id,
    slug: hotelSlug, code: z.string().trim().regex(/^[A-Z0-9]{2,12}$/), name: text(120).min(1), status: z.enum(STATUSES),
    area: L(120), address: L(300), mapQuery: text(200), lat: orNull(z.number().min(-90).max(90)), lng: orNull(z.number().min(-180).max(180)),
    stars: orNull(z.int().min(1).max(5)), checkInTime: z.string().regex(/^\d{2}:\d{2}$/), checkOutTime: z.string().regex(/^\d{2}:\d{2}$/),
    phone: orNull(text(40)), email: orNull(z.email().max(200)), zalo: orNull(z.url().max(300)), notifyEmail: orNull(emails),
    operator: text(200), openingDate: orNull(date), gohostTenantId: orNull(text(60)), sortOrder: z.int().min(0).max(999),
    content: HotelContentIn,
  }),
  z.object({ op: z.literal('hotel.delete'), id }),
  /** Gửi email thử tới hộp thư team đã lưu của khách sạn. */
  z.object({ op: z.literal('hotel.testNotify'), id }),

  z.object({
    op: z.literal('roomType.save'), id: id.optional(), hotelId: id, slug, status: z.enum(STATUSES),
    name: L(120), description: L(3000), size: L(60), beds: orNull(L(120)),
    maxAdults: z.int().min(1).max(20), maxChildren: z.int().min(0).max(10), maxOccupancy: z.int().min(1).max(30), baseOccupancy: z.int().min(1).max(20),
    totalRooms: z.int().min(0).max(999), sortOrder: z.int().min(0).max(999), gohostRoomTypeId: orNull(text(60)),
    content: z.object({ features: z.array(L(120)).max(30), view: Lopt(120), tagline: Lopt(200), note: Lopt(500) }),
  }).refine(r => r.baseOccupancy <= r.maxOccupancy && r.maxAdults <= r.maxOccupancy, { message: 'Số khách cơ bản / người lớn tối đa không vượt sức chứa tối đa' }),
  z.object({ op: z.literal('roomType.delete'), id }),

  z.object({ op: z.literal('room.save'), id: id.optional(), roomTypeId: id, number: text(20).min(1), floor: orNull(z.int().min(-5).max(200)), note: orNull(text(200)), active: z.boolean() }),
  z.object({ op: z.literal('room.delete'), id }),

  z.object({ op: z.literal('amenity.save'), id: id.optional(), code: slug, name: L(120), icon: orNull(z.enum(ICON_KEYS)) }),
  z.object({ op: z.literal('amenity.delete'), id }),
  /** Tiện ích của khách sạn: thay cả danh sách (thứ tự = thứ tự hiện). available=false → "Không có". */
  z.object({ op: z.literal('hotelAmenity.set'), hotelId: id, items: z.array(z.object({ amenityId: id, available: z.boolean(), description: orNull(L(300)) })).max(60) }),

  /** Bộ ảnh: thay cả danh sách (thứ tự = thứ tự hiện). Khách sạn: GALLERY (có ảnh bìa) hoặc HERO (có điểm lấy nét). */
  z.object({
    op: z.literal('media.set'), target: z.enum(['hotel', 'roomType']), targetId: id, kind: z.enum(['GALLERY', 'HERO']).default('GALLERY'),
    items: z.array(z.object({ mediaId: id, focus: orNull(text(40)) })).max(60), coverId: orNull(id),
  }),
  z.object({ op: z.literal('media.alt'), id, alt: orNull(L(200)) }),
  z.object({ op: z.literal('media.delete'), id }),

  z.object({
    op: z.literal('promotion.save'), id: id.optional(), code: z.string().trim().regex(/^[A-Z0-9_-]{3,40}$/, 'Mã: 3–40 chữ in hoa, số, - _'),
    name: L(120), type: z.enum(['PERCENT', 'FIXED']), value: z.int().min(1).max(1_000_000_000),
    hotelId: orNull(id), ratePlanId: orNull(id), bookStart: orNull(date), bookEnd: orNull(date), stayStart: orNull(date), stayEnd: orNull(date),
    minNights: z.int().min(1).max(60), maxRedemptions: orNull(z.int().min(1).max(100_000)), perUserLimit: orNull(z.int().min(1).max(100)), active: z.boolean(),
  }).refine(p => p.type !== 'PERCENT' || p.value <= 100, { message: 'Giảm %: 1…100' })
    .refine(p => (!p.bookStart || !p.bookEnd || p.bookStart <= p.bookEnd) && (!p.stayStart || !p.stayEnd || p.stayStart <= p.stayEnd), { message: 'Khoảng ngày sai (từ ≤ đến)' }),
  z.object({ op: z.literal('promotion.delete'), id }),

  z.object({ op: z.literal('taxFee.save'), id: id.optional(), hotelId: id, name: L(120), type: z.enum(['PERCENT', 'PER_NIGHT', 'PER_BOOKING']), value: money, included: z.boolean(), active: z.boolean(), sortOrder: z.int().min(0).max(99) })
    .refine(t => t.type !== 'PERCENT' || t.value <= 100, { message: 'Thuế %: 0…100' }),
  z.object({ op: z.literal('taxFee.delete'), id }),
])

export type CatalogCommand = z.input<typeof CatalogCommand>
export type ParsedCatalogCommand = z.output<typeof CatalogCommand>
export type HotelContentInput = z.input<typeof HotelContentIn>

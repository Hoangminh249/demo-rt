// Admin — SẢN PHẨM trong Postgres: khách sạn, hạng phòng, phòng vật lý, tiện ích, bộ ảnh, khuyến mãi, thuế phí, người dùng (chỉ xem).
// Đọc cho màn admin + chạy lệnh ghi (zod ở src/lib/catalog-commands.ts) trong transaction, mỗi lệnh một dòng AuditLog.
// "Xoá" thứ đã có booking → chỉ lưu trữ / ngừng bán (booking giữ ảnh chụp nhưng vẫn trỏ tới). Chỉ server.
import 'server-only'
import { unlink } from 'node:fs/promises'
import path from 'node:path'
import { Prisma } from '@/generated/prisma/client'
import { audit } from '@/lib/audit'
import { db } from '@/lib/db'
import { sendTestNotice } from '@/lib/email'
import { today } from '@/lib/format'
import type { ParsedCatalogCommand } from '@/lib/catalog-commands'
import type { L } from '@/types/global'
import type { AdminAmenity, AdminHotelEdit, AdminMediaLibrary, AdminMediaLink, AdminPromotions, AdminUser } from '@/types/admin'
import { AdminError } from './pricing'

type Tx = Prisma.TransactionClient

const iso = (d: Date) => d.toISOString().slice(0, 10)
const day = (s: string) => new Date(`${s}T00:00:00.000Z`)
const json = (v: unknown) => v as Prisma.InputJsonValue
const asL = (v: unknown) => v as L
/** Ngày theo giờ Việt Nam → mốc thời gian: đầu ngày / cuối ngày (khoảng đặt của khuyến mãi). */
const vnStart = (s: string) => new Date(`${s}T00:00:00+07:00`)
const vnEnd = (s: string) => new Date(`${s}T23:59:59.999+07:00`)
const vnDay = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(d)

/** Thư mục ảnh tải lên (Render Persistent Disk). Không đặt → tắt tải ảnh (chỉ dùng ảnh trong public/). */
export const uploadDir = () => process.env.UPLOAD_DIR || null
export const UPLOAD_URL_PREFIX = '/media/'

// ---------- Đọc ----------

const links = (rows: { mediaId: string; isCover: boolean; focus?: string | null; media: { path: string } }[]): AdminMediaLink[] =>
  rows.map(m => ({ mediaId: m.mediaId, path: m.media.path, isCover: m.isCover, focus: m.focus ?? null }))

async function hotelEdit(slug: string): Promise<AdminHotelEdit | null> {
  const h = await db().hotel.findUnique({
    where: { slug },
    include: {
      _count: { select: { bookings: true } },
      media: { orderBy: { sortOrder: 'asc' }, include: { media: { select: { path: true } } } },
      amenities: { orderBy: { sortOrder: 'asc' } },
      taxFees: { orderBy: { sortOrder: 'asc' } },
      roomTypes: {
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        include: {
          _count: { select: { bookingRooms: true } },
          rooms: { orderBy: { number: 'asc' } },
          media: { orderBy: { sortOrder: 'asc' }, include: { media: { select: { path: true } } } },
        },
      },
    },
  })
  if (!h) return null
  return {
    hotel: {
      id: h.id, slug: h.slug, code: h.code, name: h.name, status: h.status, area: asL(h.area), address: asL(h.address), mapQuery: h.mapQuery,
      lat: h.lat, lng: h.lng, stars: h.stars, checkInTime: h.checkInTime, checkOutTime: h.checkOutTime,
      phone: h.phone, email: h.email, zalo: h.zalo, notifyEmail: h.notifyEmail, operator: h.operator,
      openingDate: h.openingDate ? iso(h.openingDate) : null, gohostTenantId: h.gohostTenantId, sortOrder: h.sortOrder,
      content: {
        tagline: { vi: '' }, description: { vi: '' }, highlights: [], facts: [], getting_here: [], policies: [], children: null,
        cancel_summary: { vi: '' }, faq: [], pending: [], en_review: false,
        ...(h.content as object),
      } as AdminHotelEdit['hotel']['content'],
      bookings: h._count.bookings,
    },
    roomTypes: h.roomTypes.map(rt => ({
      id: rt.id, slug: rt.slug, status: rt.status, name: asL(rt.name), description: asL(rt.description), size: asL(rt.size), beds: rt.beds ? asL(rt.beds) : null,
      maxAdults: rt.maxAdults, maxChildren: rt.maxChildren, maxOccupancy: rt.maxOccupancy, baseOccupancy: rt.baseOccupancy,
      totalRooms: rt.totalRooms, sortOrder: rt.sortOrder, gohostRoomTypeId: rt.gohostRoomTypeId,
      content: { features: [], ...(rt.content as object) } as AdminHotelEdit['roomTypes'][number]['content'],
      rooms: rt.rooms.map(r => ({ id: r.id, number: r.number, floor: r.floor, note: r.note, active: r.active })),
      media: links(rt.media),
      bookings: rt._count.bookingRooms,
    })),
    gallery: links(h.media.filter(m => m.kind === 'GALLERY')),
    hero: links(h.media.filter(m => m.kind === 'HERO')),
    amenities: h.amenities.map(a => ({ amenityId: a.amenityId, available: a.available, description: a.description ? asL(a.description) : null })),
    taxFees: h.taxFees.map(t => ({ id: t.id, name: asL(t.name), type: t.type, value: t.value, included: t.included, active: t.active, sortOrder: t.sortOrder })),
  }
}

async function amenities(): Promise<AdminAmenity[]> {
  const rows = await db().amenity.findMany({ orderBy: { code: 'asc' }, include: { _count: { select: { hotels: true, roomTypes: true } } } })
  return rows.map(a => ({ id: a.id, code: a.code, name: asL(a.name), icon: a.icon, used: a._count.hotels + a._count.roomTypes }))
}

async function media(): Promise<AdminMediaLibrary> {
  const rows = await db().mediaAsset.findMany({ orderBy: { createdAt: 'desc' }, include: { _count: { select: { hotels: true, roomTypes: true } } } })
  return {
    items: rows.map(m => ({ id: m.id, path: m.path, alt: m.alt ? asL(m.alt) : null, source: m.source, used: m._count.hotels + m._count.roomTypes })),
    uploadEnabled: !!uploadDir(),
  }
}

async function promotions(): Promise<AdminPromotions> {
  const [items, hotels, plans] = await Promise.all([
    db().promotion.findMany({ orderBy: { createdAt: 'desc' }, include: { _count: { select: { redemptions: true } } } }),
    db().hotel.findMany({ where: { status: { not: 'ARCHIVED' } }, orderBy: { sortOrder: 'asc' }, select: { id: true, name: true } }),
    db().ratePlan.findMany({ include: { roomType: { select: { hotelId: true, name: true } } }, orderBy: { createdAt: 'asc' } }),
  ])
  return {
    items: items.map(p => ({
      id: p.id, code: p.code, name: asL(p.name), type: p.type, value: p.value, hotelId: p.hotelId, ratePlanId: p.ratePlanId,
      bookStart: p.bookStart ? vnDay(p.bookStart) : null, bookEnd: p.bookEnd ? vnDay(p.bookEnd) : null,
      stayStart: p.stayStart ? iso(p.stayStart) : null, stayEnd: p.stayEnd ? iso(p.stayEnd) : null,
      minNights: p.minNights, maxRedemptions: p.maxRedemptions, perUserLimit: p.perUserLimit, active: p.active, used: p._count.redemptions,
    })),
    hotels,
    ratePlans: plans.map(p => ({ id: p.id, hotelId: p.roomType.hotelId, label: `${asL(p.roomType.name).vi} · ${asL(p.name).vi}` })),
  }
}

async function users(): Promise<AdminUser[]> {
  const rows = await db().user.findMany({ orderBy: { createdAt: 'desc' }, take: 500, include: { _count: { select: { bookings: true } } } })
  return rows.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt.toISOString(), bookings: u._count.bookings }))
}

// ---------- Ghi ----------

async function deleteRoomType(tx: Tx, id: string) {
  await tx.ratePlan.deleteMany({ where: { roomTypeId: id } }) // kèm DailyRate, PricingRule (cascade); khuyến mãi trỏ gói → null
  await tx.room.deleteMany({ where: { roomTypeId: id } })
  await tx.roomType.delete({ where: { id } }) // kèm DailyInventory, ảnh, tiện ích (cascade)
}

async function run(cmd: ParsedCatalogCommand): Promise<{ message: string; removeFile?: string }> {
  try {
    return await db().$transaction(async tx => {
      switch (cmd.op) {
        case 'hotel.create': {
          const h = await tx.hotel.create({
            data: { slug: cmd.slug, code: cmd.code, name: cmd.name, status: 'DRAFT', area: { vi: '' }, address: { vi: '' }, mapQuery: cmd.name, checkInTime: '14:00', checkOutTime: '12:00', operator: '', content: {} },
          })
          await audit(tx, 'create', 'Hotel', h.id, cmd)
          return { message: `Đã tạo khách sạn ${cmd.name} (nháp). Điền thông tin rồi chuyển sang "Đang bán".` }
        }
        case 'hotel.save': {
          const before = await tx.hotel.findUnique({ where: { id: cmd.id } })
          if (!before) throw new AdminError(404, 'Không thấy khách sạn.')
          if (cmd.slug !== before.slug && before.status !== 'DRAFT') throw new AdminError(409, 'Đường dẫn (slug) chỉ đổi được khi khách sạn còn là nháp — đổi sau khi đã bán làm hỏng link và SEO.')
          const { op: _op, id, content, openingDate, area, address, ...rest } = cmd
          void _op
          await tx.hotel.update({ where: { id }, data: { ...rest, area: json(area), address: json(address), content: json(content), openingDate: openingDate ? day(openingDate) : null } })
          await audit(tx, 'update', 'Hotel', id, { ...rest, openingDate }, { status: before.status, slug: before.slug })
          return { message: 'Đã lưu khách sạn.' }
        }
        case 'hotel.delete': {
          const h = await tx.hotel.findUnique({ where: { id: cmd.id }, include: { _count: { select: { bookings: true } }, roomTypes: { select: { id: true } } } })
          if (!h) throw new AdminError(404, 'Không thấy khách sạn.')
          if (h._count.bookings) {
            await tx.hotel.update({ where: { id: h.id }, data: { status: 'ARCHIVED' } })
            await audit(tx, 'archive', 'Hotel', h.id, { status: 'ARCHIVED' })
            return { message: 'Khách sạn đã có booking nên chỉ lưu trữ (ẩn khỏi web), không xoá hẳn.' }
          }
          for (const rt of h.roomTypes) await deleteRoomType(tx, rt.id)
          await tx.hotel.delete({ where: { id: h.id } })
          await audit(tx, 'delete', 'Hotel', h.id, null, { slug: h.slug, name: h.name })
          return { message: 'Đã xoá khách sạn.' }
        }
        case 'hotel.testNotify': {
          const h = await tx.hotel.findUnique({ where: { id: cmd.id }, select: { name: true, notifyEmail: true } })
          if (!h) throw new AdminError(404, 'Không thấy khách sạn.')
          if (!h.notifyEmail) throw new AdminError(409, 'Chưa lưu email team — nhập rồi bấm Lưu trước.')
          const r = await sendTestNotice(h.notifyEmail, h.name)
          if (!r.ok) throw new AdminError(502, `Gửi không được: ${r.error}`)
          return { message: r.console ? `Chưa có RESEND_API_KEY: nội dung in ra console của server (tới ${h.notifyEmail}).` : `Đã gửi email thử tới ${h.notifyEmail}.` }
        }

        case 'roomType.save': {
          const { op: _op, id, content, name, description, size, beds, ...rest } = cmd
          void _op
          if (id) {
            const [mx] = await tx.$queryRaw<{ m: number | null }[]>`SELECT max(allotment)::int AS m FROM "DailyInventory" WHERE "roomTypeId" = ${id} AND date >= ${today()}::date`
            if (mx?.m != null && mx.m > rest.totalRooms) throw new AdminError(409, `Lịch đang mở ${mx.m} phòng bán web cho một số ngày — giảm ở tab Giá & phòng trống trước khi giảm tổng số phòng xuống ${rest.totalRooms}.`)
          }
          const data = { ...rest, name: json(name), description: json(description), size: json(size), beds: beds ? json(beds) : Prisma.DbNull, content: json(content) }
          const row = id ? await tx.roomType.update({ where: { id }, data }) : await tx.roomType.create({ data })
          await audit(tx, id ? 'update' : 'create', 'RoomType', row.id, { ...rest, name })
          return { message: id ? 'Đã lưu hạng phòng.' : 'Đã tạo hạng phòng. Tiếp theo: mở hạng phòng → Gói giá để tạo gói, rồi nhập giá ở tab Giá & phòng trống.' }
        }
        case 'roomType.delete': {
          const rt = await tx.roomType.findUnique({ where: { id: cmd.id }, include: { _count: { select: { bookingRooms: true } } } })
          if (!rt) throw new AdminError(404, 'Không thấy hạng phòng.')
          if (rt._count.bookingRooms) {
            await tx.roomType.update({ where: { id: rt.id }, data: { status: 'ARCHIVED' } })
            await audit(tx, 'archive', 'RoomType', rt.id, { status: 'ARCHIVED' })
            return { message: 'Hạng phòng đã có booking nên chỉ lưu trữ (ngừng bán), không xoá hẳn.' }
          }
          await deleteRoomType(tx, rt.id)
          await audit(tx, 'delete', 'RoomType', rt.id, null, { slug: rt.slug })
          return { message: 'Đã xoá hạng phòng cùng gói giá, lịch giá và lịch tồn của hạng.' }
        }

        case 'room.save': {
          const { op: _op, id, ...data } = cmd
          void _op
          const row = id ? await tx.room.update({ where: { id }, data }) : await tx.room.create({ data })
          await audit(tx, id ? 'update' : 'create', 'Room', row.id, data)
          return { message: id ? 'Đã lưu phòng.' : `Đã thêm phòng ${data.number}.` }
        }
        case 'room.delete': {
          const r = await tx.room.findUnique({ where: { id: cmd.id }, include: { _count: { select: { bookingRooms: true } } } })
          if (!r) throw new AdminError(404, 'Không thấy phòng.')
          if (r._count.bookingRooms) {
            await tx.room.update({ where: { id: r.id }, data: { active: false } })
            await audit(tx, 'archive', 'Room', r.id, { active: false })
            return { message: 'Phòng đã được gán cho booking nên chỉ ngừng dùng.' }
          }
          await tx.room.delete({ where: { id: r.id } })
          await audit(tx, 'delete', 'Room', r.id, null, { number: r.number })
          return { message: `Đã xoá phòng ${r.number}.` }
        }

        case 'amenity.save': {
          const { op: _op, id, name, ...rest } = cmd
          void _op
          const row = id ? await tx.amenity.update({ where: { id }, data: { ...rest, name: json(name) } }) : await tx.amenity.create({ data: { ...rest, name: json(name) } })
          await audit(tx, id ? 'update' : 'create', 'Amenity', row.id, cmd)
          return { message: 'Đã lưu tiện ích.' }
        }
        case 'amenity.delete': {
          const before = await tx.amenity.delete({ where: { id: cmd.id } }) // gỡ khỏi mọi khách sạn / hạng phòng (cascade)
          await audit(tx, 'delete', 'Amenity', cmd.id, null, before)
          return { message: 'Đã xoá tiện ích (gỡ khỏi mọi khách sạn).' }
        }
        case 'hotelAmenity.set': {
          if (new Set(cmd.items.map(i => i.amenityId)).size !== cmd.items.length) throw new AdminError(400, 'Một tiện ích được chọn hai lần.')
          await tx.hotelAmenity.deleteMany({ where: { hotelId: cmd.hotelId } })
          await tx.hotelAmenity.createMany({ data: cmd.items.map((i, k) => ({ hotelId: cmd.hotelId, amenityId: i.amenityId, available: i.available, description: i.description ? json(i.description) : Prisma.DbNull, sortOrder: k })) })
          await audit(tx, 'set', 'HotelAmenity', cmd.hotelId, cmd.items)
          return { message: 'Đã lưu tiện ích của khách sạn.' }
        }

        case 'media.set': {
          if (new Set(cmd.items.map(i => i.mediaId)).size !== cmd.items.length) throw new AdminError(400, 'Một ảnh được chọn hai lần.')
          if (cmd.target === 'hotel') {
            await tx.hotelMedia.deleteMany({ where: { hotelId: cmd.targetId, kind: cmd.kind } })
            await tx.hotelMedia.createMany({ data: cmd.items.map((i, k) => ({ hotelId: cmd.targetId, mediaId: i.mediaId, kind: cmd.kind, sortOrder: k, isCover: cmd.kind === 'GALLERY' && i.mediaId === cmd.coverId, focus: i.focus })) })
          } else {
            await tx.roomTypeMedia.deleteMany({ where: { roomTypeId: cmd.targetId } })
            await tx.roomTypeMedia.createMany({ data: cmd.items.map((i, k) => ({ roomTypeId: cmd.targetId, mediaId: i.mediaId, sortOrder: k, isCover: k === 0 })) })
          }
          await audit(tx, 'set', cmd.target === 'hotel' ? `HotelMedia:${cmd.kind}` : 'RoomTypeMedia', cmd.targetId, cmd.items)
          return { message: `Đã lưu ${cmd.items.length} ảnh.` }
        }
        case 'media.alt': {
          await tx.mediaAsset.update({ where: { id: cmd.id }, data: { alt: cmd.alt ? json(cmd.alt) : Prisma.DbNull } })
          await audit(tx, 'update', 'MediaAsset', cmd.id, cmd)
          return { message: 'Đã lưu chú thích ảnh.' }
        }
        case 'media.delete': {
          const m = await tx.mediaAsset.findUnique({ where: { id: cmd.id }, include: { _count: { select: { hotels: true, roomTypes: true } } } })
          if (!m) throw new AdminError(404, 'Không thấy ảnh.')
          if (m._count.hotels + m._count.roomTypes) throw new AdminError(409, 'Ảnh đang được dùng — gỡ khỏi khách sạn / hạng phòng trước.')
          await tx.mediaAsset.delete({ where: { id: m.id } })
          await audit(tx, 'delete', 'MediaAsset', m.id, null, { path: m.path })
          return { message: 'Đã xoá ảnh.', removeFile: m.source === 'UPLOAD' ? m.path : undefined }
        }

        case 'promotion.save': {
          const { op: _op, id, name, bookStart, bookEnd, stayStart, stayEnd, ...rest } = cmd
          void _op
          if (rest.ratePlanId && rest.hotelId) {
            const p = await tx.ratePlan.findUnique({ where: { id: rest.ratePlanId }, select: { roomType: { select: { hotelId: true } } } })
            if (p?.roomType.hotelId !== rest.hotelId) throw new AdminError(400, 'Gói giá không thuộc khách sạn đã chọn.')
          }
          const data = {
            ...rest, code: rest.code.toUpperCase(), name: json(name),
            bookStart: bookStart ? vnStart(bookStart) : null, bookEnd: bookEnd ? vnEnd(bookEnd) : null,
            stayStart: stayStart ? day(stayStart) : null, stayEnd: stayEnd ? day(stayEnd) : null,
          }
          const row = id ? await tx.promotion.update({ where: { id }, data }) : await tx.promotion.create({ data })
          await audit(tx, id ? 'update' : 'create', 'Promotion', row.id, cmd)
          return { message: 'Đã lưu khuyến mãi.' }
        }
        case 'promotion.delete': {
          const p = await tx.promotion.findUnique({ where: { id: cmd.id }, include: { _count: { select: { redemptions: true } } } })
          if (!p) throw new AdminError(404, 'Không thấy khuyến mãi.')
          if (p._count.redemptions) {
            await tx.promotion.update({ where: { id: p.id }, data: { active: false } })
            await audit(tx, 'archive', 'Promotion', p.id, { active: false })
            return { message: 'Mã đã được dùng nên chỉ tắt, không xoá hẳn.' }
          }
          await tx.promotion.delete({ where: { id: p.id } })
          await audit(tx, 'delete', 'Promotion', p.id, null, { code: p.code })
          return { message: 'Đã xoá khuyến mãi.' }
        }

        case 'taxFee.save': {
          const { op: _op, id, name, ...rest } = cmd
          void _op
          const row = id ? await tx.taxFee.update({ where: { id }, data: { ...rest, name: json(name) } }) : await tx.taxFee.create({ data: { ...rest, name: json(name) } })
          await audit(tx, id ? 'update' : 'create', 'TaxFee', row.id, cmd)
          return { message: rest.included ? 'Đã lưu (đã gồm trong giá — chỉ hiển thị).' : 'Đã lưu (cộng thêm vào tổng khi đặt phòng).' }
        }
        case 'taxFee.delete': {
          const before = await tx.taxFee.delete({ where: { id: cmd.id } })
          await audit(tx, 'delete', 'TaxFee', cmd.id, null, before)
          return { message: 'Đã xoá thuế / phí.' }
        }
      }
    })
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2002') throw new AdminError(409, `Trùng ${String((e.meta as { target?: unknown })?.target ?? 'giá trị duy nhất')} — đã có bản ghi khác dùng giá trị này.`)
      if (e.code === 'P2025') throw new AdminError(404, 'Không thấy bản ghi (có thể vừa bị xoá).')
      if (e.code === 'P2003') throw new AdminError(409, 'Đang được dữ liệu khác dùng nên không xoá được.')
    }
    throw e
  }
}

/** Ghi + dọn file ảnh tải lên đã xoá (sau commit; lỗi xoá file chỉ ghi log). */
async function write(cmd: ParsedCatalogCommand): Promise<string> {
  const r = await run(cmd)
  const dir = uploadDir()
  if (r.removeFile && dir && r.removeFile.startsWith(UPLOAD_URL_PREFIX)) {
    const file = path.resolve(dir, r.removeFile.slice(UPLOAD_URL_PREFIX.length))
    if (file.startsWith(path.resolve(dir) + path.sep)) await unlink(file).catch(e => console.error('[media] xoá file lỗi', e))
  }
  return r.message
}

export const catalogAdminApi = { hotelEdit, amenities, media, promotions, users, write }

// Seed từ src/content (nội dung thật) — chạy: yarn db:seed (chỉ ở bước APPLY DB).
// Chạy lại an toàn: upsert theo khoá tự nhiên; lịch tồn dùng createMany skipDuplicates nên KHÔNG ghi đè số admin đã sửa.
// Không seed DailyRate: src/content không có giá (giá đang ở Gohost) → chưa bán đêm nào cho tới khi admin nhập giá
// hoặc "Nhập giá từ Gohost" (Phase 4).
import type { Prisma } from '../src/generated/prisma/client'
import { newPrisma } from '../src/lib/pg'
import { HOTELS, SITE } from '../src/content'
import { addDays, today } from '../src/lib/format'
import type { HotelContent } from '../src/types/hotel'

// ---- Giả định chưa chốt (docs/2026-10-12-booking-engine-db-phase0.md §8) — đổi ở đây ----
const DAYS = 365
/** Số phòng mỗi hạng dành cho web; phần còn lại bán OTA qua Gohost. Lễ tân phải đóng đúng số này trên Gohost. */
const WEB_ROOMS_PER_TYPE = 1
/** Số phòng vật lý theo hạng (PDF thông tin lưu trú + mô tả phòng). */
const TOTAL_ROOMS: Record<string, Record<string, number>> = {
  'pito-hon-thom': { superior: 4, 'deluxe-bathtub': 4, 'premier-bathtub': 4, 'cozy-san-thuong': 1 },
  calista: { superior: 6, deluxe: 6, suite: 3 },
}
/** Sức chứa: chính sách 2 NL + 1 trẻ < 6 tuổi ngủ chung (INFERRED, chờ KS xác nhận). */
const OCCUPANCY = { maxAdults: 2, maxChildren: 1, maxOccupancy: 3, baseOccupancy: 2 }
/** Giờ nhận / trả phòng — cả hai KS: từ 15:00 / trước 12:00 (facts trong src/content). */
const CHECK_IN = '15:00'
const CHECK_OUT = '12:00'

const url = process.env.DATABASE_URL
if (!url) throw new Error('Thiếu DATABASE_URL')
const db = newPrisma(url)

const json = (v: unknown) => v as Prisma.InputJsonValue
const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`)
const slugify = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

async function policies() {
  // PITO: "Huỷ từ 7 ngày trở lên trước ngày đến: phí 50%. Dưới 7 ngày, không đến: phí 100%."
  // "Lễ, Tết không hoàn" chưa có khoảng ngày → làm rate plan không hoàn riêng khi KS chốt ngày.
  const cancel = await db.cancellationPolicy.upsert({
    where: { id: 'seed-cancel-7d' },
    update: {},
    create: {
      id: 'seed-cancel-7d',
      name: 'Huỷ trước 7 ngày phí 50%, dưới 7 ngày 100%',
      tiers: [{ daysBefore: 7, penaltyPercent: 50 }, { daysBefore: 0, penaltyPercent: 100 }],
      noShowPercent: 100,
    },
  })
  const deposit = await db.depositPolicy.upsert({
    where: { id: 'seed-deposit-30' },
    update: {},
    create: { id: 'seed-deposit-30', name: 'Cọc 30%, còn lại trả tại quầy', type: 'PERCENT', value: 30, holdMinutes: 15, balanceDueDaysBefore: 0 },
  })
  return { cancelId: cancel.id, depositId: deposit.id }
}

async function media(path: string) {
  return db.mediaAsset.upsert({ where: { path }, update: {}, create: { path, source: 'STATIC' } })
}

async function hotel(h: HotelContent, ids: { cancelId: string; depositId: string }) {
  const { slug, code, name, operator, map_query, gohost_tenant_id, opening, area, address, rooms, cover, gallery, hero, included, not_available, ...content } = h
  const data = {
    code, name, operator, mapQuery: map_query, area: json(area), address: json(address), content: json(content),
    checkInTime: CHECK_IN, checkOutTime: CHECK_OUT, gohostTenantId: gohost_tenant_id,
    // liên hệ đặt phòng chung (SITE) — admin sửa riêng từng KS sau; notifyEmail để trống tới khi KS cho email lễ tân
    phone: SITE.phone_display, email: SITE.email, zalo: SITE.zalo,
    openingDate: opening ? day(opening) : null, status: 'PUBLISHED' as const,
  }
  const row = await db.hotel.upsert({ where: { slug }, update: data, create: { slug, ...data, sortOrder: HOTELS.indexOf(h) } })

  // Ảnh: cover + gallery (GALLERY), hero (HERO, có focus)
  const galleryPaths = [...new Set([cover, ...gallery].filter((p): p is string => !!p))]
  for (const [i, p] of galleryPaths.entries()) {
    const m = await media(p)
    await db.hotelMedia.upsert({
      where: { hotelId_mediaId_kind: { hotelId: row.id, mediaId: m.id, kind: 'GALLERY' } },
      update: {},
      create: { hotelId: row.id, mediaId: m.id, kind: 'GALLERY', sortOrder: i, isCover: p === cover },
    })
  }
  for (const [i, x] of hero.entries()) {
    const m = await media(x.src)
    await db.hotelMedia.upsert({
      where: { hotelId_mediaId_kind: { hotelId: row.id, mediaId: m.id, kind: 'HERO' } },
      update: {},
      create: { hotelId: row.id, mediaId: m.id, kind: 'HERO', sortOrder: i, focus: x.focus },
    })
  }

  // Tiện ích: "đã gồm" (available) + "không có"
  const amenities = [
    ...included.map(a => ({ label: a.label, icon: a.icon as string | null, desc: a.desc, available: true })),
    ...not_available.map(label => ({ label, icon: null, desc: undefined, available: false })),
  ]
  for (const [i, a] of amenities.entries()) {
    const am = await db.amenity.upsert({
      where: { code: slugify(a.label.vi) },
      update: {},
      create: { code: slugify(a.label.vi), name: json(a.label), icon: a.icon },
    })
    await db.hotelAmenity.upsert({
      where: { hotelId_amenityId: { hotelId: row.id, amenityId: am.id } },
      update: {},
      create: { hotelId: row.id, amenityId: am.id, available: a.available, description: a.desc ? json(a.desc) : undefined, sortOrder: i },
    })
  }

  // Hạng phòng + gói giá mặc định + lịch tồn
  const start = opening && opening > today() ? opening : today()
  for (const [i, r] of rooms.entries()) {
    const { slug: rslug, gohost_room_type_id, name: rname, description, size, beds, images, ...rcontent } = r
    const totalRooms = TOTAL_ROOMS[slug]?.[rslug] ?? 0
    const rdata = {
      name: json(rname), description: json(description), size: json(size), beds: beds ? json(beds) : undefined,
      content: json(rcontent), gohostRoomTypeId: gohost_room_type_id, totalRooms, status: 'PUBLISHED' as const, ...OCCUPANCY,
    }
    const rt = await db.roomType.upsert({
      where: { hotelId_slug: { hotelId: row.id, slug: rslug } },
      update: rdata,
      create: { hotelId: row.id, slug: rslug, sortOrder: i, ...rdata },
    })
    for (const [j, p] of images.entries()) {
      const m = await media(p)
      await db.roomTypeMedia.upsert({
        where: { roomTypeId_mediaId: { roomTypeId: rt.id, mediaId: m.id } },
        update: {},
        create: { roomTypeId: rt.id, mediaId: m.id, sortOrder: j, isCover: j === 0 },
      })
    }
    // Cả PITO và Calista đều gồm ăn sáng trong giá (PDF) → BB
    await db.ratePlan.upsert({
      where: { roomTypeId_code: { roomTypeId: rt.id, code: 'BB' } },
      update: {},
      create: {
        roomTypeId: rt.id, code: 'BB', name: json({ vi: 'Gồm ăn sáng', en: 'Breakfast included' }), mealPlan: 'BB',
        refundable: true, cancellationPolicyId: ids.cancelId, depositPolicyId: ids.depositId, isDefault: true,
      },
    })
    const allotment = Math.min(WEB_ROOMS_PER_TYPE, totalRooms)
    const { count } = await db.dailyInventory.createMany({
      data: Array.from({ length: DAYS }, (_, d) => ({ roomTypeId: rt.id, date: day(addDays(start, d)), allotment })),
      skipDuplicates: true,
    })
    console.log(`  ${slug}/${rslug}: ${totalRooms} phòng, web ${allotment}/đêm, +${count} ngày tồn`)
  }
}

async function main() {
  const ids = await policies()
  for (const h of HOTELS) {
    console.log(h.slug)
    await hotel(h, ids)
  }
}

main()
  .then(() => console.log('Seed xong.'))
  .catch(e => { console.error(e); process.exitCode = 1 })
  .finally(() => db.$disconnect())

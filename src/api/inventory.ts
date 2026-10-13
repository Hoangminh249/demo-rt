// Giá + tồn phòng bán trên web, đọc từ Postgres của Rooty. Chỉ server.
// Trả cùng kiểu với nhánh Gohost (RoomAvailability, DayPrice) để UI không phân biệt nguồn. Logic thuần ở src/lib/inventory.ts.
import 'server-only'
import { expireDue } from '@/lib/booking-engine'
import { db } from '@/lib/db'
import { addDays } from '@/lib/format'
import { planOffers, roomsLeft } from '@/lib/inventory'
import type { L } from '@/types/global'
import type { DayPrice, RoomAvailability } from '@/types/hotel'

/** Lịch giá tối đa 90 ngày (một lần tải). */
export const CALENDAR_DAYS = 90

const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`) // cột @db.Date: Prisma đọc/ghi theo nửa đêm UTC
const iso = (d: Date) => d.toISOString().slice(0, 10)

/** Mọi hạng phòng đang bán của KS cho khoảng ngày, kể cả hạng hết phòng. `room_type_id` = slug hạng phòng (khớp Room.room_type_id ở nhánh db). */
async function availability(slug: string, checkin: string, checkout: string): Promise<RoomAvailability[]> {
  await expireDue(db()) // lười: booking giữ phòng quá hạn trả phòng trước khi đếm (cron cũng làm, đây là lưới thứ hai)
  const roomTypes = await db().roomType.findMany({
    where: { status: 'PUBLISHED', hotel: { slug } },
    orderBy: { sortOrder: 'asc' },
    include: {
      // gồm cả ngày đi để kiểm CTD
      inventory: { where: { date: { gte: day(checkin), lte: day(checkout) } } },
      ratePlans: {
        where: { active: true },
        orderBy: [{ isDefault: 'desc' }, { sortOrder: 'asc' }],
        include: { rates: { where: { date: { gte: day(checkin), lt: day(checkout) } } } },
      },
    },
  })
  return roomTypes.map(rt => ({
    room_type_id: rt.slug,
    title: (rt.name as unknown as L).vi,
    quantity: roomsLeft(rt.inventory.map(d => ({ ...d, date: iso(d.date) })), checkin, checkout),
    occ_adults: rt.maxAdults,
    occ_children: rt.maxChildren,
    occ_infants: 0,
    plans: planOffers(
      rt.ratePlans.map(p => ({
        id: p.id,
        title: (p.name as unknown as L).vi,
        has_breakfast: p.mealPlan !== 'RO',
        rates: Object.fromEntries(p.rates.map(r => [iso(r.date), r.price])),
      })),
      checkin, checkout,
    ),
  }))
}

/**
 * Giá thấp nhất mỗi đêm từ `from`, `days` ngày: đêm còn phòng web (chưa đóng, còn allotment), gói đang bán, hạng đang bán.
 * `room` = slug hạng phòng → lịch của riêng hạng đó. Đêm không có giá thì không có trong kết quả.
 */
// ponytail: chưa trừ minStay/CTA — lịch là "giá từ" từng đêm; đặt cụ thể thì availability() kiểm đủ.
async function calendar(slug: string, from: string, days = CALENDAR_DAYS, room: string | null = null): Promise<DayPrice[]> {
  const rows = await db().$queryRaw<{ date: Date; price: number }[]>`
    SELECT r.date, MIN(r.price)::int AS price
    FROM "DailyRate" r
    JOIN "RatePlan" p ON p.id = r."ratePlanId" AND p.active
    JOIN "RoomType" t ON t.id = p."roomTypeId" AND t.status = 'PUBLISHED'
    JOIN "Hotel" h ON h.id = t."hotelId" AND h.slug = ${slug}
    JOIN "DailyInventory" i ON i."roomTypeId" = t.id AND i.date = r.date
    WHERE r.date >= ${from}::date AND r.date < ${addDays(from, days)}::date
      AND NOT i.closed AND i.allotment - i.booked - i.held > 0
      AND (${room}::text IS NULL OR t.slug = ${room}::text)
    GROUP BY r.date
    ORDER BY r.date`
  return rows.map(r => ({ day: iso(r.date), price: r.price }))
}

/** "Giá từ …/đêm": giá thấp nhất trong 90 ngày tới. null = chưa có giá. */
async function fromPrice(slug: string, from: string): Promise<number | null> {
  const days = await calendar(slug, from)
  return days.length ? Math.min(...days.map(d => d.price)) : null
}

export const inventoryApi = { availability, calendar, fromPrice }

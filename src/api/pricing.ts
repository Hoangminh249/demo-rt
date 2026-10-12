// Admin — giá theo ngày, tồn phòng web, gói giá, PricingRule, chính sách huỷ/cọc trong Postgres của Rooty. Chỉ server.
// Route handler đã kiểm phiên; mọi lệnh ghi đi qua run(): zod (src/lib/admin-commands.ts) → transaction → AuditLog.
import 'server-only'
import { Prisma } from '@/generated/prisma/client'
import { db } from '@/lib/db'
import { type ParsedCommand } from '@/lib/admin-commands'
import { datesIn, priceFromRules } from '@/lib/pricing'
import type { L } from '@/types/global'
import type { AdminPlans, AdminRates, DbInventory } from '@/types/admin'

/** Lỗi trả thẳng cho admin (message tiếng Việt, không lộ chi tiết DB). */
export class AdminError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`)
const iso = (d: Date) => d.toISOString().slice(0, 10)
const asL = (v: unknown) => v as L
const json = (v: unknown) => v as Prisma.InputJsonValue
const fmtDays = (ds: string[]) => ds.slice(0, 6).map(d => `${d.slice(8)}/${d.slice(5, 7)}`).join(', ') + (ds.length > 6 ? ` … (+${ds.length - 6})` : '')

type Tx = Prisma.TransactionClient
const audit = (tx: Tx, action: string, entity: string, entityId: string, after: unknown, before?: unknown) =>
  tx.auditLog.create({ data: { action, entity, entityId, after: json(after), before: before === undefined ? undefined : json(before) } })

// ---------- Đọc ----------

async function rates(slug: string, from: string, to: string): Promise<AdminRates | null> {
  const hotel = await db().hotel.findUnique({
    where: { slug },
    include: {
      roomTypes: {
        where: { status: { not: 'ARCHIVED' } },
        orderBy: { sortOrder: 'asc' },
        include: {
          inventory: { where: { date: { gte: day(from), lte: day(to) } } },
          ratePlans: { orderBy: [{ isDefault: 'desc' }, { sortOrder: 'asc' }], include: { rates: { where: { date: { gte: day(from), lte: day(to) } } } } },
        },
      },
    },
  })
  if (!hotel) return null
  return {
    from, to,
    roomTypes: hotel.roomTypes.map(rt => ({
      id: rt.id, slug: rt.slug, name: asL(rt.name), status: rt.status, totalRooms: rt.totalRooms,
      inventory: Object.fromEntries(rt.inventory.map(d => [iso(d.date), {
        allotment: d.allotment, booked: d.booked, held: d.held, closed: d.closed, minStay: d.minStay, maxStay: d.maxStay,
        cta: d.closedToArrival, ctd: d.closedToDeparture,
      } satisfies DbInventory])),
      plans: rt.ratePlans.map(p => ({
        id: p.id, code: p.code, name: asL(p.name), isDefault: p.isDefault, active: p.active,
        rates: Object.fromEntries(p.rates.map(r => [iso(r.date), r.price])),
      })),
    })),
  }
}

async function plans(slug: string): Promise<AdminPlans | null> {
  const [hotel, cancellation, deposit] = await Promise.all([
    db().hotel.findUnique({
      where: { slug },
      include: {
        roomTypes: {
          orderBy: { sortOrder: 'asc' },
          include: { ratePlans: { orderBy: [{ isDefault: 'desc' }, { sortOrder: 'asc' }], include: { rules: { orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }] } } } },
        },
      },
    }),
    db().cancellationPolicy.findMany({ orderBy: { createdAt: 'asc' }, include: { _count: { select: { ratePlans: true } } } }),
    db().depositPolicy.findMany({ orderBy: { createdAt: 'asc' }, include: { _count: { select: { ratePlans: true } } } }),
  ])
  if (!hotel) return null
  return {
    roomTypes: hotel.roomTypes.map(rt => ({
      id: rt.id, slug: rt.slug, name: asL(rt.name), status: rt.status, totalRooms: rt.totalRooms,
      plans: rt.ratePlans.map(p => ({
        id: p.id, roomTypeId: p.roomTypeId, code: p.code, name: asL(p.name), mealPlan: p.mealPlan, refundable: p.refundable,
        basePrice: p.basePrice, extraAdultFee: p.extraAdultFee, extraChildFee: p.extraChildFee,
        cancellationPolicyId: p.cancellationPolicyId, depositPolicyId: p.depositPolicyId,
        isDefault: p.isDefault, active: p.active, gohostRatePlanId: p.gohostRatePlanId,
        rules: p.rules.map(r => ({ id: r.id, name: r.name, startDate: iso(r.startDate), endDate: iso(r.endDate), weekdays: r.weekdays, type: r.type, value: r.value, priority: r.priority, active: r.active })),
      })),
    })),
    cancellation: cancellation.map(c => ({ id: c.id, name: c.name, description: c.description ? asL(c.description) : null, tiers: c.tiers as AdminPlans['cancellation'][number]['tiers'], noShowPercent: c.noShowPercent, used: c._count.ratePlans })),
    deposit: deposit.map(d => ({ id: d.id, name: d.name, type: d.type, value: d.value, holdMinutes: d.holdMinutes, balanceDueDaysBefore: d.balanceDueDaysBefore, used: d._count.ratePlans })),
  }
}

// ---------- Ghi ----------

type Cmd<K extends ParsedCommand['op']> = Extract<ParsedCommand, { op: K }>
/** Bỏ op (và id) khỏi lệnh → dữ liệu ghi thẳng vào bảng. */
function fields<T extends { op: string; id?: string }>(c: T): Omit<T, 'op' | 'id'> {
  const out: Partial<T> = { ...c }
  delete out.op
  delete out.id
  return out as Omit<T, 'op' | 'id'>
}

async function bulk(tx: Tx, c: Cmd<'bulk'>) {
  const days = datesIn(c.from, c.to, c.weekdays)
  if (!days.length) throw new AdminError(400, 'Không có ngày nào khớp khoảng ngày + thứ đã chọn.')
  const rt = await tx.roomType.findUnique({ where: { id: c.roomTypeId }, include: { ratePlans: true } })
  if (!rt) throw new AdminError(404, 'Không thấy hạng phòng.')
  const out: string[] = []

  if (c.allotment !== undefined) {
    if (c.allotment > rt.totalRooms) throw new AdminError(400, `Số phòng bán web (${c.allotment}) vượt tổng số phòng của hạng (${rt.totalRooms}).`)
    // Khoá các dòng sẽ sửa rồi mới kiểm: không cho giảm dưới số phòng đã đặt + đang giữ (tránh bán quá).
    const over = await tx.$queryRaw<{ date: Date }[]>`
      SELECT date FROM "DailyInventory"
      WHERE "roomTypeId" = ${rt.id} AND date = ANY(${days}::date[]) AND booked + held > ${c.allotment}
      ORDER BY date FOR UPDATE`
    if (over.length) throw new AdminError(409, `Không giảm được xuống ${c.allotment} phòng: đã có khách đặt/giữ nhiều hơn vào ${fmtDays(over.map(o => iso(o.date)))}.`)
  }

  const touchesInventory = [c.allotment, c.closed, c.minStay, c.maxStay, c.closedToArrival, c.closedToDeparture].some(v => v !== undefined)
  if (touchesInventory) {
    const setMax = c.maxStay !== undefined
    const n = await tx.$executeRaw`
      INSERT INTO "DailyInventory" ("id", "roomTypeId", "date", "allotment", "closed", "minStay", "maxStay", "closedToArrival", "closedToDeparture", "updatedAt")
      SELECT gen_random_uuid()::text, ${rt.id}, d, COALESCE(${c.allotment ?? null}::int, 0), COALESCE(${c.closed ?? null}::boolean, false),
             COALESCE(${c.minStay ?? null}::int, 1), ${c.maxStay ?? null}::int,
             COALESCE(${c.closedToArrival ?? null}::boolean, false), COALESCE(${c.closedToDeparture ?? null}::boolean, false), now()
      FROM unnest(${days}::date[]) AS d
      ON CONFLICT ("roomTypeId", "date") DO UPDATE SET
        "allotment" = COALESCE(${c.allotment ?? null}::int, "DailyInventory"."allotment"),
        "closed" = COALESCE(${c.closed ?? null}::boolean, "DailyInventory"."closed"),
        "minStay" = COALESCE(${c.minStay ?? null}::int, "DailyInventory"."minStay"),
        "maxStay" = CASE WHEN ${setMax}::boolean THEN ${c.maxStay ?? null}::int ELSE "DailyInventory"."maxStay" END,
        "closedToArrival" = COALESCE(${c.closedToArrival ?? null}::boolean, "DailyInventory"."closedToArrival"),
        "closedToDeparture" = COALESCE(${c.closedToDeparture ?? null}::boolean, "DailyInventory"."closedToDeparture"),
        "updatedAt" = now()`
    out.push(`tồn ${n} ngày`)
  }

  if (c.price !== undefined) {
    const plan = c.ratePlanId ? rt.ratePlans.find(p => p.id === c.ratePlanId) : rt.ratePlans.find(p => p.isDefault) ?? rt.ratePlans[0]
    if (!plan) throw new AdminError(400, 'Hạng phòng chưa có gói giá nào — tạo gói ở tab "Gói giá & chính sách".')
    if (c.price === null) {
      const { count } = await tx.dailyRate.deleteMany({ where: { ratePlanId: plan.id, date: { in: days.map(day) } } })
      out.push(`xoá giá ${count} đêm`)
    } else {
      const n = await tx.$executeRaw`
        INSERT INTO "DailyRate" ("id", "ratePlanId", "date", "price", "updatedAt")
        SELECT gen_random_uuid()::text, ${plan.id}, d, ${c.price}::int, now() FROM unnest(${days}::date[]) AS d
        ON CONFLICT ("ratePlanId", "date") DO UPDATE SET "price" = EXCLUDED."price", "updatedAt" = now()`
      out.push(`giá ${n} đêm`)
    }
  }
  if (!out.length) throw new AdminError(400, 'Chưa chọn thay đổi nào.')
  await audit(tx, 'bulk', 'RoomType', rt.id, { ...c, days: days.length })
  return `Đã cập nhật ${out.join(', ')} (${days.length} ngày khớp).`
}

async function generate(tx: Tx, c: Cmd<'generate'>) {
  const plan = await tx.ratePlan.findUnique({ where: { id: c.ratePlanId }, include: { rules: { where: { active: true }, orderBy: { createdAt: 'asc' } } } })
  if (!plan) throw new AdminError(404, 'Không thấy gói giá.')
  const rules = plan.rules.map(r => ({ startDate: iso(r.startDate), endDate: iso(r.endDate), weekdays: r.weekdays, type: r.type, value: r.value, priority: r.priority }))
  const priced = datesIn(c.from, c.to).flatMap(d => { const p = priceFromRules(rules, plan.basePrice, d); return p == null ? [] : [[d, p] as const] })
  if (!priced.length) throw new AdminError(400, 'Không tính được giá đêm nào: gói chưa có giá gốc và không có quy tắc FIXED khớp.')
  const n = await tx.$executeRaw`
    INSERT INTO "DailyRate" ("id", "ratePlanId", "date", "price", "updatedAt")
    SELECT gen_random_uuid()::text, ${plan.id}, t.d, t.p, now()
    FROM unnest(${priced.map(x => x[0])}::date[], ${priced.map(x => x[1])}::int[]) AS t(d, p)
    ON CONFLICT ("ratePlanId", "date") DO UPDATE SET "price" = EXCLUDED."price", "updatedAt" = now()`
  await audit(tx, 'generate', 'RatePlan', plan.id, { ...c, nights: n })
  return `Đã sinh giá ${n} đêm từ ${rules.length} quy tắc.`
}

async function savePlan(tx: Tx, c: Cmd<'plan.save'>) {
  const { id } = c
  const data = fields(c)
  const rt = await tx.roomType.findUnique({ where: { id: c.roomTypeId } })
  if (!rt) throw new AdminError(404, 'Không thấy hạng phòng.')
  const before = id ? await tx.ratePlan.findUnique({ where: { id } }) : null
  if (id && (!before || before.roomTypeId !== c.roomTypeId)) throw new AdminError(404, 'Không thấy gói giá.')
  if (data.isDefault) await tx.ratePlan.updateMany({ where: { roomTypeId: c.roomTypeId, isDefault: true, NOT: id ? { id } : undefined }, data: { isDefault: false } })
  const row = id
    ? await tx.ratePlan.update({ where: { id }, data: { ...data, name: json(data.name) } })
    : await tx.ratePlan.create({ data: { ...data, name: json(data.name) } })
  await audit(tx, id ? 'update' : 'create', 'RatePlan', row.id, data, before ?? undefined)
  return id ? 'Đã lưu gói giá.' : 'Đã tạo gói giá.'
}

async function deletePlan(tx: Tx, id: string) {
  const plan = await tx.ratePlan.findUnique({ where: { id }, include: { _count: { select: { bookingRooms: true } } } })
  if (!plan) throw new AdminError(404, 'Không thấy gói giá.')
  if (plan._count.bookingRooms) {
    // Booking giữ ảnh chụp giá nhưng vẫn trỏ tới gói → không xoá hẳn, chỉ ngừng bán.
    await tx.ratePlan.update({ where: { id }, data: { active: false, isDefault: false } })
    await audit(tx, 'archive', 'RatePlan', id, { active: false }, plan)
    return 'Gói đã có booking nên chỉ ngừng bán (không xoá hẳn).'
  }
  await tx.ratePlan.delete({ where: { id } }) // xoá kèm DailyRate + PricingRule (cascade)
  await audit(tx, 'delete', 'RatePlan', id, null, plan)
  return 'Đã xoá gói giá và lịch giá của gói.'
}

async function run(cmd: ParsedCommand): Promise<string> {
  try {
    return await db().$transaction(async tx => {
      switch (cmd.op) {
        case 'bulk': return bulk(tx, cmd)
        case 'generate': return generate(tx, cmd)
        case 'rule.create': {
          const { startDate, endDate, ...rest } = fields(cmd)
          if (!(await tx.ratePlan.findUnique({ where: { id: cmd.ratePlanId } }))) throw new AdminError(404, 'Không thấy gói giá.')
          const r = await tx.pricingRule.create({ data: { ...rest, startDate: day(startDate), endDate: day(endDate) } })
          await audit(tx, 'create', 'PricingRule', r.id, cmd)
          return 'Đã thêm quy tắc. Bấm "Sinh giá" để áp vào lịch.'
        }
        case 'rule.delete': {
          const before = await tx.pricingRule.delete({ where: { id: cmd.id } })
          await audit(tx, 'delete', 'PricingRule', cmd.id, null, before)
          return 'Đã xoá quy tắc. Giá đã sinh trước đó giữ nguyên.'
        }
        case 'plan.save': return savePlan(tx, cmd)
        case 'plan.delete': return deletePlan(tx, cmd.id)
        case 'cancel.save': {
          const { id } = cmd
          const data = fields(cmd)
          const before = id ? await tx.cancellationPolicy.findUnique({ where: { id } }) : null
          if (id && !before) throw new AdminError(404, 'Không thấy chính sách.')
          const row = id
            ? await tx.cancellationPolicy.update({ where: { id }, data: { ...data, tiers: json(data.tiers), description: data.description ? json(data.description) : Prisma.DbNull } })
            : await tx.cancellationPolicy.create({ data: { ...data, tiers: json(data.tiers), description: data.description ? json(data.description) : Prisma.DbNull } })
          await audit(tx, id ? 'update' : 'create', 'CancellationPolicy', row.id, data, before ?? undefined)
          return 'Đã lưu chính sách huỷ. Booking cũ giữ chính sách lúc đặt.'
        }
        case 'deposit.save': {
          const { id } = cmd
          const data = fields(cmd)
          const before = id ? await tx.depositPolicy.findUnique({ where: { id } }) : null
          if (id && !before) throw new AdminError(404, 'Không thấy chính sách.')
          const row = id ? await tx.depositPolicy.update({ where: { id }, data }) : await tx.depositPolicy.create({ data })
          await audit(tx, id ? 'update' : 'create', 'DepositPolicy', row.id, data, before ?? undefined)
          return 'Đã lưu chính sách cọc. Booking cũ giữ chính sách lúc đặt.'
        }
        case 'cancel.delete':
        case 'deposit.delete': {
          const cancel = cmd.op === 'cancel.delete'
          const before = cancel
            ? await tx.cancellationPolicy.delete({ where: { id: cmd.id } })
            : await tx.depositPolicy.delete({ where: { id: cmd.id } })
          await audit(tx, 'delete', cancel ? 'CancellationPolicy' : 'DepositPolicy', cmd.id, null, before)
          return 'Đã xoá chính sách.'
        }
      }
    })
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2025') throw new AdminError(404, 'Không thấy bản ghi (có thể vừa bị xoá).')
      if (e.code === 'P2003') throw new AdminError(409, 'Đang được gói giá dùng — đổi chính sách của các gói đó trước khi xoá.')
      if (e.code === 'P2002') throw new AdminError(409, 'Trùng mã — mỗi hạng phòng không có 2 gói cùng mã.')
    }
    throw e
  }
}

export const pricingApi = { rates, plans, run }

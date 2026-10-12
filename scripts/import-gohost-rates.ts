// Nhập giá từng đêm từ Gohost vào DailyRate (Postgres của Rooty). Chạy: yarn db:import-gohost [số ngày, mặc định 90] [--dry]
// Chỉ GHI GIÁ, không đụng tồn phòng (tồn web do Rooty tự chia). GHI ĐÈ giá đã có cho các đêm Gohost trả về.
// Gói chưa có giá gốc (basePrice) thì điền giá xuất hiện nhiều nhất.
// Gohost: GET /properties/{tenant}/room_types theo cửa sổ 30 đêm → 90 ngày = 3 lượt / khách sạn (key dùng chung 60 lượt / 5 phút).
// Ghép: RoomType.gohostRoomTypeId ↔ hạng Gohost; gói mặc định của Rooty ↔ gói có gohostRatePlanId, không có thì gói is_default của Gohost.
import { addDays, today } from '../src/lib/format'
import { newPrisma } from '../src/lib/pg'
import type { GhAvailRoomType, GhResponse } from '../src/types/gohost'

try { process.loadEnvFile() } catch {}

const BASE = 'https://platform.gohost.vn/pms/api/public/v1'
const WINDOW = 30 // Gohost: khoảng ngày tối đa 30 đêm
const DAYS = Math.min(365, Number(process.argv.find(a => /^\d+$/.test(a)) ?? 90))
const DRY = process.argv.includes('--dry')

async function roomTypes(tenant: string, checkin: string, checkout: string): Promise<GhAvailRoomType[]> {
  const q = new URLSearchParams({ checkin_date: checkin, checkout_date: checkout })
  const res = await fetch(`${BASE}/properties/${encodeURIComponent(tenant)}/room_types?${q}`, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${process.env.GOHOST_API_KEY}:${process.env.GOHOST_API_SECRET}` },
    signal: AbortSignal.timeout(15_000),
  })
  const body = (await res.json().catch(() => null)) as GhResponse<{ room_types?: GhAvailRoomType }[]> | null
  if (!res.ok || body?.success !== true) throw new Error(`Gohost ${res.status} ${checkin}→${checkout}`)
  return (Array.isArray(body.data) ? body.data : []).flatMap(r => (r?.room_types?.id ? [r.room_types] : []))
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('Thiếu DATABASE_URL')
  if (!process.env.GOHOST_API_KEY || !process.env.GOHOST_API_SECRET) throw new Error('Thiếu GOHOST_API_KEY / GOHOST_API_SECRET')
  const db = newPrisma(process.env.DATABASE_URL)
  try {
    const hotels = await db.hotel.findMany({
      where: { gohostTenantId: { not: null } },
      include: { roomTypes: { where: { gohostRoomTypeId: { not: null } }, include: { ratePlans: { where: { isDefault: true } } } } },
    })
    const start = today()
    for (const h of hotels) {
      // Gohost: hạng phòng → (ngày → giá) + gói đã dùng
      const got = new Map<string, { planId: string; rates: Map<string, number> }>()
      for (let d = 0; d < DAYS; d += WINDOW) {
        const checkin = addDays(start, d)
        const checkout = addDays(start, Math.min(d + WINDOW, DAYS))
        for (const rt of await roomTypes(h.gohostTenantId!, checkin, checkout)) {
          const ours = h.roomTypes.find(x => x.gohostRoomTypeId === rt.id)?.ratePlans[0]
          if (!ours) continue
          const plan = rt.rate_plans?.find(p => p.id === ours.gohostRatePlanId) ?? rt.rate_plans?.find(p => p.is_default) ?? rt.rate_plans?.[0]
          if (!plan || plan.currency !== 'VND') continue
          const e = got.get(ours.id) ?? { planId: plan.id, rates: new Map() }
          for (const x of plan.days_breakdown ?? []) if (x.price > 0) e.rates.set(x.day, Math.round(x.price))
          got.set(ours.id, e)
        }
      }

      console.log(`${h.slug} (${DAYS} ngày từ ${start})`)
      for (const rt of h.roomTypes) {
        const plan = rt.ratePlans[0]
        const e = plan && got.get(plan.id)
        const n = e?.rates.size ?? 0
        console.log(`  ${rt.slug}: ${n} đêm có giá${n < DAYS ? ` — thiếu ${DAYS - n} đêm (Gohost không trả giá → web không bán đêm đó)` : ''}`)
        if (!plan || !e || DRY) continue
        const rows = [...e.rates]
        // Gói chưa có giá gốc → lấy giá xuất hiện nhiều nhất (giá ngày thường) làm gốc cho quy tắc % / "Sinh giá".
        const count = new Map<number, number>()
        for (const [, p] of rows) count.set(p, (count.get(p) ?? 0) + 1)
        const common = [...count].sort((a, b) => b[1] - a[1])[0]?.[0]
        await db.$transaction([
          ...rows.map(([day, price]) => db.dailyRate.upsert({
            where: { ratePlanId_date: { ratePlanId: plan.id, date: new Date(`${day}T00:00:00.000Z`) } },
            update: { price },
            create: { ratePlanId: plan.id, date: new Date(`${day}T00:00:00.000Z`), price },
          })),
          db.ratePlan.update({ where: { id: plan.id }, data: { gohostRatePlanId: e.planId, ...(plan.basePrice == null && common ? { basePrice: common } : {}) } }),
          db.auditLog.create({ data: { action: 'import-gohost-rates', entity: 'RatePlan', entityId: plan.id, after: { days: rows.length, from: start, gohostRatePlanId: e.planId } } }),
        ])
      }
    }
    console.log(DRY ? 'Chạy thử (--dry): chưa ghi gì.' : 'Đã ghi giá.')
  } finally {
    await db.$disconnect()
  }
}

main().catch(e => { console.error(e instanceof Error ? e.message : e); process.exitCode = 1 })

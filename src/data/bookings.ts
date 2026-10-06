// Sinh booking giả lập bằng seed cố định (cùng kết quả mỗi lần chạy).
// Cách sinh: mỗi hạng phòng, mỗi đêm có công suất mục tiêu theo mùa → tạo booking cho tới khi đạt.
// Booking có ngày tạo sau "hôm nay" (06/10/2026) chưa tồn tại → chỉ chiếm chỗ ảo, nên đêm tương lai
// càng xa càng ít phòng đã bán (giống on-the-books thật).
// Ví dụ trong PDF được dựng chính xác: tồn 20/10 PITO Deluxe Ocean View, 3 phòng còn 12–15/10,
// thẻ AI 20–23/10, hồ sơ Nguyễn Văn A.
import type { Agent, Booking, BookingAddon, BookingStatus, Channel, Ota, Payment, PaymentStatus, RoomType } from '@/lib/types'
import { TODAY, addDays, diffDays, isWeekendNight, nightsBetween } from '@/lib/format'
import { addonLine, agentNet, daysBreakdown } from '@/lib/pricing'
import { makeRng, nationalityOf, personName, phoneOf, slugEmail } from '@/lib/rng'
import { HOTELS, RATE_PLANS, ROOM_TYPES } from './hotels'
import { ADDONS, AGENTS, CUSTOMERS, PROMOTIONS } from './commerce'

const START = '2025-12-01'
const LEN = diffDays(START, '2027-02-01')
const GEN_FROM = '2026-07-01'
const GEN_TO = '2026-12-31'

const MONTH_OCC: Record<number, number> = { 7: 0.8, 8: 0.84, 9: 0.735, 10: 0.74, 11: 0.78, 12: 0.86 }
const HOTEL_ADJ: Record<string, number> = { H01: 0.05, H02: 0.01, H03: 0.02, H04: -0.06, H05: -0.03 }

/** Đêm có số phòng đã bán chốt cứng (để tái hiện ví dụ PDF). */
const FIXED: Record<string, Record<string, number>> = {
  'RT-PITO-DOV': { '2026-10-12': 27, '2026-10-13': 27, '2026-10-14': 27, '2026-10-20': 23 },
  'RT-PITO-FOV': { '2026-10-20': 6, '2026-10-21': 6, '2026-10-22': 6 },
  'RT-CAL-FS': { '2026-10-20': 3, '2026-10-21': 3, '2026-10-22': 3 },
}

const addon = (id: string) => ADDONS.find(a => a.id === id)!
const plansOf = (rt: RoomType) => RATE_PLANS.filter(p => p.room_type_id === rt.room_type_id)
const OTAS: [Ota, number][] = [['Booking.com', 45], ['Agoda', 35], ['Traveloka', 20]]

export function generateBookings(): Booking[] {
  const rng = makeRng(20261006)
  const out: Booking[] = []
  const filled = new Map<string, Int16Array>() // gồm cả chỗ ảo
  const cap = new Map<string, Int16Array>()
  for (const rt of ROOM_TYPES) {
    filled.set(rt.room_type_id, new Int16Array(LEN))
    const c = new Int16Array(LEN).fill(rt.quantity)
    for (const [d, n] of Object.entries(FIXED[rt.room_type_id] ?? {})) c[diffDays(START, d)] = n
    cap.set(rt.room_type_id, c)
  }
  let seq = 0
  const nextCode = () => `RH${String(++seq).padStart(6, '0')}`
  const agentPairs = AGENTS.map(a => [a, a.share] as const)
  const coversFixed = (rt: RoomType, checkin: string, nights: number) =>
    nightsBetween(checkin, addDays(checkin, nights)).some(d => FIXED[rt.room_type_id]?.[d] != null)

  function occupy(rt: RoomType, checkin: string, nights: number, rooms: number) {
    const f = filled.get(rt.room_type_id)!
    for (let k = 0; k < nights; k++) f[diffDays(START, checkin) + k] += rooms
  }

  interface Opts { channel?: Channel; agent?: Agent; ota?: Ota; forceReal?: boolean; cancelled?: boolean; customerId?: string; adults?: number; children?: number }

  function make(rt: RoomType, checkin: string, nights: number, rooms: number, o: Opts = {}): Booking | null {
    const channel = o.channel ?? rng.weighted<Channel>([['website', 30], ['offline', 8], ['agent', 27], ['ota', 35]])
    const lead = { website: rng.int(3, 75), offline: rng.int(0, 10), agent: rng.int(7, 90), ota: rng.int(1, 50) }[channel]
    let created = addDays(checkin, -lead)
    if (created > TODAY) {
      if (!o.forceReal) { if (!o.cancelled) occupy(rt, checkin, nights, rooms); return null }
      created = addDays(TODAY, -rng.int(1, 25))
    }
    if (!o.cancelled) occupy(rt, checkin, nights, rooms)
    const checkout = addDays(checkin, nights)
    const hotel = HOTELS.find(h => h.id === rt.hotel_id)!
    const [ro, bb] = plansOf(rt)
    const plan = rng.next() < 0.65 ? bb : ro
    const agent = channel === 'agent' ? (o.agent ?? rng.weighted(agentPairs)) : undefined
    const ota = channel === 'ota' ? (o.ota ?? rng.weighted(OTAS)) : undefined
    const adults = o.adults ?? Math.min(rt.max_adults, rng.next() < 0.1 ? 1 : rt.max_adults >= 4 ? rng.int(2, 4) : 2) * rooms
    const children = o.children ?? (rt.family ? rng.int(0, rt.max_children) : rng.next() < 0.25 ? 1 : 0) * rooms
    const days_breakdown = agent
      ? nightsBetween(checkin, checkout).map(day => ({ day, price: agentNet(agent, rt) }))
      : daysBreakdown(rt, plan, checkin, checkout)
    const room_total = days_breakdown.reduce((s, d) => s + d.price, 0) * rooms

    let discount = 0
    let promo_id: string | undefined
    if (channel === 'website') {
      const p = lead >= 30 ? PROMOTIONS[0] : nights >= 4 ? PROMOTIONS[1] : children > 0 && PROMOTIONS[2].hotel_ids.includes(hotel.id) ? PROMOTIONS[2] : undefined
      if (p) { discount = Math.round(room_total * p.discount_pct / 100 / 1000) * 1000; promo_id = p.id }
    }
    const addons: BookingAddon[] = []
    if (channel === 'website' || channel === 'offline') {
      if (rng.next() < 0.25) addons.push(addonLine(addon('AD-TRF'), 2, adults, children))
      if (rng.next() < 0.12) addons.push(addonLine(addon(rng.pick(['AD-T4D', 'AD-TBD', 'AD-TCM'])), 1, adults, children))
      if (rng.next() < 0.05) addons.push(addonLine(addon('AD-RSS'), 1, adults, children))
      if (rng.next() < 0.06) addons.push(addonLine(addon('AD-SPA'), 1, Math.min(adults, 2), 0))
    }
    const addons_total = addons.reduce((s, a) => s + a.total, 0)
    const total = room_total - discount + addons_total

    // khách
    let customer_id = o.customerId
    if (!customer_id && (channel === 'website' || channel === 'offline') && rng.next() < 0.06) customer_id = CUSTOMERS[rng.int(1, CUSTOMERS.length - 1)].id
    const crm = customer_id ? CUSTOMERS.find(c => c.id === customer_id) : undefined
    const name = crm?.name ?? personName(rng, channel === 'ota' ? 0.35 : channel === 'agent' ? 0.1 : 0.05)
    const guest = { name, phone: crm?.phone ?? phoneOf(rng), email: crm?.email ?? slugEmail(name, rng.int(1, 999)), nationality: crm?.nationality ?? nationalityOf(name) }

    // trạng thái
    let status: BookingStatus
    if (o.cancelled) status = 'cancelled'
    else if (checkout <= TODAY) status = rng.next() < 0.015 ? 'no_show' : 'finished'
    else if (checkin <= TODAY) status = 'checked_in'
    else status = (channel === 'website' || channel === 'agent') && diffDays(created, TODAY) <= 3 && rng.next() < 0.4 ? 'new' : 'confirmed'

    // thanh toán
    const at = `${created}T${String(rng.int(7, 22)).padStart(2, '0')}:${String(rng.int(0, 59)).padStart(2, '0')}:00`
    const payments: Payment[] = []
    let payment_status: PaymentStatus = 'unpaid'
    const past = checkin <= TODAY
    const pay = (method: Payment['method'], amount: number, when = at, note?: string) =>
      payments.push({ id: `PM${seq}-${payments.length + 1}`, at: when, method, amount, note })
    if (status !== 'cancelled') {
      if (channel === 'website') {
        const method = rng.pick(['card', 'qr', 'card', 'transfer'] as const)
        if (past || rng.next() < 0.55) { pay(method, total); payment_status = 'paid' }
        else { pay(method, Math.round(total * 0.3 / 1000) * 1000, at, 'Đặt cọc 30%'); payment_status = 'deposit' }
      } else if (channel === 'offline') {
        if (past) { pay(rng.pick(['cash', 'transfer', 'card'] as const), total, `${checkin}T14:30:00`); payment_status = 'paid' }
        else if (rng.next() < 0.5) { pay('transfer', Math.round(total * 0.3 / 1000) * 1000, at, 'Đặt cọc 30%'); payment_status = 'deposit' }
      } else if (channel === 'ota') { pay('ota', total, at, `${ota} thu hộ`); payment_status = 'paid' }
      else {
        if (rng.next() < 0.3) { pay('transfer', total, at, 'Đại lý thanh toán ngay'); payment_status = 'paid' }
        else if (checkout < addDays(TODAY, -25)) { pay('transfer', total, `${addDays(checkout, 20)}T10:00:00`, 'Đối soát công nợ tháng'); payment_status = 'paid' }
        else payment_status = 'credit'
      }
    }
    const source_name = channel === 'website' ? 'Website' : channel === 'offline' ? 'Offline – Lễ tân' : channel === 'ota' ? ota! : `Agent ${agent!.name}`
    const timeline = [{ at, by: source_name, text: 'Tạo booking' }]
    if (status === 'cancelled') timeline.push({ at: `${addDays(created, rng.int(1, Math.max(1, diffDays(created, checkin) - 1)))}T09:15:00`, by: 'Khách', text: 'Huỷ booking' })
    if (status === 'checked_in' || status === 'finished') timeline.push({ at: `${checkin}T14:20:00`, by: 'Lễ tân', text: 'Nhận phòng' })
    if (status === 'finished') timeline.push({ at: `${checkout}T11:30:00`, by: 'Lễ tân', text: 'Trả phòng' })
    if (status === 'no_show') timeline.push({ at: `${addDays(checkin, 1)}T08:00:00`, by: 'Lễ tân', text: 'Đánh dấu No-show' })

    const b: Booking = {
      code: nextCode(), hotel_id: hotel.id, checkin_date: checkin, checkout_date: checkout,
      booking_rooms: Array.from({ length: rooms }, () => ({ room_type_id: rt.room_type_id, rate_plan_id: plan.rate_plan_id, days_breakdown })),
      adults, children, channel, source_name, ota, agent_id: agent?.id,
      source_commission: ota ? rng.int(15, 18) : undefined,
      customer_id, guest, status, payment_status,
      payment_collect: channel === 'ota' ? 'ota' : channel === 'website' ? 'online' : channel === 'offline' ? 'property' : '',
      payments, room_total, discount, promo_id, addons, addons_total, total,
      public_total: agent ? rt.public_rate * nights * rooms : undefined,
      created_at: at, created_by: source_name, timeline,
    }
    out.push(b)
    // ~7,4% booking bị huỷ: bản sao cùng thông số, không chiếm tồn
    if (!o.cancelled && !o.forceReal && rng.next() < 0.08) make(rt, checkin, nights, rooms, { ...o, channel, cancelled: true })
    return b
  }

  const rt = (id: string) => ROOM_TYPES.find(r => r.room_type_id === id)!

  // 1) Hồ sơ Nguyễn Văn A (PDF §7): 4 booking · 11 đêm · 42 triệu · lần gần nhất 05/09/2026
  const nva: [string, string, number, number, [string, number][]][] = [
    ['RT-PITO-FOV', '2025-12-28', 4, 3_450_000, [['AD-TRF', 2]]],
    ['RT-PITO-DOV', '2026-04-30', 3, 3_000_000, [['AD-T4D', 1]]],
    ['RT-PITO-FOV', '2026-07-18', 2, 3_100_000, [['AD-TRF', 2]]],
    ['RT-PITO-FOV', '2026-09-03', 2, 3_100_000, [['AD-SPA', 1]]],
  ]
  for (const [id, checkin, nights, price, adds] of nva) {
    const b = make(rt(id), checkin, nights, 1, { channel: 'website', forceReal: true, customerId: 'C001', adults: 2, children: 1 })!
    const plan = RATE_PLANS.find(p => p.room_type_id === id && p.has_breakfast)!
    b.booking_rooms = [{ room_type_id: id, rate_plan_id: plan.rate_plan_id, days_breakdown: nightsBetween(checkin, b.checkout_date).map(day => ({ day, price })) }]
    b.room_total = price * nights
    b.discount = 0; b.promo_id = undefined
    b.addons = adds.map(([aid, q]) => addonLine(addon(aid), q, aid === 'AD-SPA' ? 1 : 2, aid === 'AD-SPA' ? 0 : 1))
    b.addons_total = b.addons.reduce((s, a) => s + a.total, 0)
    b.total = b.room_total + b.addons_total
    b.payments = [{ id: `PM-NVA-${checkin}`, at: b.created_at, method: 'card', amount: b.total }]
    b.payment_status = 'paid'
    if (b.status === 'no_show') b.status = 'finished'
  }

  // 2) Tồn 20/10 PITO Deluxe Ocean View (PDF §6): Website 7 · Agent 5 · OTA 8 · Offline 3 → còn 7
  const dov = rt('RT-PITO-DOV')
  const ex: [Channel, Agent?][] = [
    ...Array.from({ length: 7 }, () => ['website'] as [Channel]),
    ['agent', AGENTS[0]], ['agent', AGENTS[0]], ['agent', AGENTS[1]], ['agent', AGENTS[2]], ['agent', AGENTS[3]],
    ...Array.from({ length: 8 }, () => ['ota'] as [Channel]),
    ...Array.from({ length: 3 }, () => ['offline'] as [Channel]),
  ]
  for (const [channel, agent] of ex) {
    const checkin = rng.pick(['2026-10-18', '2026-10-19', '2026-10-20'])
    make(dov, checkin, diffDays(checkin, '2026-10-21') + rng.int(0, 1), 1, { channel, agent, forceReal: true })
  }

  // 3) Lấp đầy theo công suất mục tiêu
  for (const r of ROOM_TYPES) {
    const f = filled.get(r.room_type_id)!
    const c = cap.get(r.room_type_id)!
    for (let d = GEN_FROM; d <= GEN_TO; d = addDays(d, 1)) {
      const i = diffDays(START, d)
      const fixed = FIXED[r.room_type_id]?.[d]
      const occ = (MONTH_OCC[Number(d.slice(5, 7))] ?? 0.75) + HOTEL_ADJ[r.hotel_id] + (isWeekendNight(d) ? 0.07 : 0) + (rng.next() - 0.5) * 0.14
      const target = Math.min(c[i], fixed ?? Math.round(r.quantity * Math.max(0.25, Math.min(1, occ))))
      for (let guard = 0; f[i] < target && guard < 100; guard++) {
        let rooms = r.quantity >= 8 && rng.next() < 0.1 && f[i] + 2 <= target ? 2 : 1
        const want = rng.weighted([[1, 15], [2, 36], [3, 28], [4, 13], [5, 5], [6, 3]] as const)
        const fit = (n: number) => { let k = 0; while (k < n && i + k < LEN && f[i + k] + rooms <= c[i + k]) k++; return k }
        let nights = fit(want)
        if (nights === 0) { rooms = 1; nights = fit(want) }
        if (nights === 0) break
        make(r, d, nights, rooms, { forceReal: coversFixed(r, d, nights) })
      }
    }
  }
  return out
}

// Repo giả lập: đọc dữ liệu seed + phần thay đổi trong DemoStore.
// Khi nối thật: viết repo khác cùng chữ ký (type Repo trong ./index.ts), gọi backend Rooty —
// backend gọi Gohost (phòng/giá/tồn/booking) và TourWell (khách, thanh toán, đại lý). Không gọi Gohost từ trình duyệt.
import type {
  Addon, Agent, AgentApplication, Area, Article, Booking, BookingStatus, Channel, Customer, Guest, Hotel, HotelTag, Lead,
  Payment, PaymentMethod, Promotion, RatePlan, RoomType,
} from '../types'
import { HOTELS, RATE_PLANS, ROOM_TYPES } from '@/data/hotels'
import { ADDONS, ADMIN_USERS, AGENTS, CUSTOMERS, PROMOTIONS } from '@/data/commerce'
import { ARTICLES, DESTINATIONS, EXPERIENCES, HOME_BANNER } from '@/data/content'
import { generateBookings } from '@/data/bookings'
import { demoStore, nowISO } from '@/store/demo-store'
import { TODAY, addDays, diffDays, monthRange, nightsBetween } from '../format'
import { agentNet, bestPromo, daysBreakdown, nightPrice, quote as priceQuote, rateKey, type Quote } from '../pricing'
import { availability, buildSoldIndex, cell, closureKey, type InventoryCell, type SoldIndex } from '../inventory'
import { byAgent, byHotel, byRoomType, dailyRevenue, inPeriod, kpis, previousPeriod, returning, type Period } from '../metrics'

// ---------- nền ----------
const wait = () => (typeof window === 'undefined' ? Promise.resolve() : new Promise(r => setTimeout(r, 300 + Math.random() * 300)))

let BASE: Booking[] | null = null
const base = () => (BASE ??= generateBookings())

let cache: { v: number; bookings: Booking[]; idx: SoldIndex; closures: Set<string> } | null = null
function db() {
  const v = demoStore.version()
  if (cache?.v !== v) {
    const o = demoStore.get()
    const bookings = [...base(), ...o.bookings].map(b => o.edited[b.code] ?? b)
    cache = { v, bookings, idx: buildSoldIndex(bookings), closures: new Set(o.closures) }
  }
  return cache
}
const ov = () => demoStore.get()

const hotels = (): Hotel[] => HOTELS.map(h => ({ ...h, ...ov().hotelEdits[h.id] }))
const hotelById = (id: string) => hotels().find(h => h.id === id)!
const rtById = (id: string) => ROOM_TYPES.find(r => r.room_type_id === id)!
const plansOf = (rtId: string) => RATE_PLANS.filter(p => p.room_type_id === rtId)
const planById = (id: string) => RATE_PLANS.find(p => p.rate_plan_id === id)!
const promotions = (): Promotion[] => {
  const edits = ov().promotions
  return [...PROMOTIONS.map(p => edits[p.id] ?? p), ...Object.values(edits).filter(p => !PROMOTIONS.some(x => x.id === p.id))]
}
const agents = (): Agent[] => [...AGENTS, ...ov().agentsAdded].map(a => ({ ...a, ...ov().agentEdits[a.id] }))
const customers = (): Customer[] => [...CUSTOMERS, ...ov().customersAdded]
const scopeRooms = (hotelId?: string) => (hotelId && hotelId !== 'all' ? ROOM_TYPES.filter(r => r.hotel_id === hotelId) : ROOM_TYPES)
const scopeBookings = (hotelId?: string) => (hotelId && hotelId !== 'all' ? db().bookings.filter(b => b.hotel_id === hotelId) : db().bookings)
const isMember = () => !!ov().session.customerId

function saveBooking(b: Booking) {
  const o = ov()
  if (o.bookings.some(x => x.code === b.code)) demoStore.update(() => ({ bookings: o.bookings.map(x => (x.code === b.code ? b : x)) }))
  else demoStore.update(() => ({ edited: { ...o.edited, [b.code]: b } }))
}
const newCode = () => `RH${String(800001 + ov().bookings.length)}`

// ---------- kiểu trả về ----------
export interface SearchQuery {
  dest?: string // '' | 'phu-quoc' | area | hotel slug
  checkin: string
  checkout: string
  adults: number
  children: number
  rooms: number
  areas?: Area[]
  stars?: number[]
  tags?: HotelTag[]
  maxPrice?: number
  sort?: 'recommended' | 'price-asc' | 'price-desc' | 'stars'
  promo?: string // slug ưu đãi
}
export interface PlanOffer { plan: RatePlan; nightly: number; total: number; promo?: Promotion; totalAfterPromo: number }
export interface RoomOffer { rt: RoomType; plans: PlanOffer[]; left: number; fits: boolean; personalized?: boolean }
export interface HotelResult { hotel: Hotel; offers: RoomOffer[]; fromPrice: number; left: number; promo?: Promotion; score: number }

const fits = (rt: RoomType, adults: number, children: number, rooms: number) =>
  adults <= rt.max_adults * rooms && adults + children <= (rt.max_adults + rt.max_children) * rooms

function offersFor(hotel: Hotel, q: Omit<SearchQuery, 'dest'>, personalize: boolean): RoomOffer[] {
  const { idx, closures } = db()
  const promos = promotions()
  const chosen = q.promo ? promos.find(p => p.slug === q.promo)?.id : undefined
  const nights = diffDays(q.checkin, q.checkout)
  return ROOM_TYPES.filter(r => r.hotel_id === hotel.id).map(rt => {
    const plans = plansOf(rt.room_type_id).map(plan => {
      const dbk = daysBreakdown(rt, plan, q.checkin, q.checkout, ov().rateOverrides)
      const total = dbk.reduce((s, d) => s + d.price, 0) * q.rooms
      const promo = bestPromo(promos, { hotel_id: hotel.id, checkin: q.checkin, checkout: q.checkout, children: q.children, addonCategories: [], chosenPromoId: chosen, today: TODAY })
      const totalAfterPromo = Math.round(total * (1 - (promo?.discount_pct ?? 0) / 100))
      return { plan, nightly: Math.round(total / q.rooms / nights), total, promo, totalAfterPromo }
    })
    return {
      rt, plans, left: availability(idx, rt, q.checkin, q.checkout, closures), fits: fits(rt, q.adults, q.children, q.rooms),
      personalized: personalize && (rt.ocean_view || rt.family),
    }
  })
}

const personalRank = (o: RoomOffer) => (o.rt.ocean_view ? 2 : 0) + (o.rt.family ? 1 : 0)

// ---------- repo ----------
export const mockRepo = {
  // --- catalog ---
  async listHotels() { await wait(); return hotels() },
  async getHotel(slug: string) { await wait(); return hotels().find(h => h.slug === slug) ?? null },
  hotelSlugs: () => HOTELS.map(h => h.slug), // dùng cho generateStaticParams (đồng bộ)
  roomParams: () => ROOM_TYPES.map(r => ({ hotel: HOTELS.find(h => h.id === r.hotel_id)!.slug, room: r.slug })),
  async listRoomTypes(hotelId?: string) { await wait(); return scopeRooms(hotelId) },
  async getRoom(hotelSlug: string, roomSlug: string) {
    await wait()
    const hotel = hotels().find(h => h.slug === hotelSlug)
    const rt = hotel && ROOM_TYPES.find(r => r.hotel_id === hotel.id && r.slug === roomSlug)
    return hotel && rt ? { hotel, rt, plans: plansOf(rt.room_type_id) } : null
  },
  async listPromotions(opts: { hotelId?: string; all?: boolean } = {}) {
    await wait()
    return promotions().filter(p => (opts.all || p.active) && (!opts.hotelId || p.hotel_ids === 'all' || p.hotel_ids.includes(opts.hotelId)))
  },
  async getPromotion(slug: string) { await wait(); return promotions().find(p => p.slug === slug) ?? null },
  async listAddons(category?: Addon['category']) { await wait(); return ADDONS.filter(a => !category || a.category === category) },
  async listDestinations() { await wait(); return DESTINATIONS },
  async listExperiences() { await wait(); return EXPERIENCES },
  async getExperience(slug: string) {
    await wait()
    const e = EXPERIENCES.find(x => x.slug === slug)
    return e ? { ...e, addons: ADDONS.filter(a => e.addon_ids.includes(a.id)) } : null
  },
  async listArticles(all = false) {
    await wait()
    return ARTICLES.map(a => ({ ...a, ...ov().articleEdits[a.slug] })).filter(a => all || a.published)
  },
  async getArticle(slug: string) {
    await wait()
    const a = ARTICLES.find(x => x.slug === slug)
    return a ? { ...a, ...ov().articleEdits[slug] } : null
  },
  async getBanner() { await wait(); return ov().banner ?? HOME_BANNER },

  // --- tìm phòng ---
  async search(q: SearchQuery): Promise<HotelResult[]> {
    await wait()
    const personalize = ov().session.customerId === 'C001'
    let list = hotels()
    if (q.dest && q.dest !== 'phu-quoc') list = list.filter(h => h.area === q.dest || h.slug === q.dest)
    if (q.areas?.length) list = list.filter(h => q.areas!.includes(h.area))
    if (q.stars?.length) list = list.filter(h => q.stars!.includes(h.stars))
    if (q.tags?.length) list = list.filter(h => q.tags!.every(t => h.tags.includes(t)))
    const results = list.map(hotel => {
      const offers = offersFor(hotel, q, personalize).filter(o => o.fits)
      if (personalize) offers.sort((a, b) => personalRank(b) - personalRank(a))
      const sellable = offers.filter(o => o.left >= q.rooms)
      const fromPrice = Math.min(...sellable.flatMap(o => o.plans.map(p => p.nightly)))
      const promo = sellable.flatMap(o => o.plans.map(p => p.promo)).find(Boolean)
      const score = hotel.stars + (personalize && hotel.tags.includes('gan-bien') ? 3 : 0) + (sellable.length ? 0 : -10)
      return { hotel, offers, fromPrice: Number.isFinite(fromPrice) ? fromPrice : 0, left: sellable.reduce((s, o) => s + o.left, 0), promo, score }
    }).filter(r => r.offers.length && (!q.maxPrice || (r.fromPrice && r.fromPrice <= q.maxPrice)))
    const sorters: Record<string, (a: HotelResult, b: HotelResult) => number> = {
      recommended: (a, b) => b.score - a.score,
      'price-asc': (a, b) => (a.fromPrice || 9e9) - (b.fromPrice || 9e9),
      'price-desc': (a, b) => b.fromPrice - a.fromPrice,
      stars: (a, b) => b.hotel.stars - a.hotel.stars,
    }
    return results.sort(sorters[q.sort ?? 'recommended'])
  },
  async hotelOffers(hotelId: string, q: Omit<SearchQuery, 'dest'>) {
    await wait()
    return offersFor(hotelById(hotelId), q, ov().session.customerId === 'C001')
  },
  /** Lịch giá theo tháng cho 1 hạng phòng (gói ăn sáng) + số phòng còn. */
  async priceCalendar(rtId: string, ym: string) {
    await wait()
    const { idx, closures } = db()
    const rt = rtById(rtId)
    const bb = plansOf(rtId).find(p => p.has_breakfast)!
    const { from, to } = monthRange(ym)
    return nightsBetween(from, addDays(to, 1)).map(day => ({ day, price: nightPrice(rt, bb, day, ov().rateOverrides), left: cell(idx, rt, day, closures).left, past: day < TODAY }))
  },
  async getRoomsByIds(ids: string[]) {
    await wait()
    return ids.map(id => { const rt = rtById(id); return rt && { rt, hotel: hotelById(rt.hotel_id), plans: plansOf(id) } }).filter(Boolean) as { rt: RoomType; hotel: Hotel; plans: RatePlan[] }[]
  },

  // --- đặt phòng ---
  async quote(input: QuoteInput): Promise<Quote & { left: number }> {
    await wait()
    return quoteSync(input)
  },
  async createBooking(input: CreateBookingInput): Promise<Booking> {
    await wait()
    const q = quoteSync(input)
    if (q.left < input.rooms) throw new Error('Hết phòng cho khoảng ngày này. Vui lòng chọn ngày hoặc hạng phòng khác.')
    const customer_id = input.customer_id ?? linkCustomer(input.guest)
    const at = nowISO()
    const paidFull = input.payment.method !== 'hotel' && input.payment.method !== 'transfer' && input.payment.mode === 'full'
    const payments: Payment[] = []
    if (input.payment.method === 'card' || input.payment.method === 'qr')
      payments.push({ id: `PM-${at}`, at, method: input.payment.method, amount: paidFull ? q.total : q.deposit, note: paidFull ? undefined : 'Đặt cọc 30%' })
    const offline = input.channel === 'offline'
    const b: Booking = {
      code: newCode(), hotel_id: rtById(input.room_type_id).hotel_id, checkin_date: input.checkin, checkout_date: input.checkout,
      booking_rooms: Array.from({ length: input.rooms }, () => ({ room_type_id: input.room_type_id, rate_plan_id: input.rate_plan_id, days_breakdown: q.days_breakdown })),
      adults: input.adults, children: input.children, child_ages: input.child_ages,
      channel: input.channel, source_name: offline ? 'Offline – Lễ tân' : 'Website', customer_id, guest: input.guest,
      status: payments.length ? 'confirmed' : 'new',
      payment_status: payments.length ? (paidFull ? 'paid' : 'deposit') : 'unpaid',
      payment_collect: input.payment.method === 'hotel' || offline ? 'property' : 'online',
      payments, room_total: q.room_total, discount: q.discount, promo_id: q.promo?.id, addons: q.addons, addons_total: q.addons_total, total: q.total,
      notes: input.notes, arrival_hour: input.arrival_hour, invoice: input.invoice,
      created_at: at, created_by: input.created_by,
      timeline: [{ at, by: input.created_by, text: offline ? 'Nhân viên tạo booking (Offline)' : 'Khách đặt trên website' }, ...payments.map(p => ({ at, by: 'Cổng thanh toán (giả lập)', text: `Thanh toán ${p.amount.toLocaleString('vi-VN')}đ` }))],
    }
    demoStore.update(o => ({ bookings: [...o.bookings, b] }))
    return b
  },
  async getBooking(code: string) {
    await wait()
    const b = db().bookings.find(x => x.code === code)
    return b ? bookingView(b) : null
  },
  async findBooking(code: string, contact: string) {
    await wait()
    const c = contact.trim().toLowerCase()
    const b = db().bookings.find(x => x.code.toLowerCase() === code.trim().toLowerCase() && (x.guest.email.toLowerCase() === c || x.guest.phone.replace(/\s/g, '') === c.replace(/\s/g, '')))
    return b ? bookingView(b) : null
  },
  async listBookings(f: BookingFilter = {}) {
    await wait()
    let rows = scopeBookings(f.hotelId)
    if (f.channel) rows = rows.filter(b => b.channel === f.channel)
    if (f.ota) rows = rows.filter(b => b.ota === f.ota)
    if (f.agentId) rows = rows.filter(b => b.agent_id === f.agentId)
    if (f.status) rows = rows.filter(b => b.status === f.status)
    if (f.payment) rows = rows.filter(b => b.payment_status === f.payment)
    if (f.customerId) rows = rows.filter(b => b.customer_id === f.customerId)
    if (f.roomTypeId) rows = rows.filter(b => b.booking_rooms.some(r => r.room_type_id === f.roomTypeId))
    if (f.from) rows = rows.filter(b => b.checkin_date >= f.from!)
    if (f.to) rows = rows.filter(b => b.checkin_date <= f.to!)
    if (f.stayDay) rows = rows.filter(b => b.checkin_date <= f.stayDay! && b.checkout_date > f.stayDay! && b.status !== 'cancelled')
    if (f.q) {
      const q = f.q.toLowerCase()
      rows = rows.filter(b => b.code.toLowerCase().includes(q) || b.guest.name.toLowerCase().includes(q) || b.guest.phone.includes(q) || b.guest.email.toLowerCase().includes(q))
    }
    rows = [...rows].sort((a, b) => (f.sort === 'checkin' ? a.checkin_date.localeCompare(b.checkin_date) : b.created_at.localeCompare(a.created_at)))
    const page = f.page ?? 1, size = f.pageSize ?? 20
    return { total: rows.length, sum: rows.reduce((s, b) => s + b.total, 0), rows: rows.slice((page - 1) * size, page * size).map(bookingView) }
  },
  async setBookingStatus(code: string, status: BookingStatus, by: string, reason?: string) {
    await wait()
    const b = db().bookings.find(x => x.code === code)!
    const at = nowISO()
    const label: Record<BookingStatus, string> = { new: 'Mới', confirmed: 'Xác nhận', checked_in: 'Nhận phòng', finished: 'Hoàn tất', cancelled: 'Huỷ booking', no_show: 'No-show' }
    const payment_status = status === 'cancelled' && b.payment_status === 'credit' ? 'unpaid' : b.payment_status
    saveBooking({ ...b, status, payment_status, timeline: [...b.timeline, { at, by, text: `${label[status]}${reason ? ` — ${reason}` : ''}` }] })
  },
  async addPayment(code: string, method: PaymentMethod, amount: number, by: string) {
    await wait()
    const b = db().bookings.find(x => x.code === code)!
    const at = nowISO()
    const payments = [...b.payments, { id: `PM-${at}`, at, method, amount }]
    const paid = payments.reduce((s, p) => s + p.amount, 0)
    saveBooking({ ...b, payments, payment_status: paid >= b.total ? 'paid' : 'deposit', timeline: [...b.timeline, { at, by, text: `Ghi nhận thanh toán ${amount.toLocaleString('vi-VN')}đ (${method})` }] })
  },

  // --- khách hàng / CRM ---
  async listCustomers(f: { q?: string; segment?: 'returning' | 'high' | 'family' } = {}) {
    await wait()
    let rows = customers().map(c => ({ ...c, stats: customerStats(c.id) }))
    if (f.q) { const q = f.q.toLowerCase(); rows = rows.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.email.includes(q)) }
    if (f.segment === 'returning') rows = rows.filter(c => c.stats.bookings >= 2)
    if (f.segment === 'high') rows = rows.filter(c => c.stats.spend >= 20_000_000)
    if (f.segment === 'family') rows = rows.filter(c => c.family)
    return rows.sort((a, b) => b.stats.spend - a.stats.spend)
  },
  async getCustomer(id: string) {
    await wait()
    const c = customers().find(x => x.id === id)
    if (!c) return null
    const stats = customerStats(id)
    const bookings = db().bookings.filter(b => b.customer_id === id).sort((a, b) => b.checkin_date.localeCompare(a.checkin_date)).map(bookingView)
    const actions = [
      ...(c.birthday.slice(5, 7) === TODAY.slice(5, 7) || c.birthday.slice(5, 7) === addDays(TODAY, 30).slice(5, 7) ? [{ kind: 'Sinh nhật', text: `Sinh nhật ${c.birthday.slice(8, 10)}/${c.birthday.slice(5, 7)} — gửi voucher 500.000đ` }] : []),
      ...(stats.bookings >= 2 ? [{ kind: 'Loyalty', text: `Khách quay lại ${stats.bookings} lần — mời nâng hạng, áp Member Price` }] : []),
      ...(!stats.boughtTour ? [{ kind: 'Cross-sell', text: 'Chưa mua tour — gợi ý tour 4 đảo Rooty Trip lần tới' }] : [{ kind: 'Cross-sell', text: 'Đã mua tour — gợi ý du thuyền hoàng hôn RIVUS' }]),
      ...(stats.lastStay && diffDays(stats.lastStay, TODAY) > 25 ? [{ kind: 'Remarketing', text: `Đã ${diffDays(stats.lastStay, TODAY)} ngày từ lần ở gần nhất — gửi ưu đãi ${c.preferences.includes('Ocean View') ? 'phòng Ocean View' : 'đặt sớm'}` }] : []),
      { kind: 'Voucher', text: c.vouchers.length ? `Còn ${c.vouchers.length} voucher chưa dùng — nhắc trước mùa cao điểm` : 'Tặng voucher 5% để kéo lần đặt tiếp theo' },
    ]
    return { customer: c, stats, bookings, actions }
  },
  customerBrief: (id: string) => { const c = customers().find(x => x.id === id); return c ? { ...c, stats: customerStats(id) } : null },

  // --- đại lý ---
  async listAgents() {
    await wait()
    const p = { from: '2026-01-01', to: '2026-12-31' }
    const stats = byAgent(db().bookings, agents(), p)
    return stats.map(s => ({ ...s, limitUsed: s.exposure / s.agent.credit_limit }))
  },
  async getAgent(id: string) {
    await wait()
    const agent = agents().find(a => a.id === id)
    if (!agent) return null
    return agentStatementSync(agent)
  },
  async listApplications() { await wait(); return ov().applications },
  async registerAgent(form: Omit<AgentApplication, 'id' | 'submitted_at' | 'status'>) {
    await wait()
    const app: AgentApplication = { ...form, id: `APP${ov().applications.length + 1}`, submitted_at: nowISO(), status: 'pending' }
    demoStore.update(o => ({ applications: [...o.applications, app] }))
    return app
  },
  async reviewApplication(id: string, approve: boolean) {
    await wait()
    const o = ov()
    const app = o.applications.find(a => a.id === id)!
    const applications = o.applications.map(a => (a.id === id ? { ...a, status: approve ? 'approved' : 'rejected' } as AgentApplication : a))
    const agentsAdded = approve
      ? [...o.agentsAdded, { id: `AG${String(AGENTS.length + o.agentsAdded.length + 1).padStart(2, '0')}`, name: app.company, tax_code: app.tax_code, contact: app.contact, phone: app.phone, email: app.email, address: app.address, credit_limit: 50_000_000, discount: 0.12, commission_pct: 1, net_overrides: {}, status: 'active' as const, joined: TODAY, share: 0 }]
      : o.agentsAdded
    demoStore.update(() => ({ applications, agentsAdded }))
  },
  async updateAgent(id: string, patch: Partial<Agent>) {
    await wait()
    demoStore.update(o => ({ agentEdits: { ...o.agentEdits, [id]: { ...o.agentEdits[id], ...patch } } }))
  },
  async agentSearch(agentId: string, q: { checkin: string; checkout: string; dest?: string; rooms: number }) {
    await wait()
    const agent = agents().find(a => a.id === agentId)!
    const { idx, closures } = db()
    const nights = diffDays(q.checkin, q.checkout)
    return hotels().filter(h => !q.dest || q.dest === 'phu-quoc' || h.area === q.dest || h.slug === q.dest).map(hotel => ({
      hotel,
      rooms: ROOM_TYPES.filter(r => r.hotel_id === hotel.id).map(rt => ({
        rt, public_rate: rt.public_rate, net_rate: agentNet(agent, rt), nights,
        left: availability(idx, rt, q.checkin, q.checkout, closures),
      })),
    }))
  },
  async createAgentBooking(input: AgentBookingInput) {
    await wait()
    const agent = agents().find(a => a.id === input.agent_id)!
    const rt = rtById(input.room_type_id)
    const { idx, closures } = db()
    const left = availability(idx, rt, input.checkin, input.checkout, closures)
    if (left < input.rooms) throw new Error(`Chỉ còn ${left} phòng cho khoảng ngày này.`)
    const net = agentNet(agent, rt)
    const nights = diffDays(input.checkin, input.checkout)
    const total = net * nights * input.rooms
    const st = agentStatementSync(agent)
    if (input.payment === 'credit' && st.exposure + total > agent.credit_limit)
      throw new Error(`Vượt hạn mức công nợ: đã dùng ${st.exposure.toLocaleString('vi-VN')}đ / hạn mức ${agent.credit_limit.toLocaleString('vi-VN')}đ. Chọn "Thanh toán ngay" hoặc liên hệ Rooty.`)
    const at = nowISO()
    const plan = plansOf(rt.room_type_id).find(p => p.has_breakfast)!
    const b: Booking = {
      code: newCode(), hotel_id: rt.hotel_id, checkin_date: input.checkin, checkout_date: input.checkout,
      booking_rooms: Array.from({ length: input.rooms }, () => ({ room_type_id: rt.room_type_id, rate_plan_id: plan.rate_plan_id, days_breakdown: nightsBetween(input.checkin, input.checkout).map(day => ({ day, price: net })) })),
      adults: input.adults, children: input.children, channel: 'agent', source_name: `Agent ${agent.name}`, agent_id: agent.id,
      guest: input.guest, guests_list: input.guests_list, status: 'confirmed',
      payment_status: input.payment === 'credit' ? 'credit' : 'paid', payment_collect: '',
      payments: input.payment === 'now' ? [{ id: `PM-${at}`, at, method: 'transfer', amount: total, note: 'Đại lý thanh toán ngay' }] : [],
      room_total: total, discount: 0, addons: [], addons_total: 0, total, public_total: rt.public_rate * nights * input.rooms,
      notes: input.notes, created_at: at, created_by: `Agent ${agent.name}`,
      timeline: [{ at, by: `Agent ${agent.name}`, text: `Đại lý đặt ${input.rooms} phòng qua Agent Portal` }],
    }
    demoStore.update(o => ({ bookings: [...o.bookings, b] }))
    return { booking: b, message: { source: `Agent ${agent.name}`, revenue: total, payment: input.payment === 'credit' ? 'Credit' : 'Paid', status: 'Confirmed' } }
  },

  // --- tồn & giá ---
  async inventoryGrid(hotelId: string, from: string, days: number) {
    await wait()
    const { idx, closures } = db()
    const dates = Array.from({ length: days }, (_, i) => addDays(from, i))
    return { dates, rows: ROOM_TYPES.filter(r => r.hotel_id === hotelId).map(rt => ({ rt, cells: dates.map(d => cell(idx, rt, d, closures)) as InventoryCell[] })) }
  },
  async toggleClosure(rtId: string, days: string[], close: boolean) {
    await wait()
    const keys = days.map(d => closureKey(rtId, d))
    demoStore.update(o => ({ closures: close ? [...new Set([...o.closures, ...keys])] : o.closures.filter(k => !keys.includes(k)) }))
  },
  async rateGrid(hotelId: string, from: string, days: number) {
    await wait()
    const dates = Array.from({ length: days }, (_, i) => addDays(from, i))
    const o = ov().rateOverrides
    return {
      dates,
      rows: ROOM_TYPES.filter(r => r.hotel_id === hotelId).flatMap(rt => plansOf(rt.room_type_id).map(plan => ({
        rt, plan, cells: dates.map(day => ({ day, price: nightPrice(rt, plan, day, o), edited: o[rateKey(plan.rate_plan_id, day)] != null })),
      }))),
    }
  },
  async bulkUpdateRates(a: { planIds: string[]; from: string; to: string; mode: 'set' | 'pct'; value: number; weekdays?: number[] }) {
    await wait()
    const o = { ...ov().rateOverrides }
    let n = 0
    for (const id of a.planIds) {
      const plan = planById(id), rt = rtById(plan.room_type_id)
      for (const day of nightsBetween(a.from, addDays(a.to, 1))) {
        if (a.weekdays?.length && !a.weekdays.includes(new Date(day + 'T00:00:00Z').getUTCDay())) continue
        const cur = nightPrice(rt, plan, day, o)
        o[rateKey(id, day)] = a.mode === 'set' ? a.value : Math.round((cur * (1 + a.value / 100)) / 1000) * 1000
        n++
      }
    }
    demoStore.update(() => ({ rateOverrides: o }))
    return n
  },

  // --- dashboard & báo cáo ---
  async dashboard(p: Period, hotelId = 'all') {
    await wait()
    const bookings = scopeBookings(hotelId)
    const rts = scopeRooms(hotelId)
    const hs = hotelId === 'all' ? hotels() : [hotelById(hotelId)]
    const rooms = byRoomType(bookings, rts, p).map(r => ({ ...r, hotel: hotelById(r.rt.hotel_id) }))
    return {
      current: kpis(bookings, rts, p),
      previous: kpis(bookings, rts, previousPeriod(p)),
      daily: dailyRevenue(bookings, rts, p),
      hotels: byHotel(bookings, hs, ROOM_TYPES, p),
      rooms: rooms.sort((a, b) => b.occupancy - a.occupancy),
      agents: byAgent(bookings, agents(), p).sort((a, b) => b.revenue - a.revenue),
      returning: returning(bookings, p),
    }
  },
  async report(a: { p: Period; hotelId?: string; groupBy: 'day' | 'month' | 'year' | 'hotel' | 'channel' | 'agent' }) {
    await wait()
    const bookings = scopeBookings(a.hotelId)
    const rts = scopeRooms(a.hotelId)
    const row = (label: string, k: ReturnType<typeof kpis>, key = label) => ({ key, label, bookings: k.bookings - k.cancelled, cancelled: k.cancelled, roomNights: k.roomNights, revenue: k.revenue, occupancy: k.occupancy, adr: k.adr })
    if (a.groupBy === 'hotel') return byHotel(bookings, a.hotelId && a.hotelId !== 'all' ? [hotelById(a.hotelId)] : hotels(), ROOM_TYPES, a.p).map(h => row(h.hotel.name, h))
    if (a.groupBy === 'channel') {
      const labels: Record<Channel, string> = { website: 'Website', offline: 'Offline (nhân viên)', agent: 'Đại lý', ota: 'OTA' }
      return (Object.keys(labels) as Channel[]).map(ch => row(labels[ch], kpis(bookings.filter(b => b.channel === ch), rts, a.p)))
    }
    if (a.groupBy === 'agent') return byAgent(bookings, agents(), a.p).map(s => ({ key: s.agent.id, label: s.agent.name, bookings: s.bookings, cancelled: 0, roomNights: s.rn, revenue: s.revenue, occupancy: 0, adr: s.rn ? s.revenue / s.rn : 0 }))
    const buckets: Period[] = []
    if (a.groupBy === 'day') for (let d = a.p.from; d <= a.p.to; d = addDays(d, 1)) buckets.push({ from: d, to: d })
    else if (a.groupBy === 'month') for (let ym = a.p.from.slice(0, 7); ym <= a.p.to.slice(0, 7); ym = addDays(monthRange(ym).to, 1).slice(0, 7)) buckets.push(monthRange(ym))
    else buckets.push({ from: `${a.p.from.slice(0, 4)}-01-01`, to: `${a.p.from.slice(0, 4)}-12-31` })
    return buckets.map(b => row(a.groupBy === 'day' ? b.from : a.groupBy === 'month' ? b.from.slice(0, 7) : b.from.slice(0, 4), kpis(bookings, rts, b)))
  },

  // --- thanh toán ---
  async transactions(f: { hotelId?: string; method?: PaymentMethod; from?: string; to?: string } = {}) {
    await wait()
    const rows = scopeBookings(f.hotelId).flatMap(b => b.payments.map(p => ({ ...p, booking: b.code, hotel_id: b.hotel_id, guest: b.guest.name, channel: b.channel, source_name: b.source_name })))
      .filter(t => (!f.method || t.method === f.method) && (!f.from || t.at.slice(0, 10) >= f.from) && (!f.to || t.at.slice(0, 10) <= f.to))
      .sort((a, b) => b.at.localeCompare(a.at))
    const byMethod = new Map<PaymentMethod, { count: number; amount: number }>()
    for (const t of rows) { const m = byMethod.get(t.method) ?? { count: 0, amount: 0 }; m.count++; m.amount += t.amount; byMethod.set(t.method, m) }
    const unpaid = scopeBookings(f.hotelId).filter(b => b.status !== 'cancelled' && (b.payment_status === 'unpaid' || b.payment_status === 'deposit'))
    return {
      rows: rows.slice(0, 300), count: rows.length, total: rows.reduce((s, t) => s + t.amount, 0),
      byMethod: [...byMethod.entries()].map(([method, v]) => ({ method, ...v, reconciled: Math.round(v.amount * (method === 'ota' ? 0.82 : 0.96)) })),
      receivable: unpaid.reduce((s, b) => s + b.total - b.payments.reduce((x, p) => x + p.amount, 0), 0), receivableCount: unpaid.length,
    }
  },

  // --- quản trị nội dung, ưu đãi, KS ---
  async savePromotion(p: Promotion) { await wait(); demoStore.update(o => ({ promotions: { ...o.promotions, [p.id]: p } })) },
  newPromotionId: () => `P${String(PROMOTIONS.length + Object.keys(ov().promotions).length + 1).padStart(2, '0')}`,
  async saveHotel(id: string, patch: Partial<Hotel>) { await wait(); demoStore.update(o => ({ hotelEdits: { ...o.hotelEdits, [id]: { ...o.hotelEdits[id], ...patch } } })) },
  async saveArticle(slug: string, patch: Partial<Article>) { await wait(); demoStore.update(o => ({ articleEdits: { ...o.articleEdits, [slug]: { ...o.articleEdits[slug], ...patch } } })) },
  async saveBanner(banner: { headline: string; sub: string }) { await wait(); demoStore.update(() => ({ banner })) },
  async submitLead(l: Omit<Lead, 'id' | 'at'>) { await wait(); demoStore.update(o => ({ leads: [...o.leads, { ...l, id: `L${o.leads.length + 1}`, at: nowISO() }] })) },
  async listLeads() { await wait(); return ov().leads },
  async listUsers() { await wait(); return ADMIN_USERS },
  users: () => ADMIN_USERS,
  hotelsSync: () => hotels(),
  agentsSync: () => agents(),
  customersSync: () => customers(),
}

// ---------- helpers ----------
export interface QuoteInput {
  room_type_id: string; rate_plan_id: string; checkin: string; checkout: string; rooms: number; adults: number; children: number
  addons: { addon_id: string; qty: number }[]; chosenPromoId?: string
}
export interface CreateBookingInput extends QuoteInput {
  child_ages?: number[]
  guest: Guest
  notes?: string
  arrival_hour?: string
  invoice?: { company: string; tax_code: string; address: string }
  payment: { method: 'card' | 'qr' | 'transfer' | 'hotel'; mode: 'deposit' | 'full' }
  channel: 'website' | 'offline'
  created_by: string
  customer_id?: string
}
export interface AgentBookingInput {
  agent_id: string; room_type_id: string; checkin: string; checkout: string; rooms: number; adults: number; children: number
  guest: Guest; guests_list: string[]; payment: 'now' | 'credit'; notes?: string
}
export interface BookingFilter {
  hotelId?: string; channel?: Channel; ota?: string; agentId?: string; status?: BookingStatus; payment?: Booking['payment_status']
  customerId?: string; roomTypeId?: string; from?: string; to?: string; stayDay?: string; q?: string
  sort?: 'created' | 'checkin'; page?: number; pageSize?: number
}

function quoteSync(input: QuoteInput) {
  const rt = rtById(input.room_type_id)
  const { idx, closures } = db()
  const q = priceQuote({
    rt, plan: planById(input.rate_plan_id), checkin: input.checkin, checkout: input.checkout, rooms: input.rooms,
    adults: input.adults, children: input.children,
    addons: input.addons.map(a => ({ addon: ADDONS.find(x => x.id === a.addon_id)!, qty: a.qty })).filter(a => a.addon),
    promos: promotions(), chosenPromoId: input.chosenPromoId, member: isMember(), today: TODAY, overrides: ov().rateOverrides,
  })
  return { ...q, left: availability(idx, rt, input.checkin, input.checkout, closures) }
}

function linkCustomer(g: Guest) {
  const found = customers().find(c => c.email.toLowerCase() === g.email.toLowerCase() || c.phone === g.phone)
  if (found) return found.id
  const c: Customer = { id: `C${String(customers().length + 1).padStart(3, '0')}`, name: g.name, phone: g.phone, email: g.email, nationality: g.nationality, birthday: '1990-01-01', tier: 'Member', points: 0, preferences: [], family: false, vouchers: [], created_at: TODAY }
  demoStore.update(o => ({ customersAdded: [...o.customersAdded, c] }))
  return c.id
}

function customerStats(id: string) {
  const list = db().bookings.filter(b => b.customer_id === id && b.status !== 'cancelled')
  const stays = list.filter(b => b.checkout_date <= TODAY || b.status === 'finished')
  return {
    bookings: list.length,
    roomNights: list.reduce((s, b) => s + b.booking_rooms.length * diffDays(b.checkin_date, b.checkout_date), 0),
    spend: list.reduce((s, b) => s + b.total, 0),
    lastStay: stays.map(b => b.checkout_date).sort().at(-1),
    boughtTour: list.some(b => b.addons.some(a => ADDONS.find(x => x.id === a.addon_id)?.category === 'tour')),
    usedTransfer: list.some(b => b.addons.some(a => a.addon_id === 'AD-TRF')),
    oceanView: list.filter(b => b.booking_rooms.some(r => rtById(r.room_type_id).ocean_view)).length,
    upcoming: list.filter(b => b.checkin_date > TODAY).length,
  }
}

function agentStatementSync(agent: Agent) {
  const list = db().bookings.filter(b => b.agent_id === agent.id)
  const active = list.filter(b => b.status !== 'cancelled')
  const credit = active.filter(b => b.payment_status === 'credit')
  const debtBookings = credit.filter(b => b.checkin_date <= TODAY)
  const debt = debtBookings.reduce((s, b) => s + b.total, 0) // đã phát sinh
  const exposure = credit.reduce((s, b) => s + b.total, 0) // gồm booking tương lai ghi nợ
  const payments = active.flatMap(b => b.payments.map(p => ({ ...p, booking: b.code }))).sort((a, b) => b.at.localeCompare(a.at))
  const months = new Map<string, { month: string; bookings: number; rn: number; revenue: number; publicRevenue: number }>()
  for (const b of active) {
    const m = b.checkin_date.slice(0, 7)
    const row = months.get(m) ?? { month: m, bookings: 0, rn: 0, revenue: 0, publicRevenue: 0 }
    row.bookings++; row.rn += b.booking_rooms.length * diffDays(b.checkin_date, b.checkout_date); row.revenue += b.total; row.publicRevenue += b.public_total ?? b.total
    months.set(m, row)
  }
  return {
    agent, bookings: list.sort((a, b) => b.created_at.localeCompare(a.created_at)).map(bookingView), debt, exposure, debtBookings: debtBookings.length, upcomingCredit: exposure - debt,
    payments, months: [...months.values()].sort((a, b) => a.month.localeCompare(b.month)).map(r => ({ ...r, commission: (r.revenue * agent.commission_pct) / 100, margin: r.publicRevenue - r.revenue })),
  }
}

function bookingView(b: Booking) {
  const hotel = hotelById(b.hotel_id)
  const rt = rtById(b.booking_rooms[0].room_type_id)
  const plan = planById(b.booking_rooms[0].rate_plan_id)
  const paid = b.payments.reduce((s, p) => s + p.amount, 0)
  const agent = b.agent_id ? agents().find(a => a.id === b.agent_id) : undefined
  return { ...b, hotel, rt, plan, paid, balance: Math.max(0, b.total - paid), nights: diffDays(b.checkin_date, b.checkout_date), agentName: agent?.name, promo: b.promo_id ? promotions().find(p => p.id === b.promo_id) : undefined }
}
export type BookingView = ReturnType<typeof bookingView>
export { inPeriod }

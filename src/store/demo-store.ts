// DemoStore: chỉ lưu PHẦN THAY ĐỔI trong phiên (booking mới, sửa trạng thái, giá, đóng bán…).
// Dữ liệu seed sinh lại mỗi lần tải nên "Reset" = xoá phần thay đổi.
// Lưu localStorage (bọc try/catch — có thể bị chặn ở chế độ riêng tư).
import type { Agent, AgentApplication, Article, Booking, Customer, Hotel, Lead, Promotion } from '@/lib/types'
import { TODAY, monthRange } from '@/lib/format'

export type Role = 'guest' | 'agent' | 'staff' | 'executive' | 'hotel_admin'

export interface Overlay {
  bookings: Booking[] // booking tạo trong phiên
  edited: Record<string, Booking> // booking đã sửa (theo code)
  rateOverrides: Record<string, number>
  closures: string[]
  promotions: Record<string, Promotion>
  applications: AgentApplication[]
  agentsAdded: Agent[]
  agentEdits: Record<string, Partial<Agent>>
  hotelEdits: Record<string, Partial<Hotel>>
  customersAdded: Customer[]
  articleEdits: Record<string, Partial<Article>>
  banner?: { headline: string; sub: string }
  leads: Lead[]
  compare: string[] // room_type_id, tối đa 3
  recent: string[] // hotel slug
  session: { role: Role; customerId?: string; agentId?: string; adminUserId: string; lang: 'vi' | 'en' }
  admin: { hotel: string; from: string; to: string; dark: boolean }
}

const KEY = 'rooty-demo-v1'
const sep = monthRange('2026-09')

export const emptyOverlay = (): Overlay => ({
  bookings: [], edited: {}, rateOverrides: {}, closures: [], promotions: {}, applications: [], agentsAdded: [], agentEdits: {},
  hotelEdits: {}, customersAdded: [], articleEdits: {}, leads: [], compare: [], recent: [],
  session: { role: 'guest', adminUserId: 'U01', lang: 'vi' },
  admin: { hotel: 'all', from: sep.from, to: sep.to, dark: false },
})

let overlay: Overlay = emptyOverlay()
let version = 0
const listeners = new Set<() => void>()

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(overlay)) } catch { /* bộ nhớ bị chặn: vẫn chạy trong phiên */ }
}
function emit() {
  version++
  listeners.forEach(l => l())
}

export const demoStore = {
  get: () => overlay,
  version: () => version,
  subscribe(fn: () => void) {
    listeners.add(fn)
    return () => { listeners.delete(fn) }
  },
  load() {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) overlay = { ...emptyOverlay(), ...JSON.parse(raw) }
    } catch { /* bỏ qua dữ liệu hỏng */ }
    emit()
  },
  update(fn: (o: Overlay) => Partial<Overlay>) {
    overlay = { ...overlay, ...fn(overlay) }
    save()
    emit()
  },
  /** Xoá mọi thay đổi dữ liệu, giữ vai trò đang xem. */
  reset() {
    overlay = { ...emptyOverlay(), session: overlay.session }
    save()
    emit()
  },
}

export function nowISO() {
  const t = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${TODAY}T${p(t.getHours())}:${p(t.getMinutes())}:${p(t.getSeconds())}`
}

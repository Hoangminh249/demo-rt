'use client'
import { repo } from '@/lib/repo'
import { can, type Access, type ModuleKey } from '@/lib/permissions'
import type { Period } from '@/lib/metrics'
import { useDemo } from '@/store/provider'

/** Người dùng admin hiện tại, phạm vi khách sạn, kỳ báo cáo. Quản lý KS bị khoá vào KS của mình. */
export function useAdmin() {
  const { overlay, update } = useDemo()
  const user = repo.users().find(u => u.id === overlay.session.adminUserId) ?? repo.users()[0]
  const locked = user.role === 'hotel_manager' ? user.hotel_id! : null
  const hotelId = locked ?? overlay.admin.hotel
  const period: Period = { from: overlay.admin.from, to: overlay.admin.to }
  return {
    user, hotelId, locked, period,
    hotels: repo.hotelsSync().filter(h => !locked || h.id === locked),
    dark: overlay.admin.dark,
    can: (m: ModuleKey, need: Access = 'view') => can(user.role, m, need),
    setHotel: (hotel: string) => update(o => ({ admin: { ...o.admin, hotel } })),
    setPeriod: (p: Period) => update(o => ({ admin: { ...o.admin, ...p } })),
    toggleDark: () => update(o => ({ admin: { ...o.admin, dark: !o.admin.dark } })),
    setUser: (id: string) => update(o => ({ session: { ...o.session, adminUserId: id } })),
  }
}

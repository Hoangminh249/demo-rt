import type { AdminRole } from './types'

export const ADMIN_MODULES = [
  { key: 'dashboard', label: 'Dashboard', href: '/admin' },
  { key: 'hotels', label: 'Hotels', href: '/admin/hotels' },
  { key: 'rooms', label: 'Rooms', href: '/admin/rooms' },
  { key: 'rates', label: 'Rates', href: '/admin/rates' },
  { key: 'inventory', label: 'Inventory', href: '/admin/inventory' },
  { key: 'bookings', label: 'Bookings', href: '/admin/bookings' },
  { key: 'customers', label: 'Customers / CRM', href: '/admin/customers' },
  { key: 'agents', label: 'Agents / B2B', href: '/admin/agents' },
  { key: 'promotions', label: 'Promotions', href: '/admin/promotions' },
  { key: 'payments', label: 'Payments', href: '/admin/payments' },
  { key: 'reports', label: 'Reports', href: '/admin/reports' },
  { key: 'content', label: 'Content', href: '/admin/content' },
  { key: 'users', label: 'Users & Permissions', href: '/admin/users' },
] as const
export type ModuleKey = (typeof ADMIN_MODULES)[number]['key']

export type Access = 'full' | 'view' | 'none'
const F = 'full', V = 'view', N = 'none'

// Ma trận vai trò × quyền
export const PERMISSIONS: Record<AdminRole, Record<ModuleKey, Access>> = {
  executive: { dashboard: F, hotels: V, rooms: V, rates: V, inventory: V, bookings: V, customers: V, agents: F, promotions: V, payments: V, reports: F, content: V, users: V },
  hotel_manager: { dashboard: F, hotels: F, rooms: F, rates: F, inventory: F, bookings: F, customers: V, agents: N, promotions: F, payments: V, reports: F, content: F, users: N },
  sales: { dashboard: N, hotels: V, rooms: V, rates: V, inventory: V, bookings: F, customers: F, agents: V, promotions: V, payments: N, reports: N, content: N, users: N },
  accountant: { dashboard: V, hotels: N, rooms: N, rates: N, inventory: N, bookings: V, customers: N, agents: V, promotions: N, payments: F, reports: F, content: N, users: N },
  sysadmin: { dashboard: F, hotels: F, rooms: F, rates: F, inventory: F, bookings: F, customers: F, agents: F, promotions: F, payments: F, reports: F, content: F, users: F },
}

export const ROLE_LABEL: Record<AdminRole, string> = {
  executive: 'Lãnh đạo', hotel_manager: 'Quản lý khách sạn', sales: 'Lễ tân / Sales', accountant: 'Kế toán', sysadmin: 'Quản trị hệ thống',
}

export const can = (role: AdminRole, module: ModuleKey, need: Access = 'view') => {
  const a = PERMISSIONS[role][module]
  return need === 'view' ? a !== 'none' : a === 'full'
}

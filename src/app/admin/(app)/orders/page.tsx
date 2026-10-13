// Booking đặt trên web (Postgres) — ADMIN và STAFF.
import { Suspense } from 'react'
import { OrdersView } from '@/components/admin/views/orders'
import { requireAdmin } from '@/lib/admin-actor'

export const metadata = { title: 'Đặt phòng web' }

export default async function AdminOrdersPage() {
  await requireAdmin(['ADMIN', 'STAFF'])
  return <Suspense><OrdersView /></Suspense>
}

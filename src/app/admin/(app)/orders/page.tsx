// Booking đặt trên web (Postgres) — ADMIN và STAFF. Chỉ khi DATA_SOURCE=db.
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { OrdersView } from '@/components/admin/views/orders'
import { requireAdmin } from '@/lib/admin-actor'
import { isDbSource } from '@/lib/db'

export const metadata = { title: 'Đặt phòng web' }

export default async function AdminOrdersPage() {
  await requireAdmin(['ADMIN', 'STAFF'])
  if (!isDbSource()) notFound()
  return <Suspense><OrdersView /></Suspense>
}

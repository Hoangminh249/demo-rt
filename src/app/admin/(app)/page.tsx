import { OverviewView } from '@/components/admin/views/overview'
import { requireAdmin } from '@/lib/admin-actor'

export const metadata = { title: 'Tổng quan' }

export default async function AdminOverviewPage() {
  await requireAdmin() // STAFF → trang booking
  return <OverviewView />
}

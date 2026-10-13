// Tiện ích — chỉ ADMIN.
import { AmenitiesView } from '@/components/admin/views/catalog-pages'
import { requireAdmin } from '@/lib/admin-actor'

export const metadata = { title: 'Tiện ích' }

export default async function Page() {
  await requireAdmin()
  return <AmenitiesView />
}

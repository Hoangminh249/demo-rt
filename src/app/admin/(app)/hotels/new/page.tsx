// Thêm khách sạn — chỉ ADMIN.
import { NewHotelView } from '@/components/admin/views/catalog-pages'
import { requireAdmin } from '@/lib/admin-actor'

export const metadata = { title: 'Thêm khách sạn' }

export default async function Page() {
  await requireAdmin()
  return <NewHotelView />
}

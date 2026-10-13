// Khuyến mãi — chỉ ADMIN.
import { PromotionsView } from '@/components/admin/views/catalog-pages'
import { requireAdmin } from '@/lib/admin-actor'

export const metadata = { title: 'Khuyến mãi' }

export default async function Page() {
  await requireAdmin()
  return <PromotionsView />
}

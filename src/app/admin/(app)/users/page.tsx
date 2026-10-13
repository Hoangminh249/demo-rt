// Người dùng — chỉ ADMIN.
import { UsersView } from '@/components/admin/views/catalog-pages'
import { requireAdmin } from '@/lib/admin-actor'

export const metadata = { title: 'Người dùng' }

export default async function Page() {
  await requireAdmin()
  return <UsersView />
}

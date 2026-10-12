// Người dùng — chỉ ADMIN, chỉ khi DATA_SOURCE=db (Postgres).
import { notFound } from 'next/navigation'
import { UsersView } from '@/components/admin/views/catalog-pages'
import { requireAdmin } from '@/lib/admin-actor'
import { isDbSource } from '@/lib/db'

export const metadata = { title: 'Người dùng' }

export default async function Page() {
  await requireAdmin()
  if (!isDbSource()) notFound()
  return <UsersView />
}

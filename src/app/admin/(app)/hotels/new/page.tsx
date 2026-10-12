// Thêm khách sạn — chỉ ADMIN, chỉ khi DATA_SOURCE=db (Postgres).
import { notFound } from 'next/navigation'
import { NewHotelView } from '@/components/admin/views/catalog-pages'
import { requireAdmin } from '@/lib/admin-actor'
import { isDbSource } from '@/lib/db'

export const metadata = { title: 'Thêm khách sạn' }

export default async function Page() {
  await requireAdmin()
  if (!isDbSource()) notFound()
  return <NewHotelView />
}

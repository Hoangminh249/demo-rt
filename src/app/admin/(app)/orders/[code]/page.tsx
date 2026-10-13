// Chi tiết booking web — ADMIN mọi thao tác, STAFF chỉ nhận / trả phòng.
import { OrderView } from '@/components/admin/views/orders'
import { requireAdmin } from '@/lib/admin-actor'

export async function generateMetadata({ params }: PageProps<'/admin/orders/[code]'>) {
  return { title: (await params).code }
}

export default async function AdminOrderPage({ params }: PageProps<'/admin/orders/[code]'>) {
  const actor = await requireAdmin(['ADMIN', 'STAFF'])
  return <OrderView code={(await params).code} staff={actor.role !== 'ADMIN'} />
}

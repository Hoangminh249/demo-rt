'use client'
import { use } from 'react'
import { FileDown } from 'lucide-react'
import { repo } from '@/lib/repo'
import { useAsync, useDemo } from '@/store/provider'
import { BookingSummary } from '@/components/site/booking-detail'
import { Breadcrumb, ButtonLink, Empty, SkeletonList } from '@/components/ui'

export default function AgentBookingDetail({ params }: PageProps<'/agent/booking/[code]'>) {
  const { code } = use(params)
  const { overlay } = useDemo()
  const b = useAsync(() => repo.getBooking(code), [code])
  if (b.loading && !b.data) return <SkeletonList />
  if (!b.data || b.data.agent_id !== overlay.session.agentId) return <Empty title="Không tìm thấy booking của đại lý này" />
  return (
    <div className="mx-auto max-w-3xl">
      <Breadcrumb items={[{ label: 'Booking của tôi', href: '/agent/booking' }, { label: code }]} />
      <BookingSummary b={b.data} />
      {b.data.guests_list && b.data.guests_list.length > 0 && <p className="mt-3 text-sm text-muted">Danh sách khách: {b.data.guests_list.join(', ')}</p>}
      <ButtonLink href={`/voucher/${code}`} target="_blank" className="mt-4"><FileDown className="size-4" /> Tải voucher</ButtonLink>
    </div>
  )
}

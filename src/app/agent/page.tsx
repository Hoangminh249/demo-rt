'use client'
import { Search, Wallet, CalendarCheck2 } from 'lucide-react'
import { repo } from '@/lib/repo'
import { useAsync, useDemo } from '@/store/provider'
import { fmtVND, fmtPct, TODAY } from '@/lib/format'
import { ButtonLink, PageTitle, SkeletonList, Stat } from '@/components/ui'

export default function AgentHome() {
  const { overlay } = useDemo()
  const st = useAsync(() => repo.getAgent(overlay.session.agentId!), [overlay.session.agentId])
  if (!st.data) return <SkeletonList />
  const { agent, debt, exposure, bookings } = st.data
  const upcoming = bookings.filter(b => b.checkin_date >= TODAY && b.status !== 'cancelled').length
  return (
    <>
      <PageTitle title={`Xin chào, ${agent.name}`} sub={`Người liên hệ: ${agent.contact} · MST ${agent.tax_code}`}>
        <ButtonLink href="/agent/tim-phong"><Search className="size-4" /> Tìm phòng</ButtonLink>
      </PageTitle>
      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Công nợ đã phát sinh" value={fmtVND(debt)} sub={`Hạn mức ${fmtVND(agent.credit_limit)} · đã dùng ${fmtPct(exposure / agent.credit_limit, 0)} (gồm booking tương lai)`} tone={exposure / agent.credit_limit > 0.8 ? 'down' : undefined} />
        <Stat label="Booking sắp tới" value={upcoming} />
        <Stat label="Tổng booking" value={bookings.length} />
        <Stat label="Chiết khấu net" value={`${Math.round(agent.discount * 100)}%`} sub={`Hoa hồng doanh số ${agent.commission_pct}%`} />
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        <ButtonLink variant="secondary" href="/agent/booking"><CalendarCheck2 className="size-4" /> Booking của tôi</ButtonLink>
        <ButtonLink variant="secondary" href="/agent/cong-no"><Wallet className="size-4" /> Công nợ</ButtonLink>
      </div>
    </>
  )
}

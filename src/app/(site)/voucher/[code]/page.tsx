'use client'
import { use } from 'react'
import { Printer } from 'lucide-react'
import { repo } from '@/lib/repo'
import { useAsync } from '@/store/provider'
import { fmtDate, fmtRange, guestsLabel, TODAY } from '@/lib/format'
import { Button, Empty, SkeletonList } from '@/components/ui'

// Voucher in được (Ctrl+P → Lưu PDF).
export default function VoucherPage({ params }: PageProps<'/voucher/[code]'>) {
  const { code } = use(params)
  const b = useAsync(() => repo.getBooking(code), [code])
  if (!b.data) return <div className="mx-auto max-w-2xl px-4 py-10">{b.loading ? <SkeletonList /> : <Empty title="Không tìm thấy voucher" />}</div>
  const v = b.data
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="no-print mb-4 flex justify-end"><Button onClick={() => window.print()}><Printer className="size-4" /> In / Lưu PDF</Button></div>
      <article className="rounded-2xl border-2 border-brand bg-white p-8 text-[#1f2a2a]">
        <header className="flex items-start justify-between border-b border-[#d8e4e1] pb-4">
          <div><p className="text-2xl font-bold text-[#144a40]">Rooty <span className="font-medium text-[#2a9683]">Hospitality</span></p><p className="text-xs">HOTEL VOUCHER · {v.agentName ? `Đại lý: ${v.agentName}` : 'Đặt trực tiếp'}</p></div>
          <div className="text-right"><p className="text-xs">Mã booking</p><p className="font-mono text-xl font-bold">{v.code}</p></div>
        </header>
        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div><dt className="text-xs text-[#566664]">Khách sạn</dt><dd className="font-semibold">{v.hotel.name}</dd><dd className="text-xs">{v.hotel.address}</dd></div>
          <div><dt className="text-xs text-[#566664]">Khách chính</dt><dd className="font-semibold">{v.guest.name}</dd><dd className="text-xs">{v.guest.phone}</dd></div>
          <div><dt className="text-xs text-[#566664]">Nhận – trả phòng</dt><dd className="font-semibold">{fmtRange(v.checkin_date, v.checkout_date)} · {v.nights} đêm</dd><dd className="text-xs">{v.hotel.policies.checkin} · {v.hotel.policies.checkout}</dd></div>
          <div><dt className="text-xs text-[#566664]">Phòng</dt><dd className="font-semibold">{v.booking_rooms.length} × {v.rt.name}</dd><dd className="text-xs">{v.plan.has_breakfast ? 'Bao gồm ăn sáng' : 'Không gồm ăn sáng'} · {guestsLabel(v.adults, v.children)}</dd></div>
          {v.addons.length > 0 && <div className="col-span-2"><dt className="text-xs text-[#566664]">Dịch vụ kèm theo</dt><dd>{v.addons.map(a => `${a.name} × ${a.qty}`).join(' · ')}</dd></div>}
          {v.guests_list && v.guests_list.length > 0 && <div className="col-span-2"><dt className="text-xs text-[#566664]">Danh sách khách</dt><dd>{v.guests_list.join(', ')}</dd></div>}
        </dl>
        <footer className="mt-6 border-t border-[#d8e4e1] pt-4 text-xs text-[#566664]">
          Xuất trình voucher khi nhận phòng. Liên hệ: {v.hotel.phone} · {v.hotel.email}. In ngày {fmtDate(TODAY)}. Bản demo — không có giá trị sử dụng.
        </footer>
      </article>
    </div>
  )
}

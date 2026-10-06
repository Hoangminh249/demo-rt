'use client'
import type { BookingView } from '@/lib/repo'
import { addDays, fmtDate, fmtDateTime, fmtRange, fmtVND, guestsLabel, TODAY, diffDays } from '@/lib/format'
import { CHANNEL, METHOD, PAYMENT, STATUS } from '@/lib/labels'
import { Badge } from '../ui'

export function BookingSummary({ b, showPrices = true }: { b: BookingView; showPrices?: boolean }) {
  const perNight = b.booking_rooms[0].days_breakdown
  const items: [string, string][] = [
    ['Khách sạn', b.hotel.name],
    ['Phòng', `${b.booking_rooms.length} × ${b.rt.name} · ${b.plan.has_breakfast ? 'có ăn sáng' : 'chỉ phòng'}`],
    ['Nhận – trả phòng', `${fmtRange(b.checkin_date, b.checkout_date)} · ${b.nights} đêm`],
    ['Số khách', guestsLabel(b.adults, b.children)],
    ['Khách chính', `${b.guest.name} · ${b.guest.phone}`],
    ['Email', b.guest.email],
    ['Nguồn', `${CHANNEL[b.channel][0]} · ${b.source_name}`],
    ['Chính sách huỷ', b.plan.free_cancel_days ? `Huỷ miễn phí trước ${fmtDate(addDays(b.checkin_date, -b.plan.free_cancel_days))}` : 'Không hoàn huỷ'],
    ...(b.arrival_hour ? [['Giờ đến', b.arrival_hour] as [string, string]] : []),
    ...(b.notes ? [['Yêu cầu', b.notes] as [string, string]] : []),
    ...(b.invoice ? [['Hoá đơn', `${b.invoice.company} · MST ${b.invoice.tax_code}`] as [string, string]] : []),
  ]
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-4 sm:px-5">
        <p className="mr-auto text-sm text-muted-foreground">Mã booking <span className="ml-1 font-mono text-base font-semibold text-foreground">{b.code}</span></p>
        <Badge tone={STATUS[b.status][1]}>{STATUS[b.status][0]}</Badge>
        <Badge tone={PAYMENT[b.payment_status][1]}>{PAYMENT[b.payment_status][0]}</Badge>
      </div>
      <dl className="grid gap-x-6 gap-y-4 px-4 py-4 text-sm sm:grid-cols-2 sm:px-5">
        {items.map(([k, v]) => <div key={k} className="min-w-0"><dt className="text-muted-foreground">{k}</dt><dd className="mt-0.5 font-medium break-words">{v}</dd></div>)}
      </dl>
      {showPrices && (
        <div className="space-y-2 border-t border-border px-4 py-4 text-sm sm:px-5">
          {perNight.map(d => <Line key={d.day} k={`Đêm ${fmtDate(d.day)}${b.booking_rooms.length > 1 ? ` × ${b.booking_rooms.length} phòng` : ''}`} v={fmtVND(d.price * b.booking_rooms.length)} />)}
          {b.discount > 0 && <Line k={`Giảm giá${b.promo ? ` · ${b.promo.name.split('–')[0].trim()}` : ''}`} v={`−${fmtVND(b.discount)}`} ok />}
          {b.addons.map(a => <Line key={a.addon_id} k={`${a.name} × ${a.qty}`} v={fmtVND(a.total)} />)}
          <div className="flex items-baseline justify-between border-t border-border pt-3"><span className="font-semibold">Tổng cộng</span><span className="text-lg font-semibold tabular-nums">{fmtVND(b.total)}</span></div>
          <Line k="Đã thanh toán" v={fmtVND(b.paid)} />
          {b.balance > 0 && <Line k="Còn lại" v={fmtVND(b.balance)} />}
          {b.payments.map(p => <p key={p.id} className="text-xs text-muted-foreground">{fmtDateTime(p.at)} · {METHOD[p.method]} · {fmtVND(p.amount)}{p.note ? ` · ${p.note}` : ''}</p>)}
        </div>
      )}
    </div>
  )
}

export const canFreeCancel = (b: BookingView) => !!b.plan.free_cancel_days && diffDays(TODAY, b.checkin_date) >= b.plan.free_cancel_days

function Line({ k, v, ok }: { k: string; v: string; ok?: boolean }) {
  return <div className={`flex justify-between gap-3 ${ok ? 'text-ok' : 'text-muted-foreground'}`}><span>{k}</span><span className="shrink-0 tabular-nums text-foreground">{v}</span></div>
}

/** File .ics để thêm vào lịch. */
export function downloadIcs(b: BookingView) {
  const d = (iso: string) => iso.replace(/-/g, '')
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Rooty Hospitality//Demo//VI', 'BEGIN:VEVENT', `UID:${b.code}@rootyhospitality.com`,
    `DTSTART;VALUE=DATE:${d(b.checkin_date)}`, `DTEND;VALUE=DATE:${d(b.checkout_date)}`, `SUMMARY:${b.hotel.name} – ${b.rt.name} (${b.code})`,
    `LOCATION:${b.hotel.address}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n')
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: `${b.code}.ics` })
  a.click()
  URL.revokeObjectURL(url)
}

'use client'
import type { BookingView } from '@/lib/repo'
import { addDays, fmtDate, fmtDateTime, fmtRange, fmtVND, guestsLabel, TODAY, diffDays } from '@/lib/format'
import { CHANNEL, METHOD, PAYMENT, STATUS } from '@/lib/labels'
import { Badge, Card } from '../ui'

export function BookingSummary({ b, showPrices = true }: { b: BookingView; showPrices?: boolean }) {
  const perNight = b.booking_rooms[0].days_breakdown
  return (
    <Card className="divide-y divide-border">
      <div className="flex flex-wrap items-center gap-2 p-4">
        <p className="mr-auto text-lg font-bold">Mã booking <span className="font-mono text-primary">{b.code}</span></p>
        <Badge tone={STATUS[b.status][1]}>{STATUS[b.status][0]}</Badge>
        <Badge tone={PAYMENT[b.payment_status][1]}>{PAYMENT[b.payment_status][0]}</Badge>
      </div>
      <dl className="grid gap-x-6 gap-y-3 p-4 text-sm sm:grid-cols-2">
        <Item k="Khách sạn" v={b.hotel.name} />
        <Item k="Phòng" v={`${b.rt.name} × ${b.booking_rooms.length} · ${b.plan.has_breakfast ? 'Breakfast Included' : 'Room Only'}`} />
        <Item k="Nhận – trả phòng" v={`${fmtRange(b.checkin_date, b.checkout_date)} · ${b.nights} đêm`} />
        <Item k="Số khách" v={guestsLabel(b.adults, b.children)} />
        <Item k="Khách" v={`${b.guest.name} · ${b.guest.phone}`} />
        <Item k="Email" v={b.guest.email} />
        <Item k="Nguồn" v={`${CHANNEL[b.channel][0]} · ${b.source_name}`} />
        <Item k="Chính sách huỷ" v={b.plan.free_cancel_days ? `Huỷ miễn phí trước ${fmtDate(addDays(b.checkin_date, -b.plan.free_cancel_days))}` : 'Không hoàn huỷ'} />
        {b.arrival_hour && <Item k="Giờ đến" v={b.arrival_hour} />}
        {b.notes && <Item k="Yêu cầu" v={b.notes} />}
        {b.invoice && <Item k="Hoá đơn" v={`${b.invoice.company} · MST ${b.invoice.tax_code}`} />}
      </dl>
      {showPrices && (
        <div className="space-y-1 p-4 text-sm">
          {perNight.map(d => <Line key={d.day} k={`Đêm ${fmtDate(d.day)}${b.booking_rooms.length > 1 ? ` × ${b.booking_rooms.length} phòng` : ''}`} v={fmtVND(d.price * b.booking_rooms.length)} />)}
          {b.discount > 0 && <Line k={`Giảm giá${b.promo ? ` · ${b.promo.name.split('–')[0].trim()}` : ''}`} v={`−${fmtVND(b.discount)}`} ok />}
          {b.addons.map(a => <Line key={a.addon_id} k={`${a.name} × ${a.qty}`} v={fmtVND(a.total)} />)}
          <div className="flex justify-between border-t border-border pt-2 text-base font-bold"><span>Tổng cộng</span><span>{fmtVND(b.total)}</span></div>
          <Line k="Đã thanh toán" v={fmtVND(b.paid)} />
          {b.balance > 0 && <Line k="Còn lại" v={fmtVND(b.balance)} />}
          {b.payments.map(p => <p key={p.id} className="text-xs text-muted">{fmtDateTime(p.at)} · {METHOD[p.method]} · {fmtVND(p.amount)}{p.note ? ` · ${p.note}` : ''}</p>)}
        </div>
      )}
    </Card>
  )
}


export const canFreeCancel = (b: BookingView) => !!b.plan.free_cancel_days && diffDays(TODAY, b.checkin_date) >= b.plan.free_cancel_days

function Item({ k, v }: { k: string; v: string }) {
  return <div><dt className="text-xs text-muted">{k}</dt><dd className="font-medium">{v}</dd></div>
}
function Line({ k, v, ok }: { k: string; v: string; ok?: boolean }) {
  return <div className={`flex justify-between gap-2 ${ok ? 'text-ok' : 'text-muted'}`}><span>{k}</span><span className="text-fg">{v}</span></div>
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

// Email báo khách sạn có booking mới (Hotel.notifyEmail). Ngắn: đủ để lễ tân chuẩn bị phòng và đối chiếu tiền.
import { Body, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'
import type { EmailBooking } from '@/lib/email'

const vnd = (n: number) => `${new Intl.NumberFormat('vi-VN').format(n)} đ`
const dmy = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`

export function NewBookingNotice({ b }: { b: EmailBooking }) {
  const rows: [string, string][] = [
    ['Mã', b.code],
    ['Ngày', `${dmy(b.checkIn)} → ${dmy(b.checkOut)} (${b.nights.length} đêm)`],
    ['Phòng', `${b.rooms} × ${b.roomName} · ${b.planName}`],
    ['Khách', `${b.adults} NL${b.children ? ` + ${b.children} TE` : ''}`],
    ['Người đặt', `${b.contactName} · ${b.contactPhone} · ${b.contactEmail}`],
    ...(b.guestName ? [['Nhận phòng', b.guestName] as [string, string]] : []),
    ...(b.specialRequests ? [['Yêu cầu', b.specialRequests] as [string, string]] : []),
    ['Tổng', vnd(b.total)],
    ['Đã trả online', vnd(b.paid)],
    ['Thu tại quầy', `${vnd(b.balanceDue)}${b.balanceDueAt ? ` (hạn ${dmy(b.balanceDueAt)})` : ''}`],
  ]
  return (
    <Html lang="vi">
      <Head />
      <Preview>{`Booking mới ${b.code} · ${dmy(b.checkIn)} · ${b.roomName}`}</Preview>
      <Body style={{ backgroundColor: '#f4f6f5', fontFamily: 'Arial, sans-serif', color: '#0b2b26' }}>
        <Container style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 24, margin: '24px auto', maxWidth: 560 }}>
          <Heading style={{ fontSize: 20, margin: '0 0 12px' }}>Booking mới — {b.hotelName}</Heading>
          {rows.map(([k, v]) => <Text key={k} style={{ fontSize: 14, margin: '4px 0' }}><b>{k}:</b> {v}</Text>)}
        </Container>
      </Body>
    </Html>
  )
}

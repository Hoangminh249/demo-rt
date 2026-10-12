// Email khi khách huỷ trên web. `team`: bản báo team khách sạn (mở phòng lại trên Gohost, hoàn tiền trong admin);
// không thì bản xác nhận cho khách (phí huỷ, số tiền sẽ hoàn).
import { Body, Button, Container, Head, Html, Preview, Section, Text } from '@react-email/components'
import type { EmailBooking } from '@/lib/email'
import { dmy, Facts, NightTable, S, vnd } from './new-booking-notice'

export function BookingCancelled({ b, team }: { b: EmailBooking; team: boolean }) {
  const c = b.cancel ?? { penalty: 0, refund: 0 }
  const rows: [string, string][] = [
    ['Phòng', `${b.rooms} × ${b.roomName} · ${b.planName}`],
    ['Ngày', `${dmy(b.checkIn)} → ${dmy(b.checkOut)} · ${b.nights.length} đêm`],
    ...(team ? [['Người đặt', `${b.contactName} · ${b.contactPhone} · ${b.contactEmail}`] as [string, string]] : []),
    ['Đã thanh toán', vnd(b.paid)],
    ['Phí huỷ', vnd(c.penalty)],
    ['Hoàn lại', vnd(c.refund)],
  ]
  return (
    <Html lang="vi">
      <Head />
      <Preview>{`${team ? 'Khách huỷ' : 'Đã huỷ'} ${b.code} · ${dmy(b.checkIn)} → ${dmy(b.checkOut)}`}</Preview>
      <Body style={S.body}>
        <Container style={S.box}>
          <Section style={{ ...S.head, backgroundColor: '#24302d' }}>
            <Text style={S.eyebrow}>{team ? 'Khách huỷ đặt phòng' : 'Đã huỷ đặt phòng'}</Text>
            <Text style={S.code}>{b.code}</Text>
            <Text style={S.sub}>{b.hotelName}</Text>
          </Section>
          <Section style={S.inner}>
            {team
              ? <Text style={S.todo}>Việc cần làm: <b>mở lại {b.rooms} phòng {b.roomName} trên Gohost</b> cho các đêm trên.{c.refund > 0 ? <> Hoàn <b>{vnd(c.refund)}</b> cho khách rồi bấm “Đã hoàn” trong admin.</> : null}</Text>
              : <Text style={{ fontSize: 15, lineHeight: '22px', margin: '0 0 16px' }}>Đặt phòng của quý khách đã được huỷ theo chính sách lúc đặt.{c.refund > 0 ? ` Khoản hoàn ${vnd(c.refund)} sẽ được khách sạn chuyển lại và báo khi hoàn tất.` : ''}</Text>}
            <Facts rows={rows} />
            <NightTable b={b} totalLabel="Tổng đơn" />
            <Text style={{ ...S.foot, marginTop: 0 }}>Chính sách huỷ: {b.cancellation}</Text>
            <Button href={team ? b.adminUrl : b.orderUrl} style={{ ...S.btn, display: 'inline-block', marginTop: 12 }}>{team ? 'Mở đơn trong admin' : 'Xem đơn'}</Button>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

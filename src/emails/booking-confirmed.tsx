// Email xác nhận đặt phòng gửi khách (tiếng Việt). Dữ liệu: EmailBooking (src/lib/email.ts) — lấy từ ảnh chụp lúc đặt.
import { Body, Container, Head, Heading, Hr, Html, Preview, Section, Text } from '@react-email/components'
import type { EmailBooking } from '@/lib/email'

const vnd = (n: number) => `${new Intl.NumberFormat('vi-VN').format(n)} đ`
const dmy = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`

const S = {
  body: { backgroundColor: '#f4f6f5', fontFamily: 'Arial, sans-serif', color: '#0b2b26' },
  box: { backgroundColor: '#ffffff', borderRadius: 12, padding: 28, margin: '24px auto', maxWidth: 560 },
  h1: { fontSize: 22, margin: '0 0 4px' },
  muted: { color: '#5b6b67', fontSize: 14, margin: 0 },
  label: { color: '#5b6b67', fontSize: 13, margin: '12px 0 2px' },
  value: { fontSize: 15, margin: 0, fontWeight: 600 },
  row: { display: 'flex', justifyContent: 'space-between', fontSize: 14, margin: '4px 0' },
  total: { display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700, margin: '8px 0 0' },
}

function Line({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  // dấu ": " ẩn ở bản HTML (flex dàn hai đầu) nhưng giữ cho bản chữ thuần khỏi dính "10/11/20262.720.000 đ"
  return <Text style={strong ? S.total : S.row}><span>{k}</span><span style={{ fontSize: 0 }}>: </span><span>{v}</span></Text>
}

export function BookingConfirmed({ b }: { b: EmailBooking }) {
  return (
    <Html lang="vi">
      <Head />
      <Preview>{`Xác nhận đặt phòng ${b.code} · ${b.hotelName} · ${dmy(b.checkIn)}`}</Preview>
      <Body style={S.body}>
        <Container style={S.box}>
          <Heading style={S.h1}>Đặt phòng đã được xác nhận</Heading>
          <Text style={S.muted}>Cảm ơn {b.contactName}. Mã đặt phòng của quý khách:</Text>
          <Text style={{ fontSize: 24, fontWeight: 700, letterSpacing: 1, margin: '8px 0 0' }}>{b.code}</Text>

          <Hr />
          <Text style={S.label}>Khách sạn</Text><Text style={S.value}>{b.hotelName}</Text>
          <Text style={S.label}>Nhận phòng</Text><Text style={S.value}>{dmy(b.checkIn)} · từ {b.checkInTime}</Text>
          <Text style={S.label}>Trả phòng</Text><Text style={S.value}>{dmy(b.checkOut)} · trước {b.checkOutTime}</Text>
          <Text style={S.label}>Phòng</Text><Text style={S.value}>{b.rooms} × {b.roomName} · {b.planName}</Text>
          <Text style={S.label}>Số khách</Text><Text style={S.value}>{b.adults} người lớn{b.children ? ` · ${b.children} trẻ em` : ''}</Text>
          {b.guestName && <><Text style={S.label}>Người nhận phòng</Text><Text style={S.value}>{b.guestName}</Text></>}
          {b.specialRequests && <><Text style={S.label}>Yêu cầu</Text><Text style={{ ...S.value, fontWeight: 400 }}>{b.specialRequests}</Text></>}

          <Hr />
          <Section>
            <Text style={{ ...S.label, marginTop: 0 }}>Giá từng đêm</Text>
            {b.nights.map(n => <Line key={n.date} k={dmy(n.date)} v={vnd(n.total)} />)}
            {b.discount > 0 && <Line k={`Khuyến mãi${b.promoCode ? ` (${b.promoCode})` : ''}`} v={`−${vnd(b.discount)}`} />}
            {b.taxFees > 0 && <Line k="Thuế, phí" v={vnd(b.taxFees)} />}
            <Line k="Tổng cộng" v={vnd(b.total)} strong />
            <Line k="Đã thanh toán" v={vnd(b.paid)} />
            <Line k={b.balanceDueAt ? `Còn lại · hạn ${dmy(b.balanceDueAt)}` : 'Còn lại · trả tại quầy khi nhận phòng'} v={vnd(b.balanceDue)} strong />
          </Section>

          <Hr />
          <Text style={S.label}>Chính sách huỷ</Text>
          <Text style={{ fontSize: 14, margin: 0 }}>{b.cancellation}</Text>

          <Hr />
          <Text style={S.label}>Liên hệ khách sạn</Text>
          <Text style={{ fontSize: 14, margin: 0 }}>{[b.hotelPhone, b.hotelEmail].filter(Boolean).join(' · ') || 'Xem trên rootyhospitality.com'}</Text>
          <Text style={{ ...S.muted, marginTop: 16, fontSize: 12 }}>Email gửi tự động từ rootyhospitality.com. Vui lòng mang mã đặt phòng khi nhận phòng.</Text>
        </Container>
      </Body>
    </Html>
  )
}

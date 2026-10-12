// Email báo team khách sạn có booking mới (Hotel.notifyEmail). Đủ để lễ tân chuẩn bị phòng, đối chiếu tiền và
// đóng phòng tương ứng trên Gohost (web và OTA chia phòng bằng tay). Reply-To = email khách.
import { Body, Button, Container, Head, Html, Preview, Section, Text } from '@react-email/components'
import type { EmailBooking } from '@/lib/email'

export const vnd = (n: number) => `${new Intl.NumberFormat('vi-VN').format(n)} ₫`
export const dmy = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`
const WD = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
export const wd = (iso: string) => WD[new Date(`${iso}T00:00:00Z`).getUTCDay()]
const WD_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
export const night = (iso: string) => `${WD_SHORT[new Date(`${iso}T00:00:00Z`).getUTCDay()]}, ${iso.slice(8, 10)}/${iso.slice(5, 7)}`
export const METHOD = { bank: 'Chuyển khoản ngân hàng', onepay: 'OnePay' } as const

export const S = {
  body: { backgroundColor: '#eef2f1', fontFamily: 'Arial, sans-serif', color: '#24302d', margin: 0 },
  box: { backgroundColor: '#ffffff', borderRadius: 16, overflow: 'hidden' as const, margin: '24px auto', maxWidth: 600, border: '1px solid #dfe6e4' },
  head: { backgroundColor: '#065749', color: '#ffffff', padding: '22px 28px' },
  eyebrow: { margin: 0, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase' as const, color: '#f8d09c', fontWeight: 700 },
  code: { margin: '8px 0 0', fontSize: 26, fontWeight: 700, color: '#ffffff' },
  sub: { margin: '4px 0 0', fontSize: 14, color: '#d6ebe6' },
  inner: { padding: '24px 28px' },
  todo: { borderRadius: 12, backgroundColor: '#fff7ed', border: '1px solid #fed7aa', padding: '12px 14px', fontSize: 14, lineHeight: '21px', color: '#7c2d12', margin: '0 0 18px' },
  k: { padding: '7px 0', color: '#5b6866', width: 150, fontSize: 14, verticalAlign: 'top' as const },
  v: { padding: '7px 0', fontWeight: 600, fontSize: 14 },
  prices: { border: '1px solid #e3ecea', borderRadius: 12, margin: '18px 0', width: '100%', borderCollapse: 'separate' as const, borderSpacing: 0 },
  pk: { padding: '10px 14px', fontSize: 14, borderTop: '1px solid #e3ecea' },
  pv: { padding: '10px 14px', fontSize: 14, borderTop: '1px solid #e3ecea', textAlign: 'right' as const },
  btn: { backgroundColor: '#23806f', color: '#ffffff', borderRadius: 10, padding: '13px 22px', fontSize: 15, fontWeight: 700, textDecoration: 'none' },
  foot: { margin: '18px 0 0', fontSize: 12, lineHeight: '18px', color: '#5b6866' },
}

/** Bảng thông tin (2 cột) dùng chung cho email team. */
export function Facts({ rows }: { rows: [string, string][] }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <tbody>{rows.map(([k, v]) => <tr key={k}><td style={S.k}>{k}</td><td style={S.v}>{v}</td></tr>)}</tbody>
    </table>
  )
}

/** Giá từng đêm + dòng tổng. */
export function NightTable({ b, totalLabel }: { b: EmailBooking; totalLabel: string }) {
  return (
    <table style={S.prices}>
      <tbody>
        {b.nights.map((n, i) => <tr key={n.date}><td style={{ ...S.pk, borderTop: i ? S.pk.borderTop : 0 }}>{night(n.date)}</td><td style={{ ...S.pv, borderTop: i ? S.pv.borderTop : 0 }}>{vnd(n.total)}</td></tr>)}
        {b.discount > 0 && <tr><td style={S.pk}>Khuyến mãi{b.promoCode ? ` (${b.promoCode})` : ''}</td><td style={S.pv}>−{vnd(b.discount)}</td></tr>}
        {b.taxFees > 0 && <tr><td style={S.pk}>Thuế, phí</td><td style={S.pv}>{vnd(b.taxFees)}</td></tr>}
        <tr><td style={{ ...S.pk, borderTop: '1px solid #cddad6', fontWeight: 700 }}>{totalLabel}</td><td style={{ ...S.pv, borderTop: '1px solid #cddad6', fontWeight: 700, color: '#065749' }}>{vnd(b.total)}</td></tr>
      </tbody>
    </table>
  )
}

export function NewBookingNotice({ b }: { b: EmailBooking }) {
  const lastNight = b.nights[b.nights.length - 1]?.date ?? b.checkIn
  const paid = b.paid >= b.total
  const rows: [string, string][] = [
    ['Phòng', `${b.rooms} × ${b.roomName} · ${b.planName}`],
    ['Nhận phòng', `${wd(b.checkIn)} ${dmy(b.checkIn)}, từ ${b.checkInTime}`],
    ['Trả phòng', `${wd(b.checkOut)} ${dmy(b.checkOut)}, trước ${b.checkOutTime}`],
    ['Khách', `${b.adults} người lớn${b.children ? ` · ${b.children} trẻ em` : ''}`],
    ['Người đặt', `${b.contactName} · ${b.contactPhone} · ${b.contactEmail}`],
    ...(b.guestName ? [['Người nhận phòng', b.guestName] as [string, string]] : []),
    ...(b.specialRequests ? [['Yêu cầu', b.specialRequests] as [string, string]] : []),
  ]
  return (
    <Html lang="vi">
      <Head />
      <Preview>{`Booking mới ${b.code} · ${b.roomName} · ${dmy(b.checkIn)} → ${dmy(b.checkOut)}`}</Preview>
      <Body style={S.body}>
        <Container style={S.box}>
          <Section style={S.head}>
            <Text style={S.eyebrow}>Booking mới · {paid ? 'đã thanh toán đủ' : 'đã thanh toán một phần'}</Text>
            <Text style={S.code}>{b.code}</Text>
            <Text style={S.sub}>{b.hotelName} · đặt qua website</Text>
          </Section>
          <Section style={S.inner}>
            <Text style={S.todo}>Việc cần làm: <b>đóng {b.rooms} phòng {b.roomName} trên Gohost</b> cho {b.nights.length} đêm {dmy(b.checkIn).slice(0, 5)} – {dmy(lastNight).slice(0, 5)} để OTA không bán trùng.</Text>
            <Facts rows={rows} />
            <NightTable b={b} totalLabel={`Tổng · ${paid ? 'đã thu đủ' : `đã thu ${vnd(b.paid)}`}${b.method ? ` (${METHOD[b.method].toLowerCase()})` : ''}`} />
            <Button href={b.adminUrl} style={S.btn}>Mở đơn trong admin</Button>
            <Text style={S.foot}>Email tự động gửi tới hộp thư team của khách sạn mỗi khi có booking web được thanh toán. Trả lời email này là trả lời thẳng khách. Đổi địa chỉ nhận: Admin → Khách sạn → Thông tin khách sạn → Thông tin chung.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

/** Email thử từ nút "Gửi email thử" ở admin. */
export function TeamTestNotice({ hotelName }: { hotelName: string }) {
  return (
    <Html lang="vi">
      <Head />
      <Preview>Email thử — hộp thư team nhận booking</Preview>
      <Body style={S.body}>
        <Container style={S.box}>
          <Section style={S.head}>
            <Text style={S.eyebrow}>Email thử</Text>
            <Text style={{ ...S.code, fontSize: 22 }}>{hotelName}</Text>
          </Section>
          <Section style={S.inner}>
            <Text style={{ fontSize: 15, lineHeight: '22px', margin: 0 }}>Hộp thư này đã nhận được email từ website. Mỗi khi có booking web được thanh toán (hoặc khách huỷ), team sẽ nhận email tại đây.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Email mã đăng nhập (song ngữ, ngắn). Mã là chữ số để gõ tay trên điện thoại.
import { Body, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'

export function LoginCode({ code, minutes }: { code: string; minutes: number }) {
  return (
    <Html lang="vi">
      <Head />
      <Preview>{`Mã đăng nhập Rooty Hospitality: ${code}`}</Preview>
      <Body style={{ backgroundColor: '#f4f6f5', fontFamily: 'Arial, sans-serif', color: '#0b2b26' }}>
        <Container style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 28, margin: '24px auto', maxWidth: 480 }}>
          <Heading style={{ fontSize: 20, margin: '0 0 8px' }}>Mã đăng nhập · Sign-in code</Heading>
          <Text style={{ fontSize: 36, fontWeight: 700, letterSpacing: 8, margin: '16px 0' }}>{code}</Text>
          <Text style={{ fontSize: 14, margin: '0 0 4px' }}>Mã có hiệu lực {minutes} phút. Không chia sẻ mã này với ai.</Text>
          <Text style={{ fontSize: 14, color: '#5b6b67', margin: 0 }}>Valid for {minutes} minutes. Do not share this code.</Text>
          <Text style={{ fontSize: 12, color: '#5b6b67', marginTop: 20 }}>Không phải bạn yêu cầu? Bỏ qua email này. · Didn’t request it? Ignore this email.</Text>
        </Container>
      </Body>
    </Html>
  )
}

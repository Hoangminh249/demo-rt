// Footer theo khuôn rootytrip.com: viền trên xanh, nhãn cam in hoa, số điện thoại xanh lớn, khối pháp lý ở giữa.
import Link from 'next/link'
import type { ReactNode } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { repo } from '@/lib/repo'
import { hotelHref } from '@/lib/stay'
import { CONTAINER, EYEBROW } from './kit'
import { Logo } from './header'

const Dot = ({ children }: { children: ReactNode }) => (
  <li className="flex items-center gap-2"><span className="size-1.5 shrink-0 rounded-full bg-orange" aria-hidden />{children}</li>
)
const LINK = 'inline-flex min-h-8 items-center gap-1 whitespace-nowrap hover:text-primary'

export function SiteFooter() {
  return (
    <footer id="lien-he" className="mt-20 border-t-4 border-primary bg-white">
      <div className={`${CONTAINER} grid gap-10 py-12 md:grid-cols-[1.1fr_1fr_1fr]`}>
        <div>
          <Logo className="h-12" />
          <p className="mt-5 text-xl font-bold text-brand">Liên hệ Rooty Hospitality</p>
          <p className={`mt-4 ${EYEBROW}`}>Đặt phòng · tư vấn</p>
          <a href="tel:0886068886" className="mt-1 flex min-h-10 items-center gap-1.5 text-xl font-semibold text-brand">0886 068 886 <span className="text-sm font-normal text-muted-foreground">Phú Quốc</span></a>
          <p className={`mt-4 ${EYEBROW}`}>Chăm sóc khách hàng</p>
          <a href="tel:0339062222" className="mt-1 flex min-h-10 items-center gap-1.5 text-xl font-semibold text-brand">0339 06 2222 <span className="text-sm font-normal text-muted-foreground">Zalo / WhatsApp</span></a>
          <p className={`mt-4 ${EYEBROW}`}>Email</p>
          <a href="mailto:sales@rootytrip.com" className="mt-1 inline-flex min-h-8 items-center text-brand underline underline-offset-4">sales@rootytrip.com</a>
        </div>
        <div>
          <p className="text-xl font-bold text-brand">Khách sạn</p>
          <ul className="mt-3 grid gap-1 text-[15px]">
            {repo.listHotels().map(h => <Dot key={h.slug}><Link href={hotelHref(h.slug)} className={LINK}>{h.name}</Link></Dot>)}
          </ul>
          <p className="mt-8 text-xl font-bold text-brand">Chính sách</p>
          {/* Trang chính sách chưa làm trong đợt này */}
          <ul className="mt-3 grid gap-1 text-[15px]">
            {['Chính sách huỷ và hoàn tiền', 'Chính sách bảo mật thông tin', 'Điều khoản đặt phòng'].map(t => <Dot key={t}><span className="inline-flex min-h-8 items-center text-muted-foreground">{t}</span></Dot>)}
          </ul>
        </div>
        <div>
          <p className="text-xl font-bold text-brand">Kết nối với chúng tôi</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {['Facebook', 'Zalo', 'YouTube', 'TikTok'].map(t => <span key={t} className="inline-flex h-10 items-center rounded-lg bg-mint px-3 text-[14px] font-medium text-brand">{t}</span>)}
          </div>
          <p className="mt-6 text-[14px] text-muted-foreground">Thanh toán bằng: <span className="font-medium text-orange"><span className="whitespace-nowrap">thẻ quốc tế ·</span> <span className="whitespace-nowrap">ATM/QR ·</span> <span className="whitespace-nowrap">chuyển khoản</span></span></p>
          <p className="mt-6 text-xl font-bold text-brand">Hệ sinh thái Rooty</p>
          <ul className="mt-3 grid gap-1 text-[15px]">
            <li><a href="https://rootytrip.com" className={LINK}>Rooty Trip · tour, combo, vé <ArrowUpRight className="size-3.5" aria-hidden /></a></li>
            <li><a href="https://rivusyacht.com" className={LINK}>RIVUS · cano, du thuyền <ArrowUpRight className="size-3.5" aria-hidden /></a></li>
          </ul>
        </div>
      </div>
      <div className={`${CONTAINER} border-t border-border py-8 text-center`}>
        <p className="text-lg font-bold text-brand sm:text-xl">Công ty Cổ phần Rooty Trip Phú Quốc</p>
        <p className="mt-2 text-[14px] text-muted-foreground">Trụ sở: 191 Trần Hưng Đạo, Khu phố Cửa Lấp, Đặc khu Phú Quốc, An Giang</p>
      </div>
      <div className="bg-brand py-4 text-center text-[13px] text-white">© 2026 Rooty Hospitality · thuộc Rooty Trip Phú Quốc · Bản demo, dữ liệu mẫu</div>
    </footer>
  )
}

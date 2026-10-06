import Link from 'next/link'
import { ArrowDown, AlertTriangle, ExternalLink } from 'lucide-react'
import { Badge, Card, PageTitle, type Tone } from '@/components/ui'

export const metadata = { title: 'Kiến trúc hệ thống (demo)' }

type Owner = 'Gohost' | 'TourWell' | 'Rooty' | 'Chưa rõ'
const OWNER_TONE: Record<Owner, Tone> = { Gohost: 'info', TourWell: 'warn', Rooty: 'brand', 'Chưa rõ': 'neutral' }

interface Block { title: string; href: string; items?: string[]; owner: Owner[]; note: string }

function Node({ b, big }: { b: Block; big?: boolean }) {
  return (
    <Link href={b.href} className={`group block rounded-xl border-2 border-border bg-surface p-3 transition hover:border-primary hover:shadow-md ${big ? 'md:p-4' : ''}`}>
      <p className="flex items-center justify-between gap-2 text-sm font-bold uppercase tracking-wide text-brand dark:text-accent">
        {b.title}<ExternalLink className="size-3.5 opacity-0 transition group-hover:opacity-100" />
      </p>
      {b.items && <ul className="mt-1 text-xs text-muted">{b.items.map(i => <li key={i}>{i}</li>)}</ul>}
      <div className="mt-2 flex flex-wrap gap-1">{b.owner.map(o => <Badge key={o} tone={OWNER_TONE[o]}>Ngoài đời: {o}</Badge>)}</div>
      <p className="mt-1 text-[11px] leading-snug text-muted">{b.note}</p>
    </Link>
  )
}
const Down = () => <div className="flex justify-center py-1 text-muted" aria-hidden><ArrowDown className="size-5" /></div>

const ROW1: Block[] = [
  { title: 'Website khách', href: '/', items: ['Tìm khách sạn', 'Xem phòng / giá', 'Đặt phòng', 'Thanh toán'], owner: ['Rooty'], note: 'Rooty làm web nội dung; nút Đặt phòng: MVP dùng Website đặt phòng của Gohost hoặc checkout riêng qua backend Rooty.' },
  { title: 'Agent Portal', href: '/agent', items: ['Đại lý đăng nhập', 'Xem giá B2B / tồn', 'Tạo booking', 'Công nợ / Voucher'], owner: ['Rooty', 'TourWell'], note: 'Gohost API không có đại lý có id, không có net rate → Rooty tự giữ; công nợ & hoa hồng thuộc lõi TourWell.' },
]
const ENGINE: Block = { title: 'Booking Engine', href: '/tim-kiem', owner: ['Gohost', 'Rooty'], note: 'Gohost: /properties/search, /room_types/search, POST /bookings. Gọi qua backend Rooty (giữ key, cache, rate limit, tính lại giá) — không gọi từ trình duyệt.' }
const ROW3: Block[] = [
  { title: 'Hotel', href: '/admin/hotels', owner: ['Gohost', 'Rooty'], note: 'Property ở Gohost (tenant_id); ảnh, mô tả, chính sách ở CMS Rooty.' },
  { title: 'Room', href: '/admin/rooms', owner: ['Gohost'], note: 'Room type & rate plan ở Gohost (API chỉ đọc). CMS Rooty chỉ thêm ảnh/mô tả theo room_type_id.' },
  { title: 'Inventory', href: '/admin/inventory', owner: ['Gohost'], note: 'Tồn phòng chỉ nằm ở Gohost (nguyên tắc 3) — kể cả đồng bộ OTA qua channel manager của Gohost.' },
]
const CENTRAL: Block = { title: 'Central Database', href: '/admin/bookings', owner: ['TourWell', 'Gohost'], note: 'Booking gốc ở Gohost; dữ liệu khách & giao dịch khách sạn luôn về TourWell (bộ não chung). Không nhập tay hai nơi.' }
const ROW5: Block[] = [
  { title: 'CRM', href: '/admin/customers', owner: ['TourWell'], note: '1 hồ sơ khách dùng chung khách sạn, tour, tàu.' },
  { title: 'Payment', href: '/admin/payments', owner: ['TourWell', 'Chưa rõ'], note: 'Lõi thanh toán & công nợ TourWell. Cổng thanh toán & merchant đứng tên ai: UNKNOWN.' },
  { title: 'Agent', href: '/admin/agents', owner: ['TourWell'], note: 'Đại lý & hoa hồng thuộc lõi TourWell.' },
  { title: 'Reports', href: '/admin', owner: ['TourWell', 'Gohost'], note: 'Báo cáo gộp nhiều KS ở TourWell/kho dữ liệu. Gohost có báo cáo công suất từng KS, API không trả occupancy/ADR.' },
  { title: 'Loyalty', href: '/thanh-vien', owner: ['TourWell', 'Chưa rõ'], note: 'Chưa có ở hệ thống nào — để sau MVP.' },
]
const ECO: Block[] = [
  { title: 'Tour · Transfer', href: '/trai-nghiem/tour', owner: ['TourWell'], note: 'Module Rooty Trip trên TourWell. Xe thuộc Rooty Trip.' },
  { title: 'RIVUS', href: '/trai-nghiem/rivus', owner: ['TourWell'], note: 'Module RIVUS: đội tàu, ca chạy, sức chở.' },
]

const NOTES: [string, string][] = [
  ['Rate limit', '60 request / 5 phút / API key cho mọi lời gọi (tìm phòng + tạo booking + đồng bộ + dashboard). Phải cache và dùng chung limiter.'],
  ['Không webhook', 'Không có webhook hay filter updated_since → muốn bắt booking OTA/lễ tân mới phải quét lại theo khoảng ngày check-in.'],
  ['Không idempotency', 'Retry tạo booking có thể tạo trùng → backend Rooty phải tự khoá & đối soát.'],
  ['Không external ID', 'Bảng ánh xạ mã Rooty ↔ Gohost booking code phải nằm phía Rooty.'],
  ['Không giữ phòng', 'Không có hold; chỉ có auto_cancel (thời hạn UNKNOWN). Bộ đếm 15 phút trong demo là giả lập.'],
  ['Giá do client gửi', 'POST /bookings nhận days_breakdown từ client → bắt buộc tính lại giá ở server.'],
  ['Gohost không có', 'Ảnh, mô tả, tiện ích, chính sách huỷ, thuế phí, giá đại lý/net rate, đại lý có id, báo cáo occupancy/ADR, sửa giá/tồn qua API, đổi ngày/đổi phòng, check-out.'],
  ['Dữ liệu nhạy cảm', 'CCCD/ảnh giấy tờ (identity_image_urls) → tuân thủ Nghị định 13/2023.'],
]

export default function ArchitecturePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageTitle title="Sơ đồ tổng thể (PDF v4 §8)" sub="Bấm vào từng khối để mở màn hình demo tương ứng. Nhãn “Ngoài đời” cho biết hệ thống nào sẽ đảm nhận theo chiến lược 3 website – 2 hệ thống – 1 bộ não." />
      <div className="mb-6 rounded-xl border border-warn/40 bg-warn-bg p-4 text-sm text-warn">
        <p className="flex items-center gap-2 font-semibold"><AlertTriangle className="size-4" /> Demo ≠ kiến trúc thật</p>
        <p className="mt-1">Demo vẽ đủ khối như PDF v4 để lấy góp ý UX. Bản review 06/10/2026 kết luận <b>không tự xây</b> Rooms / Rates / Inventory / Channel Manager — các khối này do Gohost đảm nhận; dữ liệu khách & giao dịch về TourWell.</p>
      </div>

      <div className="rounded-2xl bg-surface-2 p-4 md:p-6">
        <p className="mx-auto w-fit rounded-xl bg-brand px-6 py-3 text-center font-bold tracking-wide text-white">ROOTY HOSPITALITY</p>
        <Down />
        <div className="grid gap-3 md:grid-cols-2">{ROW1.map(b => <Node key={b.title} b={b} big />)}</div>
        <Down />
        <div className="mx-auto max-w-xl"><Node b={ENGINE} big /></div>
        <Down />
        <div className="grid gap-3 md:grid-cols-3">{ROW3.map(b => <Node key={b.title} b={b} />)}</div>
        <Down />
        <div className="mx-auto max-w-xl"><Node b={CENTRAL} big /></div>
        <Down />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{ROW5.map(b => <Node key={b.title} b={b} />)}</div>
        <Down />
        <div className="rounded-xl border-2 border-dashed border-primary/50 p-3">
          <p className="mb-2 text-center text-sm font-bold uppercase tracking-wide text-brand dark:text-accent">Rooty Ecosystem</p>
          <div className="grid gap-3 sm:grid-cols-2">{ECO.map(b => <Node key={b.title} b={b} />)}</div>
        </div>
      </div>

      <h2 className="mb-3 mt-10 text-xl font-bold">Ghi chú tích hợp Gohost</h2>
      <p className="mb-4 text-sm text-muted">Trích từ <code>docs/context/04-gohost-api.md</code> — đọc từ OpenAPI spec ngày 05/10/2026, <b>chưa gọi thử API thật</b> (CONFIRMED theo spec, hành vi runtime UNKNOWN).</p>
      <div className="grid gap-3 md:grid-cols-2">
        {NOTES.map(([k, v]) => <Card key={k} className="p-4"><p className="font-semibold">{k}</p><p className="mt-1 text-sm text-muted">{v}</p></Card>)}
      </div>
      <Card className="mt-6 p-4 text-sm">
        <p className="font-semibold">Lớp dữ liệu trong demo</p>
        <p className="mt-1 text-muted">Mọi màn hình gọi qua <code>src/lib/repo</code>. Khi Gohost mở API dùng thử: viết repo mới cùng kiểu <code>Repo</code> gọi backend Rooty, đổi 1 dòng ở <code>src/lib/repo/index.ts</code>. Tên field đã bám Gohost: room_type_id, rate_plan_id, days_breakdown, source_name, payment_collect, checkin_date, checkout_date.</p>
      </Card>
    </div>
  )
}

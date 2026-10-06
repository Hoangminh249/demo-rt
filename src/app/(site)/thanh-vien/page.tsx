'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Crown, Gift, Percent, Cake, Ticket, LogIn } from 'lucide-react'
import { repo } from '@/lib/repo'
import { useDemo } from '@/store/provider'
import { Button, Card, Photo, PageTitle, Select } from '@/components/ui'
import { toast } from '@/components/ui/overlay'

const TIERS = [
  { name: 'Member', need: 'Đăng ký miễn phí', perks: ['Giá thành viên −5%', 'Tích 1 điểm / 10.000đ'] },
  { name: 'Silver', need: '2 lần ở / năm', perks: ['Giá thành viên −5%', 'Nhận phòng sớm (tuỳ tình trạng)', 'Voucher sinh nhật 300.000đ'] },
  { name: 'Gold', need: '4 lần ở hoặc 30 triệu / năm', perks: ['Tất cả quyền Silver', 'Xe sân bay miễn phí 1 chiều', 'Voucher sinh nhật 500.000đ', 'Nâng hạng phòng (tuỳ tình trạng)'] },
  { name: 'Platinum', need: '8 lần ở hoặc 80 triệu / năm', perks: ['Tất cả quyền Gold', 'Trả phòng muộn 16:00', 'Du thuyền RIVUS giảm 15%', 'Quản lý khách hàng riêng'] },
]
const BENEFITS = [
  { Icon: Percent, t: 'Member price', d: 'Giảm thêm 5% khi đăng nhập' },
  { Icon: Ticket, t: 'Voucher', d: 'Tặng sau mỗi lần ở' },
  { Icon: Cake, t: 'Ưu đãi sinh nhật', d: 'Voucher tháng sinh nhật' },
  { Icon: Gift, t: 'Tích điểm', d: 'Đổi xe, tour, spa' },
]

export default function LoyaltyPage() {
  const { overlay, update } = useDemo()
  const router = useRouter()
  const customers = repo.customersSync()
  const [pick, setPick] = useState('C002')
  const me = overlay.session.customerId ? customers.find(c => c.id === overlay.session.customerId) : null
  const login = (id: string) => {
    update(o => ({ session: { ...o.session, customerId: id, role: 'guest' } }))
    toast(`Đã đăng nhập (giả lập): ${customers.find(c => c.id === id)?.name}`)
    router.push(id === 'C001' ? '/' : '/tai-khoan')
  }
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="relative mb-8 overflow-hidden rounded-2xl">
        <Photo src="/images/loyalty.jpg" alt="" className="absolute inset-0" />
        <div className="relative bg-brand/70 p-8 text-white md:p-12">
          <h1 className="text-3xl font-bold">Rooty Members</h1>
          <p className="mt-2 max-w-xl text-white/90">Khách không mất đi sau check-out. Một tài khoản dùng chung cho khách sạn, tour Rooty Trip và du thuyền RIVUS.</p>
        </div>
      </div>
      <div className="mb-10 grid gap-4 md:grid-cols-4">
        {BENEFITS.map(({ Icon, t, d }) => <Card key={t} className="p-4"><Icon className="size-6 text-primary" /><p className="mt-2 font-semibold">{t}</p><p className="text-sm text-muted-foreground">{d}</p></Card>)}
      </div>
      <PageTitle title="Hạng thành viên" />
      <div className="grid gap-4 md:grid-cols-4">
        {TIERS.map(t => (
          <Card key={t.name} className="p-5">
            <p className="flex items-center gap-2 text-lg font-bold"><Crown className="size-5 text-amber-500" />{t.name}</p>
            <p className="text-xs text-muted-foreground">{t.need}</p>
            <ul className="mt-3 space-y-1 text-sm">{t.perks.map(p => <li key={p}>• {p}</li>)}</ul>
          </Card>
        ))}
      </div>
      <Card className="mt-8 p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold"><LogIn className="size-5" /> Đăng nhập (giả lập)</h2>
        {me ? (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <p>Đang đăng nhập: <b>{me.name}</b> ({me.tier}, {me.points.toLocaleString('vi-VN')} điểm)</p>
            <Button variant="secondary" onClick={() => router.push('/tai-khoan')}>Tài khoản của tôi</Button>
            <Button variant="ghost" onClick={() => { update(o => ({ session: { ...o.session, customerId: undefined } })); toast('Đã đăng xuất') }}>Đăng xuất</Button>
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <Button size="lg" className="h-auto! max-w-full whitespace-normal! py-2" onClick={() => login('C001')}>Đăng nhập là Nguyễn Văn A (khách quen)</Button>
            <span className="text-sm text-muted-foreground">hoặc</span>
            <label className="text-sm">Khách khác
              <Select value={pick} onChange={e => setPick(e.target.value)} className="mt-1 w-56">{customers.slice(1, 25).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
            </label>
            <Button variant="secondary" onClick={() => login(pick)}>Đăng nhập</Button>
          </div>
        )}
        <p className="mt-3 text-xs text-muted-foreground">Đăng nhập là Nguyễn Văn A để xem trang chủ và AI cá nhân hoá (Ocean View → Family Room → Breakfast → tour phù hợp).</p>
      </Card>
    </div>
  )
}

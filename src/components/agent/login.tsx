'use client'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Briefcase, ArrowRight } from 'lucide-react'
import { repo } from '@/lib/repo'
import { useAsync, useDemo } from '@/store/provider'
import { Badge, Button, Card, Field, Select } from '../ui'
import { toast } from '../ui/overlay'

const FLOW = ['Đăng ký hợp tác', 'Rooty duyệt', 'Đăng nhập', 'Tìm KS', 'Xem ngày', 'Xem phòng còn', 'Xem giá đại lý', 'Nhập khách', 'Đặt phòng', 'Thanh toán / công nợ', 'Nhận voucher']

export function AgentLogin() {
  const { update } = useDemo()
  const router = useRouter()
  const agents = repo.agentsSync().filter(a => a.status === 'active')
  const apps = useAsync(() => repo.listApplications(), [])
  const [id, setId] = useState('AG01')
  const login = () => {
    update(o => ({ session: { ...o.session, agentId: id, role: 'agent' } }))
    toast(`Đăng nhập: ${agents.find(a => a.id === id)?.name}`)
    router.push('/agent/tim-phong')
  }
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="text-center">
        <Briefcase className="mx-auto size-10 text-primary" />
        <h1 className="mt-2 text-2xl font-bold">Cổng đại lý Rooty Hospitality</h1>
        <p className="text-muted-foreground">Giá net, tồn phòng thời gian thực, đặt phòng & công nợ cho đối tác B2B.</p>
      </div>
      <ol className="flex flex-wrap justify-center gap-1 text-xs">
        {FLOW.map((s, i) => <li key={s} className="flex items-center gap-1"><Badge tone={i < 2 ? 'neutral' : 'brand'}>{s}</Badge>{i < FLOW.length - 1 && <ArrowRight className="size-3 text-muted-foreground" />}</li>)}
      </ol>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="space-y-3 p-5">
          <h2 className="font-semibold">Đăng nhập (giả lập)</h2>
          <Field label="Tài khoản đại lý"><Select value={id} onChange={e => setId(e.target.value)}>{agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</Select></Field>
          <Button onClick={login} className="w-full">Đăng nhập</Button>
          <p className="text-xs text-muted-foreground">Kịch bản demo: chọn <b>ABC Travel</b>.</p>
        </Card>
        <Card className="space-y-3 p-5">
          <h2 className="font-semibold">Chưa có tài khoản?</h2>
          <p className="text-sm text-muted-foreground">Gửi hồ sơ hợp tác. Sau khi Rooty duyệt (Admin › Agents / B2B), tài khoản xuất hiện trong danh sách đăng nhập.</p>
          <Link href="/agent/dang-ky" className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-sm font-semibold hover:bg-muted">Đăng ký hợp tác</Link>
          {apps.data && apps.data.length > 0 && (
            <ul className="space-y-1 text-sm">{apps.data.map(a => <li key={a.id} className="flex justify-between"><span>{a.company}</span><Badge tone={a.status === 'pending' ? 'warn' : a.status === 'approved' ? 'ok' : 'danger'}>{a.status === 'pending' ? 'Chờ duyệt' : a.status === 'approved' ? 'Đã duyệt' : 'Từ chối'}</Badge></li>)}</ul>
          )}
        </Card>
      </div>
    </div>
  )
}

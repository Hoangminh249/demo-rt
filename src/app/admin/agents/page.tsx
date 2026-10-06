'use client'
import Link from 'next/link'
import { Check, X } from 'lucide-react'
import { repo } from '@/lib/repo'
import { useAsync } from '@/store/provider'
import { useAdmin } from '@/components/admin/use-admin'
import { fmtDateTime, fmtMoneyShort, fmtPct, fmtVND } from '@/lib/format'
import { Badge, Button, Card, PageTitle, SkeletonList, Table, cn } from '@/components/ui'
import { toast } from '@/components/ui/overlay'

export default function AgentsAdmin() {
  const a = useAdmin()
  const list = useAsync(() => repo.listAgents(), [])
  const apps = useAsync(() => repo.listApplications(), [])
  const pending = apps.data?.filter(x => x.status === 'pending') ?? []
  async function review(id: string, ok: boolean, name: string) {
    await repo.reviewApplication(id, ok)
    toast(ok ? `Đã duyệt ${name} — tài khoản Agent Portal đã được cấp` : `Đã từ chối ${name}`)
  }
  return (
    <>
      <PageTitle title="Agents / B2B" sub="Đại lý, hạn mức, công nợ, net rate — số liệu năm 2026" />
      <Card className="mb-6 p-4">
        <h2 className="font-semibold">Đăng ký chờ duyệt {pending.length > 0 && <Badge tone="warn">{pending.length}</Badge>}</h2>
        {pending.length === 0 ? <p className="mt-1 text-sm text-muted">Không có hồ sơ chờ duyệt. Demo: vào <Link href="/agent/dang-ky" className="text-primary underline">/agent/dang-ky</Link> gửi một hồ sơ.</p> : (
          <ul className="mt-3 divide-y divide-border">
            {pending.map(p => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
                <div className="min-w-0 flex-1"><p className="font-medium">{p.company} · MST {p.tax_code}</p><p className="text-muted">{p.contact} · {p.phone} · {p.email} · gửi {fmtDateTime(p.submitted_at)}</p>{p.note && <p className="text-xs text-muted">{p.note}</p>}</div>
                {a.can('agents', 'full') && <><Button size="sm" onClick={() => review(p.id, true, p.company)}><Check className="size-4" /> Duyệt</Button><Button size="sm" variant="secondary" onClick={() => review(p.id, false, p.company)}><X className="size-4" /> Từ chối</Button></>}
              </li>
            ))}
          </ul>
        )}
      </Card>
      {!list.data ? <SkeletonList rows={6} /> : (
        <Table>
          <thead><tr><th>Đại lý</th><th className="text-right">Booking</th><th className="text-right">Room nights</th><th className="text-right">Doanh thu net</th><th className="text-right">Hoa hồng</th><th>Công nợ / hạn mức</th></tr></thead>
          <tbody>
            {[...list.data].sort((x, y) => y.revenue - x.revenue).map(s => (
              <tr key={s.agent.id}>
                <td><Link href={`/admin/agents/${s.agent.id}`} className="font-medium text-primary hover:underline">{s.agent.name}</Link><div className="text-xs text-muted">{s.agent.contact} · CK {Math.round(s.agent.discount * 100)}%</div></td>
                <td className="text-right">{s.bookings}</td>
                <td className="text-right">{s.rn}</td>
                <td className="text-right">{fmtMoneyShort(s.revenue)}</td>
                <td className="text-right">{fmtVND(s.commission)}</td>
                <td className="min-w-48">
                  <div className="flex justify-between text-xs"><span>Nợ {fmtMoneyShort(s.debt)} · đã dùng {fmtMoneyShort(s.exposure)}</span><span className="text-muted">/ {fmtMoneyShort(s.agent.credit_limit)} · {fmtPct(s.limitUsed, 0)}</span></div>
                  <div className="mt-1 h-1.5 rounded-full bg-surface-2"><div className={cn('h-1.5 rounded-full', s.limitUsed > 0.8 ? 'bg-danger' : 'bg-primary')} style={{ width: `${Math.min(100, s.limitUsed * 100)}%` }} /></div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  )
}

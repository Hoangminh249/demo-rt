'use client'
import Link from 'next/link'
import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { repo } from '@/lib/repo'
import { useAsync } from '@/store/provider'
import { fmtDate, fmtVND } from '@/lib/format'
import { Badge, Input, PageTitle, Segmented, SkeletonList, Table } from '@/components/ui'

type Seg = 'all' | 'returning' | 'high' | 'family'

function Customers() {
  const sp = useSearchParams()
  const router = useRouter()
  const seg = (sp.get('segment') as Seg) ?? 'all'
  const [q, setQ] = useState('')
  const list = useAsync(() => repo.listCustomers({ q, segment: seg === 'all' ? undefined : seg }), [q, seg])
  return (
    <>
      <PageTitle title="Customers / CRM" sub="Khách không mất đi sau check-out — 1 hồ sơ dùng chung khách sạn, tour, tàu (ngoài đời: TourWell)">
        <Input placeholder="Tên, SĐT, email" value={q} onChange={e => setQ(e.target.value)} className="w-56" aria-label="Tìm khách" />
      </PageTitle>
      <div className="mb-4">
        <Segmented label="Phân khúc" value={seg} onChange={v => router.replace(v === 'all' ? '/admin/customers' : `/admin/customers?segment=${v}`)}
          options={[{ value: 'all', label: 'Tất cả' }, { value: 'returning', label: 'Khách quay lại' }, { value: 'high', label: 'Chi tiêu cao' }, { value: 'family', label: 'Gia đình' }]} />
      </div>
      {!list.data ? <SkeletonList rows={6} /> : (
        <Table>
          <thead><tr><th>Khách</th><th>Hạng</th><th className="text-right">Booking</th><th className="text-right">Room nights</th><th className="text-right">Tổng chi</th><th>Lần ở gần nhất</th><th>Sở thích</th></tr></thead>
          <tbody>
            {list.data.map(c => (
              <tr key={c.id} className="cursor-pointer hover:bg-surface-2" onClick={() => router.push(`/admin/customers/${c.id}`)}>
                <td><Link href={`/admin/customers/${c.id}`} className="font-medium text-primary hover:underline" onClick={e => e.stopPropagation()}>{c.name}</Link><div className="text-xs text-muted">{c.phone} · {c.nationality}</div></td>
                <td><Badge tone={c.tier === 'Platinum' || c.tier === 'Gold' ? 'warn' : 'neutral'}>{c.tier}</Badge></td>
                <td className="text-right">{c.stats.bookings}</td>
                <td className="text-right">{c.stats.roomNights}</td>
                <td className="text-right">{fmtVND(c.stats.spend)}</td>
                <td>{c.stats.lastStay ? fmtDate(c.stats.lastStay) : '—'}</td>
                <td className="text-xs text-muted">{c.preferences.join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  )
}

export default function Page() { return <Suspense><Customers /></Suspense> }

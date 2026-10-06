'use client'
import { Check, Eye, Minus } from 'lucide-react'
import { repo } from '@/lib/repo'
import { useAdmin } from '@/components/admin/use-admin'
import { ADMIN_MODULES, PERMISSIONS, ROLE_LABEL } from '@/lib/permissions'
import type { AdminRole } from '@/lib/types'
import { Badge, Button, Card, PageTitle, Table } from '@/components/ui'
import { toast } from '@/components/ui/overlay'

const ROLES = Object.keys(ROLE_LABEL) as AdminRole[]

export default function UsersAdmin() {
  const a = useAdmin()
  const users = repo.users()
  const hotels = repo.hotelsSync()
  return (
    <div className="space-y-6">
      <PageTitle title="Users & Permissions" sub="Phân quyền theo vai trò. Quản lý khách sạn chỉ thấy dữ liệu khách sạn của mình." />
      <section>
        <h2 className="mb-2 font-semibold">Người dùng</h2>
        <Table>
          <thead><tr><th>Họ tên</th><th>Email</th><th>Vai trò</th><th>Phạm vi</th><th /></tr></thead>
          <tbody>{users.map(u => (
            <tr key={u.id}>
              <td className="font-medium">{u.name}{u.id === a.user.id && <Badge tone="ok" className="ml-2">Đang xem</Badge>}</td>
              <td>{u.email}</td>
              <td>{ROLE_LABEL[u.role]}</td>
              <td>{u.hotel_id ? hotels.find(h => h.id === u.hotel_id)?.name : 'Tất cả khách sạn'}</td>
              <td>{u.id !== a.user.id && <Button size="sm" variant="secondary" onClick={() => { a.setUser(u.id); toast(`Đang xem admin với quyền ${ROLE_LABEL[u.role]}`, 'info') }}>Xem với quyền này</Button>}</td>
            </tr>
          ))}</tbody>
        </Table>
      </section>
      <section>
        <h2 className="mb-2 font-semibold">Ma trận vai trò × quyền</h2>
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead><tr className="bg-surface-2"><th className="p-2 text-left text-xs uppercase text-muted">Module</th>{ROLES.map(r => <th key={r} className="p-2 text-xs uppercase text-muted">{ROLE_LABEL[r]}</th>)}</tr></thead>
            <tbody>{ADMIN_MODULES.map(m => (
              <tr key={m.key} className="border-t border-border">
                <td className="p-2 font-medium">{m.label}</td>
                {ROLES.map(r => {
                  const v = PERMISSIONS[r][m.key]
                  return <td key={r} className="p-2 text-center">{v === 'full' ? <Check className="mx-auto size-4 text-ok" aria-label="Toàn quyền" /> : v === 'view' ? <Eye className="mx-auto size-4 text-info" aria-label="Chỉ xem" /> : <Minus className="mx-auto size-4 text-muted" aria-label="Không có quyền" />}</td>
                })}
              </tr>
            ))}</tbody>
          </table>
        </Card>
        <p className="mt-2 flex flex-wrap gap-4 text-xs text-muted"><span className="flex items-center gap-1"><Check className="size-3.5 text-ok" />Toàn quyền</span><span className="flex items-center gap-1"><Eye className="size-3.5 text-info" />Chỉ xem</span><span className="flex items-center gap-1"><Minus className="size-3.5" />Ẩn</span></p>
        <p className="mt-2 text-sm text-muted">Thử: chọn vai trò <b>Quản trị khách sạn</b> ở banner demo → bộ chọn khách sạn bị khoá vào PITO Hòn Thơm, dashboard/booking/tồn chỉ còn số liệu PITO, module Agents & Users bị ẩn.</p>
      </section>
    </div>
  )
}

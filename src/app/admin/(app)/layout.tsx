// Khung app admin (sidebar + header) cho mọi trang đã đăng nhập. Trang đăng nhập nằm ngoài nhóm này.
// Kiểm quyền ở đây (lớp 2 sau proxy): không có quyền → /admin/login. Từng trang còn kiểm role riêng (requireAdmin).
import type { ReactNode } from 'react'
import { cookies } from 'next/headers'
import { catalogApi } from '@/api/catalog'
import { AdminFrame } from '@/components/admin/frame'
import { SIDEBAR_COOKIE } from '@/components/admin/ui'
import { requireAdmin } from '@/lib/admin-actor'
import { isDbSource } from '@/lib/db'

export default async function AdminAppLayout({ children }: { children: ReactNode }) {
  const actor = await requireAdmin(['ADMIN', 'STAFF'])
  const collapsed = (await cookies()).get(SIDEBAR_COOKIE)?.value === '1' // server dựng đúng trạng thái thu/mở, không nháy
  const hotels = actor.role === 'ADMIN' ? (await catalogApi.contents(true)).map(h => ({ slug: h.slug, name: h.name })) : []
  return <AdminFrame hotels={hotels} actor={{ name: actor.name, role: actor.role }} db={isDbSource()} defaultCollapsed={collapsed}>{children}</AdminFrame>
}

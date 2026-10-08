// Khung app admin (sidebar + header) cho mọi trang đã đăng nhập. Trang đăng nhập nằm ngoài nhóm này.
import type { ReactNode } from 'react'
import { cookies } from 'next/headers'
import { hotelApi } from '@/api/hotel'
import { AdminFrame } from '@/components/admin/frame'
import { SIDEBAR_COOKIE } from '@/components/admin/ui'

export default async function AdminAppLayout({ children }: { children: ReactNode }) {
  const collapsed = (await cookies()).get(SIDEBAR_COOKIE)?.value === '1' // server dựng đúng trạng thái thu/mở, không nháy
  const hotels = hotelApi.list('vi').map(h => ({ slug: h.slug, name: h.name }))
  return <AdminFrame hotels={hotels} defaultCollapsed={collapsed}>{children}</AdminFrame>
}

import { AdminShell } from '@/components/admin/shell'
import { NotFound } from '@/components/admin/ui'

export default function AdminNotFound() {
  return (
    <AdminShell parent={{ label: 'Tổng quan', href: '/admin' }}>
      <NotFound title="Không tìm thấy trang" desc="Đường dẫn có thể bị gõ sai, hoặc khách sạn đã được gỡ khỏi nội dung." href="/admin" label="Về Tổng quan" />
    </AdminShell>
  )
}

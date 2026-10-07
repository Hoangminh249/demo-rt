import { AdminShell } from '@/components/admin/shell'
import { NotFound } from '@/components/admin/ui'

export default function BookingNotFound() {
  return (
    <AdminShell active="bookings" parent={{ label: 'Booking', href: '/admin/bookings' }}>
      <NotFound title="Không tìm thấy booking" desc="Đường dẫn thiếu khách sạn, hoặc mã booking có ký tự không hợp lệ." href="/admin/bookings" label="Về danh sách booking" />
    </AdminShell>
  )
}

import { NotFound } from '@/components/admin/ui'

export default function AdminNotFound() {
  return <NotFound title="Không tìm thấy trang" desc="Đường dẫn có thể bị gõ sai, hoặc khách sạn đã được gỡ khỏi nội dung." href="/admin" label="Về Tổng quan" />
}

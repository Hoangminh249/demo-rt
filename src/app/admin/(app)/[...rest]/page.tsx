// Đường dẫn lạ trong /admin vẫn ở trong khung admin (không rơi sang [locale]/[...rest] của website).
import { notFound } from 'next/navigation'

export default function AdminCatchAll() {
  notFound()
}

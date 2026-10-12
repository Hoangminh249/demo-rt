// Đăng nhập admin: Google / email + mã (User.role ADMIN hoặc STAFF) hoặc tài khoản env dự phòng.
// Đã có quyền thì chuyển thẳng về trang đích.
import { redirect } from 'next/navigation'
import { authConfigured } from '@/auth'
import { AdminLogin } from '@/components/admin/login-form'
import { adminActor, signedInWithoutAdmin } from '@/lib/admin-actor'

export const metadata = { title: 'Đăng nhập' }

export default async function AdminLoginPage({ searchParams }: PageProps<'/admin/login'>) {
  const next = (await searchParams).next
  // Chỉ quay lại trang trong /admin (chặn chuyển hướng ra ngoài qua ?next=).
  const target = typeof next === 'string' && /^\/admin(\/|\?|$)/.test(next) && !next.startsWith('/admin/login') ? next : '/admin'
  if (await adminActor()) redirect(target)
  return (
    <main className="flex min-h-screen items-start justify-center px-4 pt-16 pb-16 sm:items-center sm:pt-0">
      <AdminLogin next={target} account={authConfigured()} denied={await signedInWithoutAdmin()} />
    </main>
  )
}

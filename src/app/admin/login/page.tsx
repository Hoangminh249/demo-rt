// Đăng nhập admin. Đã đăng nhập thì src/proxy.ts chuyển thẳng về /admin.
import { LoginForm } from '@/components/admin/login-form'

export const metadata = { title: 'Đăng nhập' }

export default async function AdminLoginPage({ searchParams }: PageProps<'/admin/login'>) {
  const next = (await searchParams).next
  // Chỉ quay lại trang trong /admin (chặn chuyển hướng ra ngoài qua ?next=).
  const target = typeof next === 'string' && /^\/admin(\/|\?|$)/.test(next) && !next.startsWith('/admin/login') ? next : '/admin'
  return (
    <main className="flex min-h-screen items-start justify-center px-4 pt-16 pb-16 sm:items-center sm:pt-0">
      <LoginForm next={target} />
    </main>
  )
}

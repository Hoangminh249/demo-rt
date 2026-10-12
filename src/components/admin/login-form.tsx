'use client'
// Đăng nhập admin (form.md · A "Một cột giữa màn"): logo · tiêu đề · khối đăng nhập dùng chung (Google / email + mã, User.role
// ADMIN hoặc STAFF) · tài khoản env gập lại làm đường dự phòng (tên đăng nhập · mật khẩu, luôn là ADMIN).
import { useState, type FormEvent } from 'react'
import Image from 'next/image'
import { isAxiosError } from 'axios'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useLogin, useLogout } from '@/hooks/use-admin'
import { LoginPanel } from '@/components/auth/login'

const ERRORS: Record<number, string> = {
  401: 'Sai tên đăng nhập hoặc mật khẩu.',
  503: 'Máy chủ chưa cấu hình tài khoản admin (ADMIN_USER, ADMIN_PASSWORD).',
}

/** `account`: bật đăng nhập Google / email (có DB + AUTH_SECRET). `denied`: email đã đăng nhập nhưng không có quyền admin. */
export function AdminLogin({ next, account, denied }: { next: string; account: boolean; denied: string | null }) {
  const logout = useLogout()
  return (
    <div className="w-full max-w-md rounded-2xl bg-card p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <Image src="/images/brand/rooty-trip-logo.png" alt="Rooty Trip" width={286} height={84} priority className="logo-green h-9 w-auto" />
        <span className="text-sm font-semibold text-brand">Admin</span>
      </div>
      <h1 className="mt-6 text-xl font-semibold">Đăng nhập</h1>
      <p className="mt-1 text-sm text-muted-foreground">Trang quản trị rootyhospitality.com</p>
      {denied && (
        <div role="alert" className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
          Tài khoản <b>{denied}</b> chưa có quyền quản trị (role ADMIN / STAFF).
          <button type="button" onClick={() => logout.mutate()} className="mt-2 block font-medium underline underline-offset-2">Đăng xuất để dùng tài khoản khác</button>
        </div>
      )}
      {account && !denied && <div className="mt-6"><LoginPanel callbackUrl={next} /></div>}
      <details className="group mt-6 border-t border-border pt-4" open={!account}>
        <summary className="cursor-pointer list-none text-sm font-medium text-muted-foreground hover:text-foreground [&::-webkit-details-marker]:hidden">
          Tài khoản quản trị dự phòng <span className="group-open:hidden">▸</span><span className="hidden group-open:inline">▾</span>
        </summary>
        <EnvLoginForm next={next} />
      </details>
    </div>
  )
}

function EnvLoginForm({ next }: { next: string }) {
  const login = useLogin()
  const [show, setShow] = useState(false)
  const [empty, setEmpty] = useState<{ user?: boolean; password?: boolean }>({})
  const failed = login.error ? (isAxiosError(login.error) && ERRORS[login.error.response?.status ?? 0]) || 'Không đăng nhập được. Thử lại sau ít phút.' : null

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const user = String(f.get('user') ?? '').trim()
    const password = String(f.get('password') ?? '')
    setEmpty({ user: !user, password: !password })
    if (!user || !password) return
    // Tải lại hẳn trang đích: proxy đọc cookie phiên mới, mọi dữ liệu lấy lại từ đầu.
    login.mutate({ user, password }, { onSuccess: () => window.location.assign(next) })
  }

  return (
      <form onSubmit={submit} noValidate className="mt-4 grid gap-4">
        <div className="grid gap-1.5">
          <label htmlFor="login-user" className="text-sm font-medium">Tên đăng nhập</label>
          <Input id="login-user" name="user" autoComplete="username" placeholder="Nhập tên đăng nhập" className="h-12 md:h-12"
            aria-invalid={empty.user || undefined} aria-describedby={empty.user ? 'login-user-err' : undefined} />
          {empty.user && <p id="login-user-err" className="text-sm text-red-700">Chưa nhập tên đăng nhập</p>}
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="login-password" className="text-sm font-medium">Mật khẩu</label>
          <div className="relative">
            <Input id="login-password" name="password" type={show ? 'text' : 'password'} autoComplete="current-password" placeholder="Nhập mật khẩu" className="h-12 pr-12 md:h-12"
              aria-invalid={empty.password || undefined} aria-describedby={empty.password ? 'login-password-err' : undefined} />
            <Button type="button" variant="ghost" size="icon" onClick={() => setShow(s => !s)} aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} aria-pressed={show}
              className="absolute top-1 right-1">
              {show ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
            </Button>
          </div>
          {empty.password && <p id="login-password-err" className="text-sm text-red-700">Chưa nhập mật khẩu</p>}
        </div>
        {failed && <p role="alert" className="text-sm text-red-700">{failed}</p>}
        <Button type="submit" variant="default" disabled={login.isPending || login.isSuccess} className="mt-2 h-12 w-full">
          {login.isPending || login.isSuccess ? 'Đang đăng nhập…' : 'Đăng nhập'}
        </Button>
      </form>
  )
}

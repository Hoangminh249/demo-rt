'use client'
// Đăng nhập admin (form.md · A "Một cột giữa màn"): logo · tiêu đề · tên đăng nhập · mật khẩu (nút mắt) · câu lỗi · nút.
// Không "Quên mật khẩu?" và không nút Google: tài khoản là một cặp trong env, chưa có luồng đặt lại hay SSO.
import { useState, type FormEvent } from 'react'
import Image from 'next/image'
import { isAxiosError } from 'axios'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useLogin } from '@/hooks/use-admin'

const ERRORS: Record<number, string> = {
  401: 'Sai tên đăng nhập hoặc mật khẩu.',
  503: 'Máy chủ chưa cấu hình tài khoản admin (ADMIN_USER, ADMIN_PASSWORD).',
}

export function LoginForm({ next }: { next: string }) {
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
    <div className="w-full max-w-md rounded-2xl bg-card p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <Image src="/images/brand/rooty-trip-logo.png" alt="Rooty Trip" width={286} height={84} priority className="logo-green h-9 w-auto" />
        <span className="text-sm font-semibold text-brand">Admin</span>
      </div>
      <h1 className="mt-6 text-xl font-semibold">Đăng nhập</h1>
      <p className="mt-1 text-sm text-muted-foreground">Trang quản trị rootyhospitality.com</p>
      <form onSubmit={submit} noValidate className="mt-6 grid gap-4">
        <div className="grid gap-1.5">
          <label htmlFor="login-user" className="text-sm font-medium">Tên đăng nhập</label>
          <Input id="login-user" name="user" autoComplete="username" autoFocus placeholder="Nhập tên đăng nhập" className="h-12 md:h-12"
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
    </div>
  )
}

'use client'
// Đăng nhập dùng chung toàn dự án (web khách + admin): Google, hoặc email → mã 6 số gửi về email.
// - LoginPanel: khối đăng nhập (đặt thẳng trong trang, vd /admin/login).
// - LoginProvider + useLoginModal().open({ callbackUrl }): modal đăng nhập mở từ bất cứ đâu (header, bước đặt phòng).
// Chữ tự chứa (vi/en) để dùng được cả ở admin (không có next-intl). Đăng nhập xong tải lại hẳn trang `callbackUrl`.
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { signIn } from 'next-auth/react'
import { ArrowLeft, Mail } from 'lucide-react'
import { useAuthProviders, useSendCode, useVerifyCode } from '@/hooks/use-auth'
import { Dialog } from '@/components/ui/overlay'
import { Spin } from '@/components/site/spin'

type Lang = 'vi' | 'en'
const T = {
  vi: {
    title: 'Đăng nhập', google: 'Tiếp tục với Google', or: 'hoặc', email: 'Email', emailPh: 'ten@email.com', send: 'Gửi mã đăng nhập',
    sent: (e: string) => `Mã 6 số đã gửi tới ${e}. Mã có hiệu lực 10 phút.`, code: 'Mã đăng nhập', verify: 'Đăng nhập',
    resend: 'Gửi lại mã', resendIn: (s: number) => `Gửi lại mã sau ${s} giây`, change: 'Đổi email',
    err: { INVALID_EMAIL: 'Email chưa đúng.', TOO_SOON: 'Vừa gửi mã — chờ một chút rồi thử lại.', SEND_FAILED: 'Chưa gửi được email. Thử lại sau ít phút.', NOT_CONFIGURED: 'Đăng nhập chưa mở.', INVALID: 'Mã không đúng.', TOO_MANY: 'Sai quá nhiều lần. Bấm "Gửi lại mã" để nhận mã mới.', NETWORK: 'Không kết nối được. Kiểm tra mạng rồi thử lại.' } as Record<string, string>,
    left: (n: number) => ` Còn ${n} lần thử.`,
    note: 'Lần đầu đăng nhập bằng email sẽ tự tạo tài khoản.',
  },
  en: {
    title: 'Sign in', google: 'Continue with Google', or: 'or', email: 'Email', emailPh: 'you@email.com', send: 'Email me a sign-in code',
    sent: (e: string) => `A 6-digit code was sent to ${e}. It is valid for 10 minutes.`, code: 'Sign-in code', verify: 'Sign in',
    resend: 'Resend code', resendIn: (s: number) => `Resend code in ${s}s`, change: 'Use another email',
    err: { INVALID_EMAIL: 'Please check the email address.', TOO_SOON: 'A code was just sent — please wait a moment.', SEND_FAILED: 'Could not send the email. Please try again shortly.', NOT_CONFIGURED: 'Sign-in is not available yet.', INVALID: 'Incorrect code.', TOO_MANY: 'Too many attempts. Press "Resend code" for a new one.', NETWORK: 'Connection problem. Please try again.' } as Record<string, string>,
    left: (n: number) => ` ${n} attempts left.`,
    note: 'Signing in with email for the first time creates your account.',
  },
}

const INPUT = 'h-12 w-full rounded-lg border border-border-strong bg-white px-4 text-[16px] outline-none focus-visible:border-focus focus-visible:ring-4 focus-visible:ring-focus'
const BTN = 'inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-lg px-5 text-[15px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60'

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}

export function LoginPanel({ callbackUrl, lang = 'vi' }: { callbackUrl: string; lang?: Lang }) {
  const t = T[lang]
  const providers = useAuthProviders()
  const send = useSendCode()
  const verify = useVerifyCode()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [error, setError] = useState<string | null>(null)
  const [wait, setWait] = useState(0)
  const [google, setGoogle] = useState(false) // chuyển sang Google: quay tới khi rời trang
  const verifying = verify.isPending || !!verify.data?.ok
  useEffect(() => {
    if (!wait) return
    const id = setTimeout(() => setWait(w => w - 1), 1000)
    return () => clearTimeout(id)
  }, [wait])

  const sendCode = () => {
    setError(null)
    send.mutate({ email: email.trim(), callbackUrl }, {
      onSuccess: r => {
        if (r.ok) { setStep('code'); setCode(''); setWait(60) } else setError(t.err[r.error ?? 'SEND_FAILED'] ?? t.err.SEND_FAILED)
        if (r.error === 'TOO_SOON') { setStep('code'); setWait(60) }
      },
      onError: () => setError(t.err.NETWORK),
    })
  }
  const submitCode = () => {
    setError(null)
    verify.mutate({ email: email.trim(), code, callbackUrl }, {
      onSuccess: r => {
        if (r.ok) { window.location.assign(r.redirect ?? callbackUrl); return }
        setError((t.err[r.error ?? 'INVALID'] ?? t.err.INVALID) + (r.error === 'INVALID' && r.left ? t.left(r.left) : ''))
      },
      onError: () => setError(t.err.NETWORK),
    })
  }

  return (
    <div className="grid gap-4">
      {providers.data?.google && (
        <>
          <button type="button" disabled={google} onClick={() => { setGoogle(true); signIn('google', { redirectTo: callbackUrl }) }} className={`${BTN} border border-border-strong bg-white text-foreground hover:bg-item-hover`}>
            {google ? <Spin on /> : <GoogleMark />}{t.google}
          </button>
          <p className="flex items-center gap-3 text-[13px] text-muted-foreground" aria-hidden><span className="h-px flex-1 bg-border" />{t.or}<span className="h-px flex-1 bg-border" /></p>
        </>
      )}

      {step === 'email' ? (
        <form onSubmit={e => { e.preventDefault(); sendCode() }} className="grid gap-3">
          <label className="grid gap-1.5 text-[14px] font-medium">{t.email}
            <input type="email" required autoComplete="email" inputMode="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t.emailPh} className={INPUT} />
          </label>
          <button type="submit" disabled={send.isPending} className={`${BTN} bg-primary text-primary-foreground hover:bg-primary/90`}>{send.isPending ? <Spin on /> : <Mail className="size-4" aria-hidden />}{t.send}</button>
          <p className="text-[13px] text-muted-foreground">{t.note}</p>
        </form>
      ) : (
        <form onSubmit={e => { e.preventDefault(); submitCode() }} className="grid gap-3">
          <p className="text-[14px]">{t.sent(email.trim())}</p>
          <label className="grid gap-1.5 text-[14px] font-medium">{t.code}
            <input autoFocus required inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} className={`${INPUT} text-center text-2xl font-semibold tracking-[0.5em] tabular-nums`} />
          </label>
          <button type="submit" disabled={verifying || code.length !== 6} className={`${BTN} bg-primary text-primary-foreground hover:bg-primary/90`}><Spin on={verifying} />{t.verify}</button>
          <div className="flex flex-wrap items-center justify-between gap-2 text-[14px]">
            <button type="button" onClick={() => { setStep('email'); setError(null) }} className="inline-flex min-h-10 cursor-pointer items-center gap-1 text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" aria-hidden />{t.change}</button>
            <button type="button" disabled={wait > 0 || send.isPending} onClick={sendCode} className="min-h-10 cursor-pointer font-medium text-primary disabled:cursor-default disabled:text-muted-foreground">{wait > 0 ? t.resendIn(wait) : t.resend}</button>
          </div>
        </form>
      )}
      {error && <p role="alert" className="rounded-lg bg-destructive/5 px-3 py-2 text-[14px] text-destructive">{error}</p>}
    </div>
  )
}

// ---------- Modal toàn site ----------

interface LoginCtx { open: (o?: { callbackUrl?: string }) => void }
const Ctx = createContext<LoginCtx>({ open: () => {} })
export const useLoginModal = () => useContext(Ctx)

export function LoginProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  const [state, setState] = useState<{ callbackUrl: string } | null>(null)
  const open = (o?: { callbackUrl?: string }) => setState({ callbackUrl: o?.callbackUrl ?? `${window.location.pathname}${window.location.search}` })
  return (
    <Ctx.Provider value={{ open }}>
      {children}
      <Dialog open={!!state} onClose={() => setState(null)} title={T[lang].title}>
        {state && <LoginPanel callbackUrl={state.callbackUrl} lang={lang} />}
      </Dialog>
    </Ctx.Provider>
  )
}

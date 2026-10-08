'use client'
// Bước 3 — Thanh toán (BẢN MINH HOẠ): chọn cọc / trả đủ, chuyển khoản QR Vietcombank hoặc thẻ qua OnePay.
// Không có giao dịch thật: QR vẽ giả (không quét được), số tài khoản minh hoạ, bấm nút là sang trang xác nhận.
// ponytail: khi chạy thật — server tạo booking Gohost (HELD) + mã VietQR / link OnePay, IPN có chữ ký mới chuyển PAID (review §3, §4.6).
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Check, Copy, CreditCard, Landmark, PencilLine, QrCode, Timer } from 'lucide-react'
import { cn } from 'cn'
import { Link, useRouter } from '@/i18n/navigation'
import { fmtPrice, today } from '@/lib/format'
import { bookingCode, deposit, DEPOSIT_RATE } from '@/lib/booking'
import type { BookingTarget, GuestDraft, PaymentDraft } from '@/types/booking'
import { BTN, BTN_OUT, TEXT_LINK } from '@/components/site/kit'
import { useRoomOffer } from '@/components/room/use-room-offer'
import { saveDraft, useDraft } from './draft'
import { Checkbox } from './guest-form'
import { BookingMissing } from './shell'

const HOLD_SECONDS = 15 * 60 // giữ phòng chờ thanh toán (review: hết 15 phút thì huỷ booking HELD)

/** QR giả: ba ô định vị + điểm ngẫu nhiên theo mã đặt phòng. Chỉ để hình dung, không mã hoá gì. */
function MockQr({ seed }: { seed: string }) {
  const N = 29
  let h = [...seed].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7)
  const rnd = () => ((h = (h * 1103515245 + 12345) >>> 0) >>> 16) & 1
  const finder = (x: number, y: number) => (x < 7 && y < 7) || (x >= N - 7 && y < 7) || (x < 7 && y >= N - 7)
  const inFinder = (x: number, y: number) => {
    const ox = x < 7 ? 0 : N - 7, oy = y < 7 ? 0 : N - 7
    const dx = x - ox, dy = y - oy
    return dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4)
  }
  let d = ''
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const zone = (x < 8 && y < 8) || (x >= N - 8 && y < 8) || (x < 8 && y >= N - 8) // ô định vị + viền trắng quanh nó
    const dark = zone ? finder(x, y) && inFinder(x, y) : rnd() === 1
    if (dark) d += `M${x} ${y}h1v1h-1z`
  }
  return <svg viewBox={`-2 -2 ${N + 4} ${N + 4}`} className="size-full" role="img" aria-label="QR"><rect x="-2" y="-2" width={N + 4} height={N + 4} fill="#fff" /><path d={d} fill="#0b2b26" /></svg>
}

function CopyRow({ label, value, copy }: { label: string; value: string; copy?: string }) {
  const t = useTranslations('Booking')
  const [done, setDone] = useState(false)
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0"><dt className="text-[13px] text-muted-foreground">{label}</dt><dd className="font-semibold break-words tabular-nums">{value}</dd></div>
      {copy && (
        <button type="button" onClick={() => navigator.clipboard?.writeText(copy).then(() => { setDone(true); setTimeout(() => setDone(false), 1500) })}
          className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-border-strong px-3 text-[13px] font-medium text-brand hover:bg-mint" aria-label={`${t('copy')} ${label}`}>
          {done ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}{done ? t('copied') : t('copy')}
        </button>
      )}
    </div>
  )
}

function Option({ checked, onSelect, icon, title, sub, side }: { checked: boolean; onSelect: () => void; icon: React.ReactNode; title: string; sub: string; side?: string }) {
  return (
    <button type="button" role="radio" aria-checked={checked} onClick={onSelect}
      className={cn('flex cursor-pointer items-start gap-3 rounded-2xl border bg-white p-4 text-left transition-colors', checked ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-border-strong hover:bg-item-hover')}>
      <span className={cn('grid size-10 shrink-0 place-items-center rounded-lg', checked ? 'bg-primary text-primary-foreground' : 'bg-mint text-brand')}>{icon}</span>
      <span className="min-w-0 flex-1"><span className="block font-semibold text-brand">{title}</span><span className="block text-[13px] text-muted-foreground">{sub}</span></span>
      {side && <span className="shrink-0 text-right font-bold tabular-nums">{side}</span>}
    </button>
  )
}

/** Chỉ vẽ form khi đã đọc được bản nháp ở trình duyệt — mã đặt phòng (Math.random) sinh ở đó, không lúc render server. */
export function Payment({ target }: { target: BookingTarget }) {
  const t = useTranslations('Booking')
  const query = useSearchParams().toString()
  const draft = useDraft()
  if (!draft) return <div className="h-[640px] animate-pulse rounded-2xl bg-muted" />
  if (!draft.guest) return <BookingMissing title={t('noGuestTitle')} body={t('noGuestBody')} href={`/dat-phong?${query}`} cta={t('noGuestCta')} />
  return <PaymentForm target={target} guest={draft.guest} query={query} />
}

const genCode = (hotelCode: string) => bookingCode(hotelCode, today(), Math.floor(Math.random() * 10000))

function PaymentForm({ target, guest: g, query }: { target: BookingTarget; guest: GuestDraft; query: string }) {
  const t = useTranslations('Booking')
  const router = useRouter()
  const o = useRoomOffer(target.hotel, target.room)
  const [mode, setMode] = useState<PaymentDraft['mode']>('full')
  const [method, setMethod] = useState<PaymentDraft['method']>('qr')
  const [agree, setAgree] = useState(false)
  const [code, setCode] = useState(() => genCode(target.hotel.code))
  const [left, setLeft] = useState(HOLD_SECONDS)
  const newCode = () => { setCode(genCode(target.hotel.code)); setLeft(HOLD_SECONDS) }
  useEffect(() => {
    const id = setInterval(() => setLeft(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [code])

  const p = o.status === 'available' ? o.plan : undefined
  const total = p?.total ?? 0
  const pay = mode === 'deposit' ? deposit(total) : total
  const expired = left === 0
  const ready = !!p && agree && !expired

  function confirm() {
    if (!ready) return
    const payment: PaymentDraft = { code, mode, method, paid: pay, total, plan: p!.title, breakfast: p!.has_breakfast, at: new Date().toISOString() }
    saveDraft({ payment })
    router.push(`/dat-phong/xac-nhan?${query}`)
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
        <h2 className="text-xl font-bold text-brand">{t('amountTitle')}</h2>
        <div role="radiogroup" aria-label={t('amountTitle')} className="mt-4 grid gap-3 sm:grid-cols-2">
          <Option checked={mode === 'full'} onSelect={() => setMode('full')} icon={<Check className="size-5" aria-hidden />} title={t('full')} sub={t('fullSub')} side={p ? fmtPrice(total) : undefined} />
          <Option checked={mode === 'deposit'} onSelect={() => setMode('deposit')} icon={<span className="text-[13px] font-bold">{DEPOSIT_RATE * 100}%</span>} title={t('deposit', { rate: DEPOSIT_RATE * 100 })}
            sub={p ? t('depositSub', { rest: fmtPrice(total - deposit(total)) }) : t('depositNote')} side={p ? fmtPrice(deposit(total)) : undefined} />
        </div>
        {mode === 'deposit' && <p className="mt-3 text-[13px] text-muted-foreground">{t('depositNote')}</p>}
      </section>

      <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
        <h2 className="text-xl font-bold text-brand">{t('methodTitle')}</h2>
        <div role="radiogroup" aria-label={t('methodTitle')} className="mt-4 grid gap-3 sm:grid-cols-2">
          <Option checked={method === 'qr'} onSelect={() => setMethod('qr')} icon={<QrCode className="size-5" aria-hidden />} title={t('qr')} sub={t('qrSub')} />
          <Option checked={method === 'card'} onSelect={() => setMethod('card')} icon={<CreditCard className="size-5" aria-hidden />} title={t('card')} sub={t('cardSub')} />
        </div>

        {method === 'qr' ? (
          <div className="mt-5 grid gap-5 rounded-2xl bg-mint p-4 sm:grid-cols-[200px_1fr] sm:p-5">
            <div className="mx-auto w-[200px]">
              <div className={cn('relative aspect-square rounded-xl bg-white p-2.5 shadow-card', expired && 'opacity-30')}>
                <MockQr seed={`${code}${pay}`} />
                <span className="absolute inset-x-0 -bottom-3 mx-auto w-fit rounded-full bg-orange px-2.5 py-0.5 text-[12px] font-semibold text-white">{t('qrSample')}</span>
              </div>
              <p className={cn('mt-6 flex items-center justify-center gap-1.5 text-[14px] tabular-nums', left < 120 ? 'font-semibold text-orange' : 'text-muted-foreground')} aria-live="off">
                <Timer className="size-4" aria-hidden />{expired ? t('expired') : t('holdFor', { time: `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}` })}
              </p>
              {expired && <button type="button" onClick={newCode} className={`${BTN_OUT} mt-2 h-10 w-full`}>{t('newCode')}</button>}
            </div>
            <div className="min-w-0">
              <p className="flex items-center gap-2 font-semibold text-brand"><Landmark className="size-4" aria-hidden />Vietcombank (VCB)</p>
              <dl className="mt-1 divide-y divide-brand/10">
                <CopyRow label={t('accName')} value="CONG TY CP ROOTY TRIP PHU QUOC" />
                <CopyRow label={t('accNo')} value={t('accNoSample')} />
                <CopyRow label={t('amount')} value={p ? fmtPrice(pay) : '—'} copy={p ? String(pay) : undefined} />
                <CopyRow label={t('transferNote')} value={code} copy={code} />
              </dl>
              <p className="mt-2 text-[13px] text-muted-foreground">{t('qrHelp')}</p>
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-2xl bg-mint p-4 text-[14px] sm:p-5">
            <p className="font-semibold text-brand">{t('cardTitle')}</p>
            <p className="mt-1">{t('cardBody')}</p>
            <ul className="mt-3 flex flex-wrap gap-2">{['Visa', 'Mastercard', 'JCB', 'NAPAS'].map(c => <li key={c} className="rounded-md border border-border-strong bg-white px-2.5 py-1 text-[13px] font-semibold">{c}</li>)}</ul>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-brand">{t('contactTitle')}</h2>
          <Link href={`/dat-phong?${query}`} className={`${TEXT_LINK} text-[14px]`}><PencilLine className="size-4" aria-hidden />{t('edit')}</Link>
        </div>
        <dl className="mt-3 grid gap-x-6 gap-y-2 text-[14px] sm:grid-cols-2">
            <div><dt className="text-muted-foreground">{t('name')}</dt><dd className="font-medium">{g.name}</dd></div>
            <div><dt className="text-muted-foreground">{t('phone')}</dt><dd className="font-medium">{g.phone}</dd></div>
            <div><dt className="text-muted-foreground">{t('email')}</dt><dd className="font-medium break-all">{g.email}</dd></div>
            <div><dt className="text-muted-foreground">{t('guestName')}</dt><dd className="font-medium">{g.self ? g.name : g.guest}</dd></div>
          </dl>
      </section>

      <section className="grid gap-4 rounded-2xl border border-border bg-white p-5 sm:p-6">
        <Checkbox id="p-agree" checked={agree} onChange={setAgree}>
          {t.rich('agree', {
            terms: c => <Link href="/dieu-khoan-dat-phong" target="_blank" className="font-semibold text-primary underline underline-offset-2">{c}</Link>,
            cancel: c => <Link href="/chinh-sach-huy" target="_blank" className="font-semibold text-primary underline underline-offset-2">{c}</Link>,
            privacy: c => <Link href="/chinh-sach-bao-mat" target="_blank" className="font-semibold text-primary underline underline-offset-2">{c}</Link>,
          })}
        </Checkbox>
        <div className="flex items-baseline justify-between gap-3 border-t border-border pt-4">
          <span className="font-semibold">{mode === 'deposit' ? t('payNowDeposit') : t('payNow')}</span>
          <span className="text-2xl font-bold text-brand tabular-nums">{p ? fmtPrice(pay) : '—'}</span>
        </div>
        <button type="button" onClick={confirm} disabled={!ready} className={`${BTN} h-12 w-full`}>
          {method === 'qr' ? t('paidQr') : t('payCard', { amount: p ? fmtPrice(pay) : '' })}
        </button>
      </section>

      <Link href={`/dat-phong?${query}`} className={`${BTN_OUT} h-12 w-fit`}><ArrowLeft className="size-4" aria-hidden />{t('backGuest')}</Link>
    </div>
  )
}

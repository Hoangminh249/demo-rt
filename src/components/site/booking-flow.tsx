'use client'
import Link from 'next/link'
import { useEffect, useId, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Check, CreditCard, QrCode, Landmark, Hotel as HotelIcon, Timer, Minus, Plus, LoaderCircle, ShieldCheck, Info, Sparkles, ChevronUp } from 'lucide-react'
import { repo, type CreateBookingInput } from '@/lib/repo'
import type { Addon } from '@/lib/types'
import { useAsync, useDemo } from '@/store/provider'
import { parseSearch, searchToParams } from '@/lib/search-params'
import { addDays, diffDays, fmtDate, fmtRange, fmtVND, guestsLabel } from '@/lib/format'
import { DEPOSIT_RATE } from '@/lib/pricing'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge, Breadcrumb, ErrorBox, Photo, Skeleton, cn } from '../ui'
import { Dialog } from '../ui/overlay'
import { DateRangeField, GuestsField } from './stay-fields'

const STEPS = ['Phòng', 'Dịch vụ thêm', 'Thông tin', 'Thanh toán'] as const
const HOLD_SECONDS = 15 * 60
const clock = () => Date.now() // chỉ gọi trong handler/interval, không trong render
type PayMethod = CreateBookingInput['payment']['method']

/** Radio dạng card (choice-controls.md): đang chọn = viền focus + ring mờ. */
const CHOICE = 'flex cursor-pointer items-start gap-3 rounded-xl border border-border-strong bg-card p-4 transition-colors hover:bg-surface-hover has-checked:border-focus has-checked:ring-2 has-checked:ring-focus has-disabled:cursor-not-allowed has-disabled:opacity-50'
const RADIO = 'mt-0.5 size-5 shrink-0 cursor-pointer appearance-none rounded-full border-[1.5px] border-border-strong bg-card transition-[border-color,border-width] checked:border-[6px] checked:border-primary disabled:cursor-not-allowed'

function FieldRow({ label, error, required, children, className, htmlFor }: { label: string; error?: string; required?: boolean; children: React.ReactNode; className?: string; htmlFor: string }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="w-fit cursor-pointer text-sm font-medium">{label}{required && <span className="text-red-600"> *</span>}</label>
      {children}
      <p className="min-h-4 text-xs text-red-600" aria-live="polite">{error}</p>
    </div>
  )
}

export function BookingFlow({ slug }: { slug: string }) {
  const sp = useSearchParams()
  const router = useRouter()
  const s0 = parseSearch(sp)
  const { overlay } = useDemo()
  const me = overlay.session.customerId ? repo.customerBrief(overlay.session.customerId) : null
  const uid = useId()

  const [step, setStep] = useState(0)
  const [stay, setStay] = useState({ checkin: s0.checkin, checkout: s0.checkout, adults: s0.adults, children: s0.children, rooms: s0.rooms, ages: s0.ages })
  const [roomId, setRoomId] = useState(sp.get('room') ?? '')
  const [planId, setPlanId] = useState(sp.get('plan') ?? '')
  const [addons, setAddons] = useState<Record<string, number>>({})
  const [honeymoon, setHoneymoon] = useState(s0.promo === 'honeymoon')
  const [guest, setGuest] = useState({ name: me?.name ?? '', phone: me?.phone ?? '', email: me?.email ?? '', nationality: me?.nationality ?? 'Việt Nam', notes: '', arrival: '14:00' })
  const [invoice, setInvoice] = useState({ on: false, company: '', tax_code: '', address: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pay, setPay] = useState<{ method: PayMethod; mode: 'deposit' | 'full'; outcome: 'ok' | 'fail' }>({ method: 'card', mode: 'full', outcome: 'ok' })
  const [holdStart, setHoldStart] = useState<number | null>(null)
  const [now, setNow] = useState(0)
  const [state, setState] = useState<'idle' | 'processing' | 'failed'>('idle')
  const [submitError, setSubmitError] = useState('')
  const [summaryOpen, setSummaryOpen] = useState(false)

  const hotel = useAsync(() => repo.getHotel(slug), [slug])
  const h = hotel.data
  const offers = useAsync(() => (h ? repo.hotelOffers(h.id, { ...stay }) : Promise.resolve(null)), [h?.id, stay])
  const allAddons = useAsync(() => repo.listAddons(), [])
  const promos = useAsync(() => repo.listPromotions(), [])
  const honeymoonPromo = promos.data?.find(p => p.type === 'honeymoon' && h && (p.hotel_ids === 'all' || p.hotel_ids.includes(h.id)))
  const offer = offers.data?.find(o => o.rt.room_type_id === roomId)
  const plan = offer?.plans.find(p => p.plan.rate_plan_id === planId)?.plan
  const quoteInput = roomId && planId ? { room_type_id: roomId, rate_plan_id: planId, ...stay, addons: Object.entries(addons).map(([addon_id, qty]) => ({ addon_id, qty })), chosenPromoId: honeymoon ? honeymoonPromo?.id : undefined } : null
  const q = useAsync(() => (quoteInput ? repo.quote(quoteInput) : Promise.resolve(null)), [quoteInput, overlay.session.customerId])

  useEffect(() => {
    if (holdStart == null) return
    const t = setInterval(() => setNow(clock()), 1000)
    return () => clearInterval(t)
  }, [holdStart])
  const remaining = holdStart == null ? HOLD_SECONDS : Math.max(0, HOLD_SECONDS - Math.floor(((now || holdStart) - holdStart) / 1000))
  const expired = holdStart != null && remaining === 0
  const mmss = `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`

  if (!h) return <div className="mx-auto max-w-6xl space-y-4 px-4 py-8 sm:px-6"><Skeleton className="h-10 w-80" /><Skeleton className="h-96" /></div>

  const nights = diffDays(stay.checkin, stay.checkout)
  const bump = (a: Addon, d: number) => setAddons(x => ({ ...x, [a.id]: Math.max(0, (x[a.id] ?? 0) + d) }))
  const canNext0 = !!offer && !!plan && offer.fits && offer.left >= stay.rooms
  const hasTransfer = !!addons['AD-TRF']
  const hasTour = ['AD-T4D', 'AD-TBD', 'AD-TCM'].some(k => addons[k])

  function validate() {
    const e: Record<string, string> = {}
    if (guest.name.trim().length < 2) e.name = 'Chưa nhập họ tên'
    else if (guest.name.length > 50) e.name = 'Họ tên tối đa 50 ký tự'
    if (!/^(\+?\d[\d\s]{7,14})$/.test(guest.phone.trim())) e.phone = 'Số điện thoại chưa đúng'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest.email.trim())) e.email = 'Email chưa đúng'
    if (invoice.on && !invoice.company.trim()) e.company = 'Chưa nhập tên công ty'
    if (invoice.on && !/^\d{10}(-\d{3})?$/.test(invoice.tax_code)) e.tax = 'Mã số thuế gồm 10 số'
    setErrors(e)
    return !Object.keys(e).length
  }

  function go(n: number) {
    if (n === 3 && holdStart == null) { const t = clock(); setHoldStart(t); setNow(t) }
    setStep(n)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function submit() {
    if (!quoteInput || expired || state === 'processing') return
    setState('processing')
    setSubmitError('')
    await new Promise(r => setTimeout(r, 1200)) // giả lập cổng thanh toán
    if (pay.outcome === 'fail' && (pay.method === 'card' || pay.method === 'qr')) { setState('failed'); return }
    try {
      const b = await repo.createBooking({
        ...quoteInput, child_ages: stay.ages,
        guest: { name: guest.name.trim(), phone: guest.phone.trim(), email: guest.email.trim(), nationality: guest.nationality },
        notes: guest.notes, arrival_hour: guest.arrival,
        invoice: invoice.on ? { company: invoice.company, tax_code: invoice.tax_code, address: invoice.address } : undefined,
        payment: { method: pay.method, mode: pay.mode }, channel: 'website', created_by: 'Khách (website)', customer_id: overlay.session.customerId,
      })
      router.push(`/dat-phong/xac-nhan/${b.code}`)
    } catch (e) {
      setState('idle')
      setSubmitError((e as Error).message)
    }
  }

  const payAmount = q.data ? (pay.mode === 'full' || pay.method === 'transfer' || pay.method === 'hotel' ? q.data.total : q.data.deposit) : 0

  const summary = (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex gap-3 p-4 sm:p-5">
        <Photo src={offer?.rt.image ?? h.cover} alt="" className="size-20 shrink-0 rounded-xl" sizes="80px" />
        <div className="min-w-0">
          <p className="text-base font-semibold">{h.name}</p>
          <p className="text-sm text-muted-foreground">{offer?.rt.name ?? 'Chưa chọn phòng'}{plan ? ` · ${plan.has_breakfast ? 'có ăn sáng' : 'chỉ phòng'}` : ''}</p>
          <p className="mt-1 text-sm text-muted-foreground">{fmtRange(stay.checkin, stay.checkout)} · {nights} đêm</p>
          <p className="text-sm text-muted-foreground">{guestsLabel(stay.adults, stay.children)} · {stay.rooms} phòng</p>
        </div>
      </div>
      {!q.data ? (quoteInput ? <div className="px-5 pb-5"><Skeleton className="h-32" /></div> : null) : (
        <div className={cn('space-y-2 border-t border-border p-4 text-sm transition-opacity sm:p-5', q.loading && 'opacity-60')}>
          {q.data.days_breakdown.map(d => <Line key={d.day} k={`Đêm ${fmtDate(d.day)}${stay.rooms > 1 ? ` × ${stay.rooms}` : ''}`} v={fmtVND(d.price * stay.rooms)} />)}
          {q.data.promo && <Line tone="ok" k={`Ưu đãi ${q.data.promo.name.split('–')[0].trim()} (−${q.data.promo.discount_pct}%)`} v={`−${fmtVND(q.data.promo_discount)}`} />}
          {q.data.member_discount > 0 && <Line tone="ok" k="Giá thành viên (−5%)" v={`−${fmtVND(q.data.member_discount)}`} />}
          {q.data.addons.map(a => <Line key={a.addon_id} k={`${a.name} × ${a.qty}`} v={fmtVND(a.total)} />)}
          <div className="flex items-baseline justify-between gap-2 border-t border-border pt-3"><span className="font-semibold">Tổng cộng</span><span className="text-lg font-semibold tabular-nums">{fmtVND(q.data.total)}</span></div>
          <p className="text-xs text-muted-foreground">Đã gồm thuế & phí · đặt cọc {DEPOSIT_RATE * 100}%: {fmtVND(q.data.deposit)}</p>
        </div>
      )}
    </div>
  )

  const footer = (back: number | null, next: React.ReactNode) => (
    <div className="flex items-center justify-between gap-3 border-t border-border pt-5">
      {back != null ? <Button variant="ghost" onClick={() => go(back)} disabled={state === 'processing'}>Quay lại</Button> : <span />}
      {next}
    </div>
  )

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 pb-28 sm:px-6 lg:pb-10">
      <Breadcrumb items={[{ label: 'Trang chủ', href: '/' }, { label: h.name, href: `/${slug}?${searchToParams({ ...stay })}` }, { label: 'Đặt phòng' }]} />
      <h1 className="text-xl font-semibold">Đặt phòng {h.name}</h1>
      <ol className="scrollbar-clean mt-4 mb-6 flex items-center gap-2 overflow-x-auto" aria-label="Các bước đặt phòng">
        {STEPS.map((label, i) => (
          <li key={label} className="flex shrink-0 items-center gap-2" aria-current={i === step ? 'step' : undefined}>
            <span className={cn('grid size-7 place-items-center rounded-full text-xs font-semibold', i < step ? 'bg-accent text-accent-foreground' : i === step ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground')}>{i < step ? <Check className="size-4" aria-hidden /> : i + 1}</span>
            <span className={cn('text-sm', i === step ? 'font-semibold text-foreground' : 'hidden text-muted-foreground sm:inline')}>{label}</span>
            {i < STEPS.length - 1 && <span className="mx-1 h-px w-4 bg-border-strong sm:w-10" aria-hidden />}
          </li>
        ))}
      </ol>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 rounded-2xl border border-border bg-card p-4 sm:p-6">
          {step === 0 && (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <DateRangeField id={`${uid}-d`} checkin={stay.checkin} checkout={stay.checkout} onChange={r => setStay(x => ({ ...x, ...r }))} />
                <GuestsField id={`${uid}-g`} party={{ adults: stay.adults, children: stay.children, ages: stay.ages, rooms: stay.rooms }} onChange={p => setStay(x => ({ ...x, ...p }))} />
              </div>
              <fieldset>
                <legend className="mb-3 text-base font-semibold">Hạng phòng & gói giá</legend>
                {!offers.data ? <div className="space-y-3"><Skeleton className="h-24" /><Skeleton className="h-24" /></div> : (
                  <div className="space-y-3">
                    {offers.data.flatMap(o => o.plans.map(p => {
                      const ok = o.fits && o.left >= stay.rooms
                      return (
                        <label key={p.plan.rate_plan_id} className={CHOICE}>
                          <input type="radio" name="plan" className={RADIO} disabled={!ok} checked={roomId === o.rt.room_type_id && planId === p.plan.rate_plan_id} onChange={() => { setRoomId(o.rt.room_type_id); setPlanId(p.plan.rate_plan_id) }} />
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-medium">{o.rt.name} · {p.plan.has_breakfast ? 'Phòng + ăn sáng' : 'Chỉ phòng'}</span>
                            <span className="mt-0.5 block text-sm text-muted-foreground">{p.plan.free_cancel_days ? `Huỷ miễn phí trước ${fmtDate(addDays(stay.checkin, -p.plan.free_cancel_days))}` : 'Không hoàn huỷ'} · {!o.fits ? `tối đa ${o.rt.max_adults} người lớn + ${o.rt.max_children} trẻ em/phòng` : o.left >= stay.rooms ? `còn ${o.left} phòng` : o.left ? `chỉ còn ${o.left} phòng` : 'hết phòng'}</span>
                          </span>
                          <span className="shrink-0 text-right"><span className="block text-base font-semibold tabular-nums">{fmtVND(p.nightly)}</span><span className="block text-xs text-muted-foreground">/ đêm</span></span>
                        </label>
                      )
                    }))}
                  </div>
                )}
              </fieldset>
              {offers.data && !offers.data.some(o => o.fits && o.left >= stay.rooms) && <ErrorBox>Hết phòng phù hợp cho ngày này. Đổi ngày hoặc <Link href={`/tim-kiem?${searchToParams({ ...stay, dest: '' })}`} className="font-medium underline">xem khách sạn khác</Link>.</ErrorBox>}
              {footer(null, <Button variant="default" className="min-h-11 md:min-h-10" disabled={!canNext0} onClick={() => go(1)}>Tiếp tục</Button>)}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-semibold">Thêm dịch vụ cho chuyến đi</h2>
                <p className="mt-1 text-sm text-muted-foreground">Xe sân bay, tour Rooty Trip, du thuyền RIVUS, spa — đặt cùng phòng, thanh toán một lần. Không bắt buộc.</p>
              </div>
              {q.data?.promo?.type === 'package'
                ? <p className="flex items-center gap-2 rounded-xl bg-ok-bg px-4 py-3 text-sm text-ok"><Sparkles className="size-4 shrink-0" aria-hidden />Đã áp ưu đãi Package −12% giá phòng vì có xe sân bay và tour.</p>
                : <p className="flex items-center gap-2 rounded-xl bg-info-bg px-4 py-3 text-sm text-info"><Info className="size-4 shrink-0" aria-hidden />{hasTransfer && !hasTour ? 'Thêm 1 tour Rooty Trip nữa để được ưu đãi Package −12% giá phòng.' : 'Thêm xe sân bay + 1 tour Rooty Trip để được ưu đãi Package −12% giá phòng.'}</p>}
              {!allAddons.data ? <div className="space-y-3"><Skeleton className="h-20" /><Skeleton className="h-20" /></div> : (
                <ul className="divide-y divide-border rounded-xl border border-border">
                  {allAddons.data.map(a => {
                    const qty = addons[a.id] ?? 0
                    return (
                      <li key={a.id} className="flex flex-wrap items-center gap-3 p-3 sm:gap-4 sm:p-4">
                        <Photo src={a.image} alt="" className="size-16 shrink-0 rounded-xl" sizes="64px" />
                        <div className="min-w-0 flex-1 basis-48">
                          <p className="flex flex-wrap items-center gap-2 text-sm font-medium">{a.name}<Badge tone={a.provider === 'RIVUS' ? 'info' : a.provider === 'Rooty Trip' ? 'brand' : 'neutral'}>{a.provider}</Badge></p>
                          <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{a.desc}</p>
                          <p className="mt-0.5 text-sm tabular-nums">{fmtVND(a.price)}<span className="text-muted-foreground"> / {a.unit === 'trip' ? (a.category === 'transfer' ? 'chiều' : 'chuyến') : 'người lớn'}{a.child_price ? ` · trẻ em ${fmtVND(a.child_price)}` : ''}</span></p>
                        </div>
                        <div className="ml-auto flex h-10 items-center rounded-xl border border-border-strong bg-card">
                          <button type="button" aria-label={`Bớt ${a.name}`} disabled={!qty} onClick={() => bump(a, -1)} className="m-1 grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-foreground/5 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"><Minus className="size-4" /></button>
                          <span className="w-6 text-center text-sm font-semibold tabular-nums" aria-live="polite">{qty}</span>
                          <button type="button" aria-label={`Thêm ${a.name}`} onClick={() => bump(a, 1)} className="m-1 grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-foreground/5 hover:text-foreground"><Plus className="size-4" /></button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
              {honeymoonPromo && (
                <label className="flex w-fit cursor-pointer items-center gap-3 text-sm">
                  <Checkbox checked={honeymoon} onCheckedChange={v => setHoneymoon(v === true)} className="size-5 rounded-md border-border-strong data-[state=checked]:border-primary data-[state=checked]:bg-primary" />
                  Chuyến đi trăng mật — áp ưu đãi Honeymoon (−10%, trang trí phòng)
                </label>
              )}
              {footer(0, <Button variant="default" className="min-h-11 md:min-h-10" onClick={() => go(2)}>Tiếp tục</Button>)}
            </div>
          )}

          {step === 2 && (
            <form noValidate onSubmit={e => { e.preventDefault(); if (validate()) go(3) }} className="space-y-4">
              <h2 className="text-base font-semibold">Thông tin khách</h2>
              {me ? <p className="rounded-xl bg-accent px-4 py-3 text-sm text-accent-foreground">Đã điền từ tài khoản {me.name} (hạng {me.tier}). Giá thành viên −5% đã áp.</p>
                : <p className="text-sm text-muted-foreground">Đã là thành viên? <Link href="/thanh-vien" className="font-medium text-foreground underline-offset-4 hover:underline">Đăng nhập</Link> để giảm thêm 5%.</p>}
              <div className="grid gap-x-4 sm:grid-cols-2">
                <FieldRow htmlFor={`${uid}-name`} label="Họ tên" required error={errors.name}><Input id={`${uid}-name`} autoComplete="name" value={guest.name} onChange={e => setGuest({ ...guest, name: e.target.value })} aria-invalid={!!errors.name} /></FieldRow>
                <FieldRow htmlFor={`${uid}-phone`} label="Số điện thoại" required error={errors.phone}><Input id={`${uid}-phone`} type="tel" autoComplete="tel" value={guest.phone} onChange={e => setGuest({ ...guest, phone: e.target.value })} aria-invalid={!!errors.phone} /></FieldRow>
                <FieldRow htmlFor={`${uid}-email`} label="Email" required error={errors.email}><Input id={`${uid}-email`} type="email" autoComplete="email" value={guest.email} onChange={e => setGuest({ ...guest, email: e.target.value })} aria-invalid={!!errors.email} /></FieldRow>
                <FieldRow htmlFor={`${uid}-nat`} label="Quốc tịch">
                  <Select value={guest.nationality} onValueChange={v => setGuest({ ...guest, nationality: v })}>
                    <SelectTrigger id={`${uid}-nat`}><SelectValue /></SelectTrigger>
                    <SelectContent>{['Việt Nam', 'Hàn Quốc', 'Nhật Bản', 'Trung Quốc', 'Nga', 'Khác'].map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                  </Select>
                </FieldRow>
                <FieldRow htmlFor={`${uid}-arr`} label="Giờ đến dự kiến">
                  <Select value={guest.arrival} onValueChange={v => setGuest({ ...guest, arrival: v })}>
                    <SelectTrigger id={`${uid}-arr`}><SelectValue /></SelectTrigger>
                    <SelectContent>{['12:00', '14:00', '16:00', '18:00', '20:00', '22:00', 'Sau 22:00'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </FieldRow>
                <FieldRow htmlFor={`${uid}-note`} label="Yêu cầu đặc biệt" className="sm:col-span-2"><Textarea id={`${uid}-note`} value={guest.notes} onChange={e => setGuest({ ...guest, notes: e.target.value })} placeholder="Tầng cao, giường phụ, kỷ niệm ngày cưới…" /></FieldRow>
              </div>
              <label className="flex w-fit cursor-pointer items-center gap-3 text-sm">
                <Checkbox checked={invoice.on} onCheckedChange={v => setInvoice({ ...invoice, on: v === true })} className="size-5 rounded-md border-border-strong data-[state=checked]:border-primary data-[state=checked]:bg-primary" />
                Xuất hoá đơn công ty
              </label>
              {invoice.on && (
                <div className="grid gap-x-4 sm:grid-cols-3">
                  <FieldRow htmlFor={`${uid}-co`} label="Tên công ty" required error={errors.company}><Input id={`${uid}-co`} value={invoice.company} onChange={e => setInvoice({ ...invoice, company: e.target.value })} aria-invalid={!!errors.company} /></FieldRow>
                  <FieldRow htmlFor={`${uid}-tax`} label="Mã số thuế" required error={errors.tax}><Input id={`${uid}-tax`} inputMode="numeric" value={invoice.tax_code} onChange={e => setInvoice({ ...invoice, tax_code: e.target.value })} aria-invalid={!!errors.tax} /></FieldRow>
                  <FieldRow htmlFor={`${uid}-addr`} label="Địa chỉ"><Input id={`${uid}-addr`} value={invoice.address} onChange={e => setInvoice({ ...invoice, address: e.target.value })} /></FieldRow>
                </div>
              )}
              {footer(1, <Button type="submit" variant="default" className="min-h-11 md:min-h-10">Tiếp tục</Button>)}
            </form>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-base font-semibold">Thanh toán</h2>
                <span className={cn('inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-medium tabular-nums', remaining < 120 ? 'bg-danger-bg text-danger' : 'bg-warn-bg text-warn')} role="timer">
                  <Timer className="size-4" aria-hidden />Giữ phòng {mmss}
                </span>
              </div>
              {expired ? (
                <ErrorBox>Hết 15 phút giữ phòng, phòng đã trả lại kho. <button type="button" className="font-semibold underline" onClick={() => { const t = clock(); setHoldStart(t); setNow(t) }}>Kiểm tra lại và giữ phòng</button></ErrorBox>
              ) : (
                <>
                  <fieldset>
                    <legend className="mb-3 text-sm font-medium">Phương thức</legend>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {([['card', CreditCard, 'Thẻ quốc tế', 'Visa, Master, JCB'], ['qr', QrCode, 'QR / VNPay', 'Quét bằng app ngân hàng'], ['transfer', Landmark, 'Chuyển khoản', 'Giữ chỗ 24 giờ chờ xác nhận'], ['hotel', HotelIcon, 'Trả tại khách sạn', 'Thanh toán khi nhận phòng']] as const).map(([v, Icon, label, sub]) => (
                        <label key={v} className={CHOICE}>
                          <input type="radio" name="pay" className={RADIO} checked={pay.method === v} onChange={() => setPay({ ...pay, method: v, mode: v === 'hotel' || v === 'transfer' ? 'full' : pay.mode })} />
                          <span className="min-w-0 flex-1"><span className="block text-sm font-medium">{label}</span><span className="block text-sm text-muted-foreground">{sub}</span></span>
                          <Icon className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  {(pay.method === 'card' || pay.method === 'qr') && (
                    <fieldset>
                      <legend className="mb-3 text-sm font-medium">Số tiền</legend>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {([['full', 'Thanh toán toàn bộ', q.data?.total], ['deposit', `Đặt cọc ${DEPOSIT_RATE * 100}%`, q.data?.deposit]] as const).map(([v, label, amt]) => (
                          <label key={v} className={CHOICE}>
                            <input type="radio" name="mode" className={RADIO} checked={pay.mode === v} onChange={() => setPay({ ...pay, mode: v })} />
                            <span className="min-w-0 flex-1 text-sm font-medium">{label}</span>
                            <span className="text-sm font-semibold tabular-nums">{amt ? fmtVND(amt) : '…'}</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  )}
                  <div className="rounded-xl bg-muted p-4 text-sm">
                    {pay.method === 'card' && <p className="flex items-start gap-2"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-ok" aria-hidden />Cổng thanh toán giả lập — bản demo không nhập số thẻ.</p>}
                    {pay.method === 'qr' && <div className="flex items-center gap-4"><div className="grid size-20 shrink-0 place-items-center rounded-xl bg-white"><QrCode className="size-14 text-black" aria-hidden /></div><p>Quét mã VNPay (giả lập) để trả {fmtVND(payAmount)}.</p></div>}
                    {pay.method === 'transfer' && <p>Chuyển khoản tới <b>CTCP Rooty Trip Phú Quốc</b> · STK 0000 0000 (giả lập) · nội dung là mã booking. Booking ở trạng thái <b>Mới</b> cho tới khi kế toán xác nhận.</p>}
                    {pay.method === 'hotel' && <p>Không thu tiền trước. Khách sạn giữ phòng tới 18:00 ngày nhận phòng.</p>}
                    {(pay.method === 'card' || pay.method === 'qr') && (
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-muted-foreground">
                        <span id={`${uid}-out`}>Kết quả giả lập</span>
                        <Select value={pay.outcome} onValueChange={v => setPay({ ...pay, outcome: v as 'ok' | 'fail' })}>
                          <SelectTrigger aria-labelledby={`${uid}-out`} className="h-9 w-40 md:h-9"><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="ok">Thành công</SelectItem><SelectItem value="fail">Thất bại</SelectItem></SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  {state === 'failed' && <ErrorBox>Thanh toán không thành công (giả lập: ngân hàng từ chối). Phòng vẫn được giữ {mmss}. Đổi phương thức hoặc kết quả giả lập rồi bấm <b>Thử lại</b>.</ErrorBox>}
                  {submitError && <ErrorBox>{submitError}</ErrorBox>}
                  {plan && <p className="text-sm text-muted-foreground">{plan.free_cancel_days ? `Huỷ miễn phí trước ${fmtDate(addDays(stay.checkin, -plan.free_cancel_days))}, sau đó không hoàn tiền.` : 'Gói này không hoàn huỷ.'} Bấm thanh toán là đồng ý chính sách của khách sạn.</p>}
                  {footer(2, (
                    <Button variant="default" className="relative min-h-11 md:min-h-10" onClick={submit} aria-busy={state === 'processing' || undefined} aria-disabled={state === 'processing' || !q.data || undefined}>
                      {state === 'processing' && <LoaderCircle className="absolute inset-0 m-auto size-4 animate-spin" aria-hidden />}
                      <span className={cn(state === 'processing' && 'invisible')}>{state === 'failed' ? 'Thử lại' : pay.method === 'card' || pay.method === 'qr' ? `Thanh toán ${fmtVND(payAmount)}` : 'Xác nhận đặt phòng'}</span>
                    </Button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
        <aside className="hidden lg:block"><div className="sticky top-32">{summary}</div></aside>
      </div>

      {/* Mobile: tổng tiền ở thanh dưới, bấm mở chi tiết */}
      <div className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card px-4 py-3 lg:hidden">
        <button type="button" onClick={() => setSummaryOpen(true)} className="flex w-full items-center justify-between gap-3 text-left">
          <span><span className="block text-xs text-muted-foreground">Tổng cộng · {nights} đêm</span><span className="block text-base font-semibold tabular-nums">{q.data ? fmtVND(q.data.total) : '—'}</span></span>
          <span className="flex items-center gap-1 text-sm font-medium">Chi tiết<ChevronUp className="size-4" aria-hidden /></span>
        </button>
      </div>
      <Dialog open={summaryOpen} onClose={() => setSummaryOpen(false)} title="Chi tiết giá" side="bottom">{summary}</Dialog>
    </div>
  )
}

function Line({ k, v, tone }: { k: string; v: string; tone?: 'ok' }) {
  return <div className={cn('flex justify-between gap-3', tone === 'ok' ? 'text-ok' : 'text-muted-foreground')}><span>{k}</span><span className="shrink-0 tabular-nums text-foreground">{v}</span></div>
}

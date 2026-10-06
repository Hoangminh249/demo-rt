'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Check, Coffee, CreditCard, QrCode, Landmark, Hotel as HotelIcon, Timer, Minus, Plus, Car, Compass, Ship, Sparkles, Loader2, ShieldCheck } from 'lucide-react'
import { repo, type CreateBookingInput } from '@/lib/repo'
import type { Addon } from '@/lib/types'
import { useAsync, useDemo } from '@/store/provider'
import { parseSearch, searchToParams } from '@/lib/search-params'
import { addDays, diffDays, fmtDate, fmtRange, fmtVND, guestsLabel, roomsLeft, TODAY } from '@/lib/format'
import { DEPOSIT_RATE } from '@/lib/pricing'
import { Badge, Breadcrumb, Button, Card, ErrorBox, Field, Input, Photo, Select, Skeleton, SkeletonList, Textarea, cn } from '../ui'

const STEPS = ['Phòng', 'Dịch vụ thêm', 'Thông tin khách', 'Thanh toán'] as const
const HOLD_SECONDS = 15 * 60
const CAT_ICON = { transfer: Car, tour: Compass, rivus: Ship, spa: Sparkles, dining: Coffee }

type PayMethod = CreateBookingInput['payment']['method']

export function BookingFlow({ slug }: { slug: string }) {
  const sp = useSearchParams()
  const router = useRouter()
  const s0 = parseSearch(sp)
  const { overlay } = useDemo()
  const me = overlay.session.customerId ? repo.customerBrief(overlay.session.customerId) : null

  const [step, setStep] = useState(0)
  const [stay, setStay] = useState({ checkin: s0.checkin, checkout: s0.checkout, adults: s0.adults, children: s0.children, rooms: s0.rooms, ages: s0.ages })
  const [roomId, setRoomId] = useState(sp.get('room') ?? '')
  const [planId, setPlanId] = useState(sp.get('plan') ?? '')
  const [addons, setAddons] = useState<Record<string, number>>({})
  const [honeymoon, setHoneymoon] = useState(s0.promo === 'honeymoon')
  const [guest, setGuest] = useState({ name: me?.name ?? '', phone: me?.phone ?? '', email: me?.email ?? '', nationality: me?.nationality ?? 'Việt Nam', notes: '', arrival: '14:00' })
  const [invoice, setInvoice] = useState<{ on: boolean; company: string; tax_code: string; address: string }>({ on: false, company: '', tax_code: '', address: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pay, setPay] = useState<{ method: PayMethod; mode: 'deposit' | 'full'; outcome: 'ok' | 'fail' }>({ method: 'card', mode: 'full', outcome: 'ok' })
  const [holdStart, setHoldStart] = useState<number | null>(null)
  const [now, setNow] = useState(0)
  const [state, setState] = useState<'idle' | 'processing' | 'failed'>('idle')
  const [submitError, setSubmitError] = useState('')

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
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [holdStart])
  const remaining = holdStart == null ? HOLD_SECONDS : Math.max(0, HOLD_SECONDS - Math.floor(((now || holdStart) - holdStart) / 1000))
  const expired = holdStart != null && remaining === 0
  const mmss = `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`

  if (!h) return <div className="mx-auto max-w-6xl px-4 py-8"><SkeletonList /></div>

  const nights = diffDays(stay.checkin, stay.checkout)
  const bump = (a: Addon, d: number) => setAddons(x => ({ ...x, [a.id]: Math.max(0, (x[a.id] ?? 0) + d) }))
  const canNext0 = !!offer && !!plan && offer.fits && offer.left >= stay.rooms

  function validate() {
    const e: Record<string, string> = {}
    if (guest.name.trim().length < 2) e.name = 'Nhập họ tên'
    if (guest.name.length > 50) e.name = 'Tối đa 50 ký tự'
    if (!/^(\+?\d[\d\s]{7,14})$/.test(guest.phone.trim())) e.phone = 'Số điện thoại không hợp lệ'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest.email.trim())) e.email = 'Email không hợp lệ'
    if (invoice.on && (!invoice.company || !/^\d{10}(-\d{3})?$/.test(invoice.tax_code))) e.invoice = 'Nhập tên công ty và MST 10 số'
    setErrors(e)
    return !Object.keys(e).length
  }

  function go(n: number) {
    if (n === 3 && holdStart == null) { setHoldStart(Date.now()); setNow(Date.now()) }
    setStep(n)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function submit() {
    if (!quoteInput || expired) return
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

  const summary = (
    <Card className="overflow-hidden">
      <Photo src={offer?.rt.image ?? h.cover} alt={offer?.rt.name ?? h.name} className="aspect-[16/9]" sizes="380px" />
      <div className="space-y-3 p-4 text-sm">
        <div><p className="font-semibold">{h.name}</p><p className="text-muted">{offer?.rt.name ?? 'Chưa chọn phòng'}{plan ? ` · ${plan.has_breakfast ? 'Breakfast Included' : 'Room Only'}` : ''}</p></div>
        <p className="text-muted">{fmtRange(stay.checkin, stay.checkout)} · {nights} đêm · {guestsLabel(stay.adults, stay.children)} · {stay.rooms} phòng</p>
        {!q.data ? (quoteInput ? <Skeleton className="h-32" /> : null) : (
          <div className={cn('space-y-1 border-t border-border pt-3', q.loading && 'opacity-60')}>
            {q.data.days_breakdown.map(d => <Row key={d.day} k={`Đêm ${fmtDate(d.day)}${stay.rooms > 1 ? ` × ${stay.rooms}` : ''}`} v={fmtVND(d.price * stay.rooms)} />)}
            {q.data.promo && <Row k={`Ưu đãi ${q.data.promo.name.split('–')[0].trim()} (−${q.data.promo.discount_pct}%)`} v={`−${fmtVND(q.data.promo_discount)}`} tone="ok" />}
            {q.data.member_discount > 0 && <Row k="Giá thành viên (−5%)" v={`−${fmtVND(q.data.member_discount)}`} tone="ok" />}
            {q.data.addons.map(a => <Row key={a.addon_id} k={`${a.name} × ${a.qty}`} v={fmtVND(a.total)} />)}
            <div className="flex justify-between border-t border-border pt-2 text-base font-bold"><span>Tổng cộng</span><span>{fmtVND(q.data.total)}</span></div>
            <p className="text-xs text-muted">Đã gồm thuế & phí. Đặt cọc {DEPOSIT_RATE * 100}%: {fmtVND(q.data.deposit)}</p>
            {!q.data.promo && addons['AD-TRF'] && !Object.keys(addons).some(k => k.startsWith('AD-T') && k !== 'AD-TRF' && addons[k]) && <p className="rounded-md bg-mint px-2 py-1 text-xs text-brand dark:text-accent">Thêm 1 tour Rooty Trip để được ưu đãi Package −12%</p>}
          </div>
        )}
      </div>
    </Card>
  )

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <Breadcrumb items={[{ label: 'Trang chủ', href: '/' }, { label: h.name, href: `/${slug}?${searchToParams({ ...stay })}` }, { label: 'Đặt phòng' }]} />
      <ol className="mb-6 flex items-center gap-2 overflow-x-auto text-sm" aria-label="Các bước đặt phòng">
        {STEPS.map((label, i) => (
          <li key={label} className="flex shrink-0 items-center gap-2" aria-current={i === step ? 'step' : undefined}>
            <span className={cn('grid size-7 place-items-center rounded-full text-xs font-bold', i < step ? 'bg-ok text-white' : i === step ? 'bg-primary text-white' : 'bg-surface-2 text-muted')}>{i < step ? <Check className="size-4" /> : i + 1}</span>
            <span className={cn(i === step ? 'font-semibold' : 'text-muted')}>{label}</span>
            {i < STEPS.length - 1 && <span className="h-px w-6 bg-border" />}
          </li>
        ))}
      </ol>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          {step === 0 && (
            <Card className="space-y-4 p-5">
              <h2 className="text-lg font-bold">Chọn phòng & ngày</h2>
              <div className="grid gap-3 sm:grid-cols-5">
                <Field label="Nhận phòng"><Input type="date" min={TODAY} value={stay.checkin} onChange={e => e.target.value && setStay(x => ({ ...x, checkin: e.target.value, checkout: x.checkout > e.target.value ? x.checkout : addDays(e.target.value, 1) }))} /></Field>
                <Field label="Trả phòng"><Input type="date" min={addDays(stay.checkin, 1)} value={stay.checkout} onChange={e => e.target.value && setStay(x => ({ ...x, checkout: e.target.value }))} /></Field>
                <Field label="Người lớn"><Select value={stay.adults} onChange={e => setStay(x => ({ ...x, adults: +e.target.value }))}>{[1, 2, 3, 4, 5, 6, 7, 8].map(n => <option key={n}>{n}</option>)}</Select></Field>
                <Field label="Trẻ em"><Select value={stay.children} onChange={e => setStay(x => ({ ...x, children: +e.target.value, ages: Array(+e.target.value).fill(6) }))}>{[0, 1, 2, 3, 4].map(n => <option key={n}>{n}</option>)}</Select></Field>
                <Field label="Số phòng"><Select value={stay.rooms} onChange={e => setStay(x => ({ ...x, rooms: +e.target.value }))}>{[1, 2, 3, 4].map(n => <option key={n}>{n}</option>)}</Select></Field>
              </div>
              {!offers.data ? <SkeletonList rows={2} /> : (
                <div className="space-y-2" role="radiogroup" aria-label="Hạng phòng và gói giá">
                  {offers.data.map(o => o.plans.map(p => {
                    const ok = o.fits && o.left >= stay.rooms
                    const checked = roomId === o.rt.room_type_id && planId === p.plan.rate_plan_id
                    return (
                      <label key={p.plan.rate_plan_id} className={cn('flex cursor-pointer items-center gap-3 rounded-xl border p-3', checked ? 'border-primary bg-mint/60' : 'border-border', !ok && 'cursor-not-allowed opacity-50')}>
                        <input type="radio" name="plan" className="size-4 accent-[var(--primary)]" disabled={!ok} checked={checked} onChange={() => { setRoomId(o.rt.room_type_id); setPlanId(p.plan.rate_plan_id) }} />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold">{o.rt.name} <span className="font-normal text-muted">· {p.plan.name}</span></p>
                          <p className="text-xs text-muted">{!o.fits ? `Tối đa ${o.rt.max_adults} NL + ${o.rt.max_children} TE/phòng` : o.left >= stay.rooms ? roomsLeft(o.left) : o.left ? `Chỉ còn ${o.left} phòng` : 'Hết phòng'}</p>
                        </div>
                        <div className="text-right"><p className="font-bold">{fmtVND(p.nightly)}</p><p className="text-xs text-muted">/đêm</p></div>
                      </label>
                    )
                  }))}
                </div>
              )}
              {offers.data && !offers.data.some(o => o.fits && o.left >= stay.rooms) && <ErrorBox>Hết phòng phù hợp cho ngày này. Đổi ngày hoặc <Link href={`/tim-kiem?${searchToParams({ ...stay, dest: '' })}`} className="underline">xem khách sạn khác</Link>.</ErrorBox>}
              <div className="flex justify-end"><Button size="lg" disabled={!canNext0} onClick={() => go(1)}>Tiếp tục: Dịch vụ thêm</Button></div>
            </Card>
          )}

          {step === 1 && (
            <Card className="space-y-4 p-5">
              <div>
                <h2 className="text-lg font-bold">Dịch vụ thêm từ hệ sinh thái Rooty</h2>
                <p className="text-sm text-muted">Khách không cần rời Rooty Hospitality: xe sân bay, tour Rooty Trip, du thuyền RIVUS, spa — thanh toán một lần.</p>
              </div>
              {!allAddons.data ? <SkeletonList /> : (
                <ul className="space-y-2">
                  {allAddons.data.map(a => {
                    const Icon = CAT_ICON[a.category]
                    const qty = addons[a.id] ?? 0
                    const suggested = a.id === 'AD-TRF' || a.id === 'AD-T4D'
                    return (
                      <li key={a.id} className={cn('flex flex-wrap items-center gap-3 rounded-xl border p-3', qty ? 'border-primary bg-mint/50' : 'border-border')}>
                        <Photo src={a.image} alt={a.name} className="size-16 shrink-0 rounded-lg" sizes="64px" />
                        <div className="min-w-0 flex-1">
                          <p className="flex flex-wrap items-center gap-2 font-semibold"><Icon className="size-4 text-primary" />{a.name}{suggested && <Badge tone="brand">Gợi ý</Badge>}</p>
                          <p className="text-xs text-muted">{a.provider} · {a.desc}</p>
                          <p className="text-sm font-medium">{fmtVND(a.price)}<span className="text-xs font-normal text-muted"> / {a.unit === 'trip' ? (a.category === 'transfer' ? 'chiều' : 'chuyến') : 'người lớn'}{a.child_price ? ` · trẻ em ${fmtVND(a.child_price)}` : ''}</span></p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button type="button" aria-label={`Bớt ${a.name}`} disabled={!qty} onClick={() => bump(a, -1)} className="grid size-8 place-items-center rounded-full border border-border disabled:opacity-40"><Minus className="size-4" /></button>
                          <span className="w-5 text-center font-semibold">{qty}</span>
                          <button type="button" aria-label={`Thêm ${a.name}`} onClick={() => bump(a, 1)} className="grid size-8 place-items-center rounded-full border border-border"><Plus className="size-4" /></button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
              {honeymoonPromo && (
                <label className="flex items-center gap-2 rounded-xl border border-border p-3 text-sm">
                  <input type="checkbox" className="size-4 accent-[var(--primary)]" checked={honeymoon} onChange={e => setHoneymoon(e.target.checked)} />
                  Chuyến đi trăng mật — áp dụng ưu đãi <b>Honeymoon</b> (−10%, trang trí phòng)
                </label>
              )}
              <div className="flex justify-between"><Button variant="secondary" onClick={() => go(0)}>Quay lại</Button><Button size="lg" onClick={() => go(2)}>Tiếp tục: Thông tin khách</Button></div>
            </Card>
          )}

          {step === 2 && (
            <Card className="space-y-4 p-5">
              <h2 className="text-lg font-bold">Thông tin khách</h2>
              {me ? <p className="rounded-lg bg-mint px-3 py-2 text-sm text-brand dark:text-accent">Đã điền từ tài khoản thành viên {me.name} ({me.tier}).</p> : <p className="text-sm text-muted">Đã là thành viên? <Link href="/thanh-vien" className="text-primary underline">Đăng nhập</Link> để nhận giá thành viên −5%.</p>}
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Họ tên *"><Input autoComplete="name" value={guest.name} onChange={e => setGuest({ ...guest, name: e.target.value })} aria-invalid={!!errors.name} />{errors.name && <span className="text-xs text-danger">{errors.name}</span>}</Field>
                <Field label="Số điện thoại *"><Input type="tel" autoComplete="tel" value={guest.phone} onChange={e => setGuest({ ...guest, phone: e.target.value })} aria-invalid={!!errors.phone} />{errors.phone && <span className="text-xs text-danger">{errors.phone}</span>}</Field>
                <Field label="Email *" hint="Gửi xác nhận & voucher"><Input type="email" autoComplete="email" value={guest.email} onChange={e => setGuest({ ...guest, email: e.target.value })} aria-invalid={!!errors.email} />{errors.email && <span className="text-xs text-danger">{errors.email}</span>}</Field>
                <Field label="Quốc tịch"><Select value={guest.nationality} onChange={e => setGuest({ ...guest, nationality: e.target.value })}>{['Việt Nam', 'Hàn Quốc', 'Nhật Bản', 'Trung Quốc', 'Nga', 'Khác'].map(n => <option key={n}>{n}</option>)}</Select></Field>
                <Field label="Giờ đến dự kiến"><Select value={guest.arrival} onChange={e => setGuest({ ...guest, arrival: e.target.value })}>{['12:00', '14:00', '16:00', '18:00', '20:00', '22:00', 'Sau 22:00'].map(t => <option key={t}>{t}</option>)}</Select></Field>
                <Field label="Yêu cầu đặc biệt" className="sm:col-span-2"><Textarea value={guest.notes} onChange={e => setGuest({ ...guest, notes: e.target.value })} placeholder="Tầng cao, giường phụ, kỷ niệm ngày cưới…" /></Field>
              </div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4 accent-[var(--primary)]" checked={invoice.on} onChange={e => setInvoice({ ...invoice, on: e.target.checked })} /> Xuất hoá đơn công ty</label>
              {invoice.on && (
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="Tên công ty"><Input value={invoice.company} onChange={e => setInvoice({ ...invoice, company: e.target.value })} /></Field>
                  <Field label="Mã số thuế"><Input inputMode="numeric" value={invoice.tax_code} onChange={e => setInvoice({ ...invoice, tax_code: e.target.value })} /></Field>
                  <Field label="Địa chỉ"><Input value={invoice.address} onChange={e => setInvoice({ ...invoice, address: e.target.value })} /></Field>
                  {errors.invoice && <span className="text-xs text-danger sm:col-span-3">{errors.invoice}</span>}
                </div>
              )}
              <div className="flex justify-between"><Button variant="secondary" onClick={() => go(1)}>Quay lại</Button><Button size="lg" onClick={() => validate() && go(3)}>Tiếp tục: Thanh toán</Button></div>
            </Card>
          )}

          {step === 3 && (
            <Card className="space-y-4 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-bold">Thanh toán</h2>
                <span className={cn('flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold', remaining < 120 ? 'bg-danger-bg text-danger' : 'bg-warn-bg text-warn')} role="timer" aria-live="off">
                  <Timer className="size-4" /> Giữ phòng {mmss}
                </span>
              </div>
              {expired ? (
                <ErrorBox>Hết thời gian giữ phòng 15 phút. Phòng đã được trả lại kho. <button type="button" className="font-semibold underline" onClick={() => { setHoldStart(Date.now()); setNow(Date.now()) }}>Kiểm tra lại & giữ phòng</button></ErrorBox>
              ) : (
                <>
                  <fieldset className="grid gap-2 sm:grid-cols-2">
                    <legend className="mb-2 text-sm font-semibold">Phương thức</legend>
                    {([['card', CreditCard, 'Thẻ quốc tế', 'Visa · Master · JCB'], ['qr', QrCode, 'QR / VNPay', 'Quét mã bằng app ngân hàng'], ['transfer', Landmark, 'Chuyển khoản', 'Giữ chỗ 24h chờ xác nhận'], ['hotel', HotelIcon, 'Trả tại khách sạn', 'Thanh toán khi nhận phòng']] as const).map(([v, Icon, label, sub]) => (
                      <label key={v} className={cn('flex cursor-pointer items-center gap-3 rounded-xl border p-3', pay.method === v ? 'border-primary bg-mint/60' : 'border-border')}>
                        <input type="radio" name="pay" className="size-4 accent-[var(--primary)]" checked={pay.method === v} onChange={() => setPay({ ...pay, method: v, mode: v === 'hotel' || v === 'transfer' ? 'full' : pay.mode })} />
                        <Icon className="size-5 text-primary" /><span><span className="block text-sm font-semibold">{label}</span><span className="block text-xs text-muted">{sub}</span></span>
                      </label>
                    ))}
                  </fieldset>
                  {(pay.method === 'card' || pay.method === 'qr') && (
                    <fieldset className="flex flex-wrap gap-4 text-sm">
                      <legend className="mb-2 text-sm font-semibold">Số tiền</legend>
                      <label className="flex items-center gap-2"><input type="radio" name="mode" className="accent-[var(--primary)]" checked={pay.mode === 'full'} onChange={() => setPay({ ...pay, mode: 'full' })} /> Thanh toán toàn bộ {q.data && <b>{fmtVND(q.data.total)}</b>}</label>
                      <label className="flex items-center gap-2"><input type="radio" name="mode" className="accent-[var(--primary)]" checked={pay.mode === 'deposit'} onChange={() => setPay({ ...pay, mode: 'deposit' })} /> Đặt cọc {DEPOSIT_RATE * 100}% {q.data && <b>{fmtVND(q.data.deposit)}</b>}</label>
                    </fieldset>
                  )}
                  <div className="rounded-xl border border-dashed border-border bg-surface-2 p-4 text-sm">
                    {pay.method === 'card' && <p className="flex items-center gap-2"><ShieldCheck className="size-4 text-ok" />Cổng thanh toán giả lập — bản demo <b>không</b> nhập số thẻ.</p>}
                    {pay.method === 'qr' && <div className="flex items-center gap-4"><div className="grid size-24 place-items-center rounded-lg bg-white"><QrCode className="size-16 text-black" /></div><p>Quét mã VNPay (giả lập) để thanh toán {q.data && fmtVND(pay.mode === 'full' ? q.data.total : q.data.deposit)}.</p></div>}
                    {pay.method === 'transfer' && <p>Chuyển khoản tới <b>CTCP Rooty Trip Phú Quốc</b> · STK 0000 0000 (giả lập) · Nội dung: mã booking. Booking ở trạng thái <b>Mới</b> cho tới khi kế toán xác nhận.</p>}
                    {pay.method === 'hotel' && <p>Không thu tiền trước. Booking giữ tới 18:00 ngày nhận phòng (theo chính sách khách sạn).</p>}
                    {(pay.method === 'card' || pay.method === 'qr') && (
                      <label className="mt-3 flex items-center gap-2 text-xs text-muted">Kết quả giả lập:
                        <select value={pay.outcome} onChange={e => setPay({ ...pay, outcome: e.target.value as 'ok' | 'fail' })} className="h-8 rounded-md border border-border bg-surface px-2 text-fg"><option value="ok">Thành công</option><option value="fail">Thất bại</option></select>
                      </label>
                    )}
                  </div>
                  {state === 'failed' && <ErrorBox>Thanh toán thất bại (giả lập: ngân hàng từ chối). Phòng vẫn được giữ thêm {mmss}. Đổi kết quả giả lập hoặc phương thức rồi bấm <b>Thử lại</b>.</ErrorBox>}
                  {submitError && <ErrorBox>{submitError}</ErrorBox>}
                  <div className="flex justify-between gap-2">
                    <Button variant="secondary" onClick={() => go(2)} disabled={state === 'processing'}>Quay lại</Button>
                    <Button size="lg" onClick={submit} disabled={state === 'processing' || !q.data}>
                      {state === 'processing' ? <><Loader2 className="size-4 animate-spin" /> Đang xử lý…</> : state === 'failed' ? 'Thử lại' : pay.method === 'card' || pay.method === 'qr' ? `Thanh toán ${q.data ? fmtVND(pay.mode === 'full' ? q.data.total : q.data.deposit) : ''}` : 'Xác nhận đặt phòng'}
                    </Button>
                  </div>
                </>
              )}
            </Card>
          )}
        </div>
        <aside><div className="sticky top-32">{summary}</div></aside>
      </div>
    </div>
  )
}

function Row({ k, v, tone }: { k: string; v: string; tone?: 'ok' }) {
  return <div className={cn('flex justify-between gap-2', tone === 'ok' ? 'text-ok' : 'text-muted')}><span>{k}</span><span className="shrink-0 text-fg">{v}</span></div>
}

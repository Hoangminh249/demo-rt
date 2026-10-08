'use client'
// Bước 2 — Thông tin khách & yêu cầu lưu trú. Chỉ hỏi thứ cần cho đặt phòng (field bám Gohost POST /bookings), không CCCD.
// Lưu vào sessionStorage rồi sang bước thanh toán; không gửi đi đâu.
import { useState, type ReactNode } from 'react'
import { useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { ArrowLeft, ArrowRight, Baby, Check, Clock, Lock, Sparkles, UserRound } from 'lucide-react'
import { cn } from 'cn'
import { Link, useRouter } from '@/i18n/navigation'
import { ARRIVALS, CHILD_AGES, REQUESTS, isEmail, isPhone, NOTES_MAX, roomHref } from '@/lib/booking'
import type { BookingTarget, ChildAge, GuestDraft } from '@/types/booking'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BTN, BTN_OUT } from '@/components/site/kit'
import { useRoomOffer } from '@/components/room/use-room-offer'
import { saveDraft, useDraft } from './draft'

const EMPTY: GuestDraft = { name: '', phone: '', email: '', country: 'VN', self: true, guest: '', children: [], arrival: '', requests: [], notes: '', marketing: false }
const COUNTRIES = ['VN', 'KR', 'CN', 'TW', 'JP', 'SG', 'MY', 'TH', 'AU', 'US', 'GB', 'FR', 'DE', 'RU', 'IN']
const INPUT = 'h-12 rounded-lg text-[15px] md:h-12 md:text-[15px]'

function Card({ icon, title, tag, children }: { icon: ReactNode; title: string; tag?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
      <h2 className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xl font-bold text-brand">
        <span className="grid size-8 place-items-center rounded-lg bg-mint">{icon}</span>{title}
        {tag && <span className="text-[13px] font-normal text-muted-foreground">{tag}</span>}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  )
}

function Field({ id, label, error, hint, children }: { id: string; label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <div className="grid min-w-0 content-start gap-1.5">
      <label htmlFor={id} className="text-[14px] font-medium">{label}</label>
      {children}
      {error ? <p id={`${id}-err`} className="text-[13px] text-destructive">{error}</p> : hint ? <p className="text-[13px] text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

/** Chip chọn (radio hoặc checkbox) — input thật, ẩn đi, chip là label. */
function Chip({ type, name, checked, onChange, children }: { type: 'radio' | 'checkbox'; name: string; checked: boolean; onChange: () => void; children: ReactNode }) {
  return (
    <label className={cn('inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full border px-4 text-[14px] transition-colors has-focus-visible:ring-4 has-focus-visible:ring-focus',
      checked ? 'border-primary bg-mint font-semibold text-brand' : 'border-border-strong bg-white hover:bg-item-hover')}>
      <input type={type} name={name} checked={checked} onChange={onChange} className="sr-only" />
      {checked && <Check className="size-4" aria-hidden />}{children}
    </label>
  )
}

export function Checkbox({ id, checked, onChange, children, error }: { id: string; checked: boolean; onChange: (v: boolean) => void; children: ReactNode; error?: string }) {
  return (
    <div>
      <label htmlFor={id} className="flex cursor-pointer gap-3 text-[14px]">
        <input id={id} type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined}
          className="mt-0.5 size-5 shrink-0 cursor-pointer accent-primary" />
        <span>{children}</span>
      </label>
      {error && <p id={`${id}-err`} className="mt-1 pl-8 text-[13px] text-destructive">{error}</p>}
    </div>
  )
}

/** Đọc bản nháp (quay lại từ bước thanh toán thì form điền sẵn) rồi mới vẽ form. */
export function GuestForm({ target }: { target: BookingTarget }) {
  const draft = useDraft()
  return draft ? <Form target={target} initial={draft.guest} /> : <div className="h-[640px] animate-pulse rounded-2xl bg-muted" />
}

function Form({ target, initial }: { target: BookingTarget; initial?: GuestDraft }) {
  const t = useTranslations('Booking')
  const locale = useLocale()
  const router = useRouter()
  const query = useSearchParams().toString()
  const o = useRoomOffer(target.hotel, target.room)
  const [f, setF] = useState<GuestDraft>({ ...EMPTY, ...initial })
  const [consent, setConsent] = useState(!!initial)
  const [errors, setErrors] = useState<Partial<Record<'name' | 'phone' | 'email' | 'guest' | 'consent', string>>>({})

  // Sửa ô nào thì tắt lỗi của ô đó (kiểm lại khi bấm Tiếp tục).
  const set = <K extends keyof GuestDraft>(k: K, v: GuestDraft[K]) => { setF(x => ({ ...x, [k]: v })); setErrors(e => (k in e ? { ...e, [k]: undefined } : e)) }
  const kids: ChildAge[] = Array.from({ length: o.stay.children }, (_, i) => f.children[i] ?? 'under6')
  const countries = new Intl.DisplayNames([locale], { type: 'region' })
  const kidRow = (age: ChildAge) => target.children?.rows[CHILD_AGES.indexOf(age)] // bảng trẻ em: dưới 6 · 6–11 · từ 12
  const ready = o.status === 'available' && !!o.plan

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const err: typeof errors = {}
    if (!f.name.trim()) err.name = t('err.name')
    if (!isPhone(f.phone)) err.phone = t('err.phone')
    if (!isEmail(f.email)) err.email = t('err.email')
    if (!f.self && !f.guest.trim()) err.guest = t('err.guest')
    if (!consent) err.consent = t('err.consent')
    setErrors(err)
    const first = Object.keys(err)[0]
    if (first) { document.getElementById(`g-${first}`)?.focus(); return }
    saveDraft({ guest: { ...f, name: f.name.trim(), email: f.email.trim(), children: kids, notes: f.notes.slice(0, NOTES_MAX) } })
    router.push(`/dat-phong/thanh-toan?${query}`)
  }

  const invalid = (k: keyof typeof errors) => ({ 'aria-invalid': !!errors[k], 'aria-describedby': errors[k] ? `g-${k}-err` : undefined })

  return (
    <form onSubmit={submit} noValidate className="grid gap-5">
      <Card icon={<UserRound className="size-4 text-brand" aria-hidden />} title={t('contactTitle')}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field id="g-name" label={`${t('name')} *`} error={errors.name}>
              <Input id="g-name" autoComplete="name" value={f.name} onChange={e => set('name', e.target.value)} placeholder={t('namePh')} className={INPUT} {...invalid('name')} />
            </Field>
          </div>
          <Field id="g-phone" label={`${t('phone')} *`} error={errors.phone} hint={t('phoneHint')}>
            <Input id="g-phone" type="tel" autoComplete="tel" inputMode="tel" value={f.phone} onChange={e => set('phone', e.target.value)} placeholder="+84 912 345 678" className={INPUT} {...invalid('phone')} />
          </Field>
          <Field id="g-email" label={`${t('email')} *`} error={errors.email} hint={t('emailHint')}>
            <Input id="g-email" type="email" autoComplete="email" value={f.email} onChange={e => set('email', e.target.value)} placeholder="ten@email.com" className={INPUT} {...invalid('email')} />
          </Field>
          <Field id="g-country" label={t('country')}>
            <Select value={f.country} onValueChange={v => set('country', v)}>
              <SelectTrigger id="g-country" className="!h-12 w-full rounded-lg border-border-strong bg-white text-[15px]"><SelectValue /></SelectTrigger>
              <SelectContent>{COUNTRIES.map(c => <SelectItem key={c} value={c}>{countries.of(c)}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
        </div>
      </Card>

      <Card icon={<Baby className="size-4 text-brand" aria-hidden />} title={t('guestsTitle')} tag={t('guestsTag', { party: `${o.stay.adults + o.stay.children}` })}>
        <Checkbox id="g-self" checked={f.self} onChange={v => set('self', v)}>{t('self')}</Checkbox>
        {!f.self && (
          <div className="mt-4">
            <Field id="g-guest" label={`${t('guestName')} *`} error={errors.guest} hint={t('guestHint')}>
              <Input id="g-guest" autoComplete="off" value={f.guest} onChange={e => set('guest', e.target.value)} className={INPUT} {...invalid('guest')} />
            </Field>
          </div>
        )}
        {kids.length > 0 && (
          <div className="mt-5 grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
            {kids.map((age, i) => (
              <Field key={i} id={`g-kid-${i}`} label={t('childAge', { n: i + 1 })} hint={kidRow(age) ? `${kidRow(age)![1]} · ${target.children!.head[2]}: ${kidRow(age)![2]}` : undefined}>
                <Select value={age} onValueChange={v => set('children', kids.map((a, j) => (j === i ? (v as ChildAge) : a)))}>
                  <SelectTrigger id={`g-kid-${i}`} className="!h-12 w-full rounded-lg border-border-strong bg-white text-[15px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{CHILD_AGES.map(a => <SelectItem key={a} value={a}>{t(`ages.${a}`)}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            ))}
          </div>
        )}
      </Card>

      <Card icon={<Clock className="size-4 text-brand" aria-hidden />} title={t('arrivalTitle')} tag={t('optional')}>
        <fieldset>
          <legend className="text-[14px] text-muted-foreground">{t('arrivalHint', { time: target.times.checkin })}</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {[...ARRIVALS, '' as const].map(a => <Chip key={a || 'unknown'} type="radio" name="arrival" checked={f.arrival === a} onChange={() => set('arrival', a)}>{t(`arrivals.${a || 'unknown'}`)}</Chip>)}
          </div>
        </fieldset>
      </Card>

      <Card icon={<Sparkles className="size-4 text-brand" aria-hidden />} title={t('requestsTitle')} tag={t('optional')}>
        <fieldset>
          <legend className="text-[14px] text-muted-foreground">{t('requestsHint')}</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {REQUESTS.map(r => <Chip key={r} type="checkbox" name="requests" checked={f.requests.includes(r)} onChange={() => set('requests', f.requests.includes(r) ? f.requests.filter(x => x !== r) : [...f.requests, r])}>{t(`requests.${r}`)}</Chip>)}
          </div>
        </fieldset>
        <div className="mt-5">
          <Field id="g-notes" label={t('notes')}>
            <textarea id="g-notes" rows={4} maxLength={NOTES_MAX} value={f.notes} onChange={e => set('notes', e.target.value)} placeholder={t('notesPh')}
              className="w-full rounded-lg border border-border-strong bg-white px-4 py-3 text-[15px] outline-none placeholder:text-muted-foreground focus:border-focus focus:ring-2 focus:ring-focus" />
          </Field>
          <p className="mt-1 text-right text-[13px] text-muted-foreground tabular-nums">{f.notes.length}/{NOTES_MAX}</p>
        </div>
      </Card>

      <section className="grid gap-3 rounded-2xl bg-mint px-5 py-4">
        <Checkbox id="g-consent" checked={consent} onChange={v => { setConsent(v); setErrors(e => ({ ...e, consent: undefined })) }} error={errors.consent}>
          {t.rich('consent', { link: c => <Link href="/chinh-sach-bao-mat" target="_blank" className="font-semibold text-primary underline underline-offset-2">{c}</Link> })} *
        </Checkbox>
        <Checkbox id="g-marketing" checked={f.marketing} onChange={v => set('marketing', v)}>{t('marketing')}</Checkbox>
        <p className="flex gap-2 text-[13px] text-muted-foreground"><Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />{t('privacyNote')}</p>
      </section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href={roomHref(target.hotel.slug, target.room.slug, o.stay, o.plan?.rate_plan_id)} className={`${BTN_OUT} h-12`}><ArrowLeft className="size-4" aria-hidden />{t('backRoom')}</Link>
        <button type="submit" disabled={!ready} className={`${BTN} h-12 px-6`}>{t('toPayment')}<ArrowRight className="size-4" aria-hidden /></button>
      </div>
    </form>
  )
}

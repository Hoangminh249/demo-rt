'use client'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Sparkles, X, Send, CalendarDays, Users, Wallet, Plus, MapPin, Eye } from 'lucide-react'
import { repo, type HotelResult } from '@/lib/repo'
import { parseRequest, understood, SAMPLE_PROMPTS, type Intent } from '@/lib/ai-parse'
import { AREA_LABEL, TAG_LABEL } from '@/lib/labels'
import { diffDays, fmtNumber, fmtRange, fmtVND, guestsLabel, addDays, roomsLeft } from '@/lib/format'
import { DEFAULT_SEARCH, bookingHref, searchToParams } from '@/lib/search-params'
import type { HotelTag } from '@/lib/types'
import { useAsync, useDemo } from '@/store/provider'
import { Badge, Button, ButtonLink, Skeleton, cn } from '../ui'
import { useCompare } from '../site/cards'

interface Suggestion { res: HotelResult; offer: HotelResult['offers'][number]; plan: HotelResult['offers'][number]['plans'][number]; score: number; reasons: string[] }

async function recommend(it: Intent, personal: boolean) {
  const checkin = it.checkin ?? DEFAULT_SEARCH.checkin
  const checkout = it.checkout ?? addDays(checkin, 3)
  const adults = it.adults ?? 2, children = it.children ?? 0
  let rooms = 1
  let results = await repo.search({ dest: it.area ?? '', checkin, checkout, adults, children, rooms })
  if (!results.some(r => r.offers.some(o => o.left >= 1))) { rooms = 2; results = await repo.search({ dest: it.area ?? '', checkin, checkout, adults, children, rooms }) }
  const picks: Suggestion[] = []
  for (const res of results) {
    let best: Suggestion | undefined
    for (const offer of res.offers) {
      if (offer.left < rooms) continue
      for (const plan of offer.plans) {
        if (it.budget && plan.total > it.budget) continue
        if (it.budgetPerNight && plan.nightly > it.budgetPerNight) continue
        const reasons: string[] = []
        let score = 0
        const has = (t: HotelTag) => res.hotel.tags.includes(t)
        if (has('ho-boi')) { score += it.tags.includes('ho-boi') ? 2 : 0.3; reasons.push('Có hồ bơi') }
        if (has('gan-bien')) { score += it.tags.includes('gan-bien') ? 2 : 0.3; reasons.push('gần biển') }
        if (children && has('kids-club')) { score += 2; reasons.push('Kids Club') } // gia đình có trẻ: Kids Club quan trọng
        if (plan.plan.has_breakfast) { score += it.tags.includes('an-sang') || children ? 1 : 0.5; reasons.push('Breakfast Included') }
        if (it.oceanView && offer.rt.ocean_view) score += 2
        if (offer.rt.ocean_view) reasons.push('Ocean View')
        if (children && offer.rt.family) score += 1
        if (it.tags.includes('spa') && has('spa')) { score += 1; reasons.push('Spa') }
        if (personal) score += (offer.rt.ocean_view ? 2 : 0) + (offer.rt.family ? 1 : 0) + (plan.plan.has_breakfast ? 1 : 0)
        score -= plan.total / 1e8 // hoà điểm: rẻ hơn lên trước
        if (!best || score > best.score) best = { res, offer, plan, score, reasons }
      }
    }
    if (best) picks.push(best)
  }
  return { picks: picks.sort((a, b) => b.score - a.score).slice(0, 3), q: { checkin, checkout, adults, children, rooms } }
}

const GREETING = 'Xin chào! Mình là trợ lý đặt phòng Rooty Hospitality. Hãy nói nhu cầu: ngày đi, số người, khu vực, ngân sách, tiện ích mong muốn… Mình sẽ tìm trong phòng còn trống thật của hệ thống.'

export function AiAssistant() {
  const { overlay } = useDemo()
  const personal = overlay.session.customerId === 'C001'
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [msgs, setMsgs] = useState<{ from: 'user' | 'bot'; text: string }[]>([{ from: 'bot', text: GREETING }])
  const [intent, setIntent] = useState<Intent | null>(null)
  const [edit, setEdit] = useState<'dates' | 'guests' | 'budget' | null>(null)
  const { toggle } = useCompare()
  const endRef = useRef<HTMLDivElement>(null)
  const rec = useAsync(() => (intent ? recommend(intent, personal) : Promise.resolve(null)), [intent, personal])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, rec.data])

  function ask(text: string) {
    if (!text.trim()) return
    const it = parseRequest(text)
    const next: { from: 'user' | 'bot'; text: string }[] = [{ from: 'user', text }]
    if (!understood(it)) {
      next.push({ from: 'bot', text: 'Xin lỗi, mình chưa hiểu rõ. Bạn cho mình biết ngày nhận – trả phòng, số người lớn/trẻ em và khu vực hoặc tiện ích mong muốn nhé. Ví dụ: "20–23/10, 2 người lớn 1 trẻ em, gần biển, dưới 10 triệu".' })
    } else {
      const merged: Intent = { ...intent, ...Object.fromEntries(Object.entries(it).filter(([, v]) => v !== undefined && !(Array.isArray(v) && !v.length))), tags: it.tags.length ? it.tags : intent?.tags ?? [] }
      setIntent(merged)
      next.push({ from: 'bot', text: merged.checkin ? 'Mình đã hiểu như bên dưới (bấm vào từng mục để sửa). Đây là lựa chọn phù hợp nhất:' : `Bạn chưa nói ngày — mình tạm tính ${fmtRange(DEFAULT_SEARCH.checkin, DEFAULT_SEARCH.checkout)}. Bấm vào ô ngày để đổi.` })
    }
    setMsgs(m => [...m, ...next])
    setInput('')
  }
  const patch = (p: Partial<Intent>) => setIntent(i => ({ ...(i ?? { tags: [] }), ...p }))

  return (
    <>
      {!open && (
        <button type="button" onClick={() => setOpen(true)} className="no-print fixed right-4 bottom-24 z-40 lg:right-5 lg:bottom-5 flex items-center gap-2 rounded-full bg-brand p-3 text-sm font-semibold text-white shadow-popover hover:opacity-95 sm:px-4" aria-label="Mở trợ lý AI">
          <Sparkles className="size-5" aria-hidden /><span className="hidden sm:inline">Trợ lý AI</span>
        </button>
      )}
      {open && (
        <section aria-label="AI Hospitality Assistant" className="no-print fixed inset-x-2 bottom-2 z-50 flex h-[min(680px,calc(100vh-3.5rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-[420px]">
          <header className="flex items-center gap-2 bg-brand px-4 py-3 text-white">
            <Sparkles className="size-5" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">AI Hospitality Assistant</p>
              <p className="text-xs text-white/75">{personal ? 'Đang cá nhân hoá cho Nguyễn Văn A' : 'Demo: phân tích theo luật, chưa dùng LLM'}</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Đóng trợ lý" className="rounded p-1 hover:bg-white/10"><X className="size-5" /></button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
            {msgs.map((m, i) => (
              <p key={i} className={cn('max-w-[88%] rounded-2xl px-3 py-2', m.from === 'user' ? 'ml-auto bg-primary text-white' : 'bg-muted')}>{m.text}</p>
            ))}

            {intent && (
              <div className="space-y-2 rounded-xl border border-border p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">AI đã hiểu</p>
                <div className="flex flex-wrap gap-1.5">
                  <Chip icon={<CalendarDays className="size-3.5" />} onClick={() => setEdit(edit === 'dates' ? null : 'dates')}>
                    {fmtRange(intent.checkin ?? DEFAULT_SEARCH.checkin, intent.checkout ?? addDays(intent.checkin ?? DEFAULT_SEARCH.checkin, 3))}
                  </Chip>
                  <Chip icon={<Users className="size-3.5" />} onClick={() => setEdit(edit === 'guests' ? null : 'guests')}>{guestsLabel(intent.adults ?? 2, intent.children ?? 0)}</Chip>
                  <Chip icon={<Wallet className="size-3.5" />} onClick={() => setEdit(edit === 'budget' ? null : 'budget')}>
                    {intent.budget ? `Dưới ${fmtNumber(intent.budget / 1e6)} triệu` : intent.budgetPerNight ? `Dưới ${fmtNumber(intent.budgetPerNight / 1e6)} triệu/đêm` : 'Ngân sách: bất kỳ'}
                  </Chip>
                  {intent.area && <Chip icon={<MapPin className="size-3.5" />} onRemove={() => patch({ area: undefined })}>{AREA_LABEL[intent.area]}</Chip>}
                  {intent.oceanView && <Chip icon={<Eye className="size-3.5" />} onRemove={() => patch({ oceanView: false })}>View biển</Chip>}
                  {intent.tags.map(t => <Chip key={t} onRemove={() => patch({ tags: intent.tags.filter(x => x !== t) })}>{TAG_LABEL[t]}</Chip>)}
                  <label className="inline-flex items-center rounded-full border border-dashed border-border px-2 text-xs text-muted-foreground">
                    <Plus className="size-3" /><span className="sr-only">Thêm tiêu chí</span>
                    <select value="" onChange={e => e.target.value && patch({ tags: [...intent.tags, e.target.value as HotelTag] })} className="bg-transparent py-1 text-xs">
                      <option value="">Tiêu chí</option>
                      {(Object.keys(TAG_LABEL) as HotelTag[]).filter(t => !intent.tags.includes(t)).map(t => <option key={t} value={t}>{TAG_LABEL[t]}</option>)}
                    </select>
                  </label>
                </div>
                {edit === 'dates' && (
                  <div className="grid grid-cols-2 gap-2">
                    <input aria-label="Nhận phòng" type="date" value={intent.checkin ?? DEFAULT_SEARCH.checkin} onChange={e => e.target.value && patch({ checkin: e.target.value, checkout: intent.checkout && intent.checkout > e.target.value ? intent.checkout : addDays(e.target.value, 1) })} className="h-9 rounded-md border border-border bg-card px-2 text-xs" />
                    <input aria-label="Trả phòng" type="date" value={intent.checkout ?? addDays(intent.checkin ?? DEFAULT_SEARCH.checkin, 3)} min={addDays(intent.checkin ?? DEFAULT_SEARCH.checkin, 1)} onChange={e => e.target.value && patch({ checkout: e.target.value })} className="h-9 rounded-md border border-border bg-card px-2 text-xs" />
                  </div>
                )}
                {edit === 'guests' && (
                  <div className="flex flex-wrap gap-3 text-xs">
                    {(['adults', 'children'] as const).map(k => (
                      <span key={k} className="flex items-center gap-2">{k === 'adults' ? 'Người lớn' : 'Trẻ em'}
                        <button type="button" aria-label="Giảm" className="size-7 rounded-full border border-border" onClick={() => patch({ [k]: Math.max(k === 'adults' ? 1 : 0, (intent[k] ?? (k === 'adults' ? 2 : 0)) - 1) })}>−</button>
                        <b>{intent[k] ?? (k === 'adults' ? 2 : 0)}</b>
                        <button type="button" aria-label="Tăng" className="size-7 rounded-full border border-border" onClick={() => patch({ [k]: (intent[k] ?? (k === 'adults' ? 2 : 0)) + 1 })}>+</button>
                      </span>
                    ))}
                  </div>
                )}
                {edit === 'budget' && (
                  <label className="flex items-center gap-2 text-xs">Tổng tối đa (triệu)
                    <input type="number" min={0} step={0.5} value={intent.budget ? intent.budget / 1e6 : ''} placeholder="bất kỳ" onChange={e => patch({ budget: e.target.value ? Number(e.target.value) * 1e6 : undefined, budgetPerNight: undefined })} className="h-8 w-24 rounded-md border border-border bg-card px-2" />
                  </label>
                )}
              </div>
            )}

            {intent && rec.loading && !rec.data && <div className="space-y-2"><Skeleton className="h-28" /><Skeleton className="h-28" /></div>}
            {intent && rec.data && (rec.data.picks.length === 0 ? (
              <p className="rounded-2xl bg-warn-bg px-3 py-2 text-warn">Không có phòng khớp tất cả tiêu chí. Thử nới ngân sách, đổi ngày hoặc bỏ bớt tiêu chí nhé.</p>
            ) : (
              <div className={cn('space-y-2', rec.loading && 'opacity-60')}>
                {rec.data.picks.map(p => {
                  const s = { ...rec.data!.q, ages: Array(rec.data!.q.children).fill(6) }
                  const nights = diffDays(s.checkin, s.checkout)
                  return (
                    <div key={p.offer.rt.room_type_id} className="rounded-xl border border-border p-3">
                      {personal && (p.offer.rt.ocean_view || p.offer.rt.family) && <Badge tone="info" className="mb-1"><Sparkles className="size-3" /> Gợi ý dựa trên lần ở trước</Badge>}
                      <p className="font-semibold">{p.res.hotel.name} – {p.offer.rt.name}</p>
                      <p>{nights} đêm – <b>{fmtVND(p.plan.total)}</b>{s.rooms > 1 ? ` (${s.rooms} phòng)` : ''}</p>
                      <p className="text-xs text-muted-foreground">{p.reasons.slice(0, 4).join(' – ')}</p>
                      <p className="text-xs font-medium text-ok">{roomsLeft(p.offer.left, "available")}{p.plan.promo ? ` · Ưu đãi ${p.plan.promo.name.split('–')[0].trim()} −${p.plan.promo.discount_pct}%` : ''}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <ButtonLink size="sm" variant="secondary" href={`/${p.res.hotel.slug}?${searchToParams(s)}`}>View Hotel</ButtonLink>
                        <Button size="sm" variant="secondary" onClick={() => toggle(p.offer.rt.room_type_id, p.offer.rt.name)}>Compare</Button>
                        <ButtonLink size="sm" variant="secondary" href={`/${p.res.hotel.slug}/phong/${p.offer.rt.slug}?${searchToParams(s)}`}>Select Room</ButtonLink>
                        <ButtonLink size="sm" href={bookingHref(p.res.hotel.slug, s, p.offer.rt.room_type_id, p.plan.plan.rate_plan_id)}>Book</ButtonLink>
                      </div>
                    </div>
                  )
                })}
                {personal && (
                  <div className="rounded-xl border border-dashed border-primary/40 bg-accent p-3 text-xs">
                    <p className="font-semibold text-brand dark:text-brand-accent">Tour phù hợp cho gia đình anh A</p>
                    <p className="mt-1 text-muted-foreground">Lần trước đã đi Tour 4 đảo → gợi ý <b>Tour Bắc đảo – Grand World & Safari</b> (950.000đ/người lớn) và xe sân bay như mọi lần.</p>
                    <Link href="/trai-nghiem/tour" className="mt-1 inline-block font-medium text-primary hover:underline">Xem tour →</Link>
                  </div>
                )}
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <div className="border-t border-border p-3">
            <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
              {SAMPLE_PROMPTS.map(p => (
                <button key={p} type="button" onClick={() => ask(p)} className="shrink-0 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:border-primary hover:text-primary">
                  {p.length > 42 ? p.slice(0, 42) + '…' : p}
                </button>
              ))}
            </div>
            <form onSubmit={e => { e.preventDefault(); ask(input) }} className="flex gap-2">
              <label htmlFor="ai-input" className="sr-only">Nhập nhu cầu</label>
              <input id="ai-input" value={input} onChange={e => setInput(e.target.value)} placeholder="VD: 20–23/10, 2 lớn 2 trẻ, gần biển, dưới 10 triệu" className="h-10 min-w-0 flex-1 rounded-lg border border-border bg-card px-3 text-sm" />
              <Button type="submit" aria-label="Gửi"><Send className="size-4" /></Button>
            </form>
          </div>
        </section>
      )}
    </>
  )
}

function Chip({ children, icon, onClick, onRemove }: { children: React.ReactNode; icon?: React.ReactNode; onClick?: () => void; onRemove?: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-brand dark:text-brand-accent">
      {onClick ? <button type="button" onClick={onClick} className="inline-flex items-center gap-1 underline-offset-2 hover:underline">{icon}{children}</button> : <>{icon}{children}</>}
      {onRemove && <button type="button" onClick={onRemove} aria-label="Bỏ tiêu chí" className="ml-0.5 rounded-full hover:bg-white/50"><X className="size-3" /></button>}
    </span>
  )
}

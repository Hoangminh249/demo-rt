'use client'
// Tab "Lịch giá & tồn" (Postgres của Rooty): lịch tháng của một hạng phòng — giá từng đêm của gói đang chọn + phòng web còn bán.
// Sửa hàng loạt theo khoảng ngày + thứ (giá, số phòng bán web, đóng/mở, ở tối thiểu/tối đa, chặn đến/đi), quy tắc giá + "Sinh giá".
// Website đọc đúng các bảng này.
import { useState, type FormEvent } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { CARD, Empty, LoadFailed, Skel, shortVnd, vnd } from '@/components/admin/ui'
import { Field, INPUT, Notice, WeekdayPicker, parseInt0, parseMoney, parseTri, weekdayText } from '@/components/admin/form'
import { adminErrorText, useAdminPlans, useAdminRates, useAdminWrite } from '@/hooks/use-admin'
import { addDays, fmtDate, today } from '@/lib/format'
import { datesIn, weekdayOf } from '@/lib/pricing'
import type { AdminRates, DbPlan } from '@/types/admin'

type RoomCal = AdminRates['roomTypes'][number]

const monthStart = (iso: string) => `${iso.slice(0, 7)}-01`
const shiftMonth = (first: string, n: number) => { const [y, m] = first.split('-').map(Number); const d = new Date(Date.UTC(y, m - 1 + n, 1)); return d.toISOString().slice(0, 10) }
const monthEnd = (first: string) => addDays(shiftMonth(first, 1), -1)
const monthLabel = (first: string) => `Tháng ${Number(first.slice(5, 7))}/${first.slice(0, 4)}`
const HEAD = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

/** Không đọc được DB: 503 → câu cụ thể (chưa có DB / service tắt), lỗi khác → nút thử lại. */
export function DbFailed({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const status = (error as { response?: { status?: number } })?.response?.status
  return status === 503 ? <Notice ok={false}>{adminErrorText(error)}</Notice> : <LoadFailed onRetry={onRetry} />
}

function Cell({ day, rt, plan, inRange, onPick }: { day: string; rt: RoomCal; plan: RoomCal['plans'][number] | undefined; inRange: boolean; onPick: (d: string) => void }) {
  const inv = rt.inventory[day]
  const price = plan?.rates[day]
  const past = day < today()
  const left = inv ? inv.allotment - inv.booked - inv.held : 0
  const sold = inv ? inv.booked + inv.held : 0
  const selling = !!inv && !inv.closed && price != null && left > 0
  if (past) return <div className="min-h-14 p-1.5 text-sm text-muted-foreground/60 sm:min-h-[84px] tabular-nums sm:p-2" aria-hidden>{Number(day.slice(8))}</div>
  return (
    <button type="button" onClick={() => onPick(day)} aria-pressed={inRange}
      aria-label={`${fmtDate(day)}: ${price != null ? vnd(price) : 'chưa có giá'}, ${inv ? (inv.closed ? 'đóng' : `còn ${left}/${inv.allotment} phòng web`) : 'chưa mở bán'}`}
      className={cn('relative flex min-h-[72px] min-w-0 flex-col items-stretch gap-0.5 rounded-xl border p-1 text-left text-[10px] leading-tight transition-colors sm:min-h-[84px] sm:p-2 sm:text-xs',
        'hover:border-foreground/40', inRange ? 'border-foreground ring-1 ring-foreground' : 'border-border',
        !inv ? 'border-dashed bg-card' : inv.closed ? 'bg-zinc-100' : selling ? 'bg-card' : 'bg-amber-50/60')}>
      <span className="flex items-center justify-between gap-1">
        <span className="text-xs font-semibold tabular-nums sm:text-sm">{Number(day.slice(8))}</span>
        {inv?.closed && <span className="rounded bg-zinc-300 px-1 text-[9px] font-medium sm:text-[10px]">Đóng</span>}
      </span>
      {/* Điện thoại: giá theo triệu (2,72), phòng "1/1"; từ sm: "2,72 tr", "còn 1/1 · đặt 1" */}
      <span className={cn('truncate font-medium tabular-nums', price == null && 'text-red-600')}>
        {price != null ? <><span className="sm:hidden">{(price / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 2 })}</span><span className="hidden sm:inline">{shortVnd(price)}</span></> : '—'}
      </span>
      <span className="truncate text-muted-foreground tabular-nums">
        {inv ? <><span className="hidden sm:inline">còn </span>{left}/{inv.allotment}</> : <span className="hidden sm:inline">chưa mở</span>}
        {sold > 0 && <span className="hidden text-foreground sm:inline"> · đặt {sold}</span>}
      </span>
      {inv && (inv.minStay > 1 || inv.maxStay || inv.cta || inv.ctd) && (
        <span className="hidden truncate text-[10px] text-muted-foreground sm:block">
          {[inv.minStay > 1 && `≥${inv.minStay}đ`, inv.maxStay && `≤${inv.maxStay}đ`, inv.cta && 'chặn đến', inv.ctd && 'chặn đi'].filter(Boolean).join(' · ')}
        </span>
      )}
    </button>
  )
}

function BulkForm({ rt, planId, range, setRange }: {
  rt: RoomCal; planId: string | undefined
  range: { from: string; to: string; weekdays: number[] }; setRange: (r: { from: string; to: string; weekdays: number[] }) => void
}) {
  const write = useAdminWrite()
  const [clearPrice, setClearPrice] = useState(false)
  const n = range.from <= range.to ? datesIn(range.from, range.to, range.weekdays).length : 0

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    const maxRaw = String(fd.get('maxStay') ?? '')
    write.mutate({
      op: 'bulk', roomTypeId: rt.id, ratePlanId: planId, ...range,
      price: clearPrice ? null : parseMoney(fd.get('price')),
      allotment: parseInt0(fd.get('allotment')),
      closed: parseTri(fd.get('closed')),
      minStay: parseInt0(fd.get('minStay')),
      maxStay: maxRaw === 'none' ? null : parseInt0(maxRaw),
      closedToArrival: parseTri(fd.get('cta')),
      closedToDeparture: parseTri(fd.get('ctd')),
    }, { onSuccess: () => { form.reset(); setClearPrice(false) } })
  }

  return (
    <form onSubmit={submit} className={`${CARD} grid content-start gap-4 p-5`}>
      <div>
        <h3 className="text-sm font-semibold">Sửa hàng loạt</h3>
        <p className="mt-0.5 text-xs text-pretty text-muted-foreground">Bấm một ngày trên lịch để chọn nhanh. Ô bỏ trống = giữ nguyên.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Từ ngày"><input type="date" required className={INPUT} value={range.from} min={today()} onChange={e => setRange({ ...range, from: e.target.value, to: e.target.value > range.to ? e.target.value : range.to })} /></Field>
        <Field label="Đến ngày"><input type="date" required className={INPUT} value={range.to} min={range.from} onChange={e => setRange({ ...range, to: e.target.value })} /></Field>
      </div>
      <WeekdayPicker value={range.weekdays} onChange={weekdays => setRange({ ...range, weekdays })} />
      <p className="-mt-2 text-xs text-muted-foreground tabular-nums">{n} ngày khớp</p>

      <Field label="Giá / đêm (VND)" hint="Áp cho gói đang chọn trên lịch.">
        <input name="price" inputMode="numeric" placeholder="Giữ nguyên" disabled={clearPrice} className={INPUT} />
      </Field>
      <label className="-mt-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={clearPrice} onChange={e => setClearPrice(e.target.checked)} className="size-4" />Xoá giá các đêm này (ngừng bán)</label>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Phòng bán web" hint={`Tối đa ${rt.totalRooms}`}><input name="allotment" type="number" min={0} max={rt.totalRooms} placeholder="Giữ nguyên" className={INPUT} /></Field>
        <Field label="Trạng thái">
          <select name="closed" className={INPUT} defaultValue=""><option value="">Giữ nguyên</option><option value="0">Mở bán</option><option value="1">Đóng</option></select>
        </Field>
      </div>
      {/* Ít dùng nên gập lại; ô bên trong vẫn gửi theo form khi đang gập (details chỉ ẩn). */}
      <details className="group">
        <summary className="flex h-9 cursor-pointer list-none items-center gap-2 text-sm font-medium text-foreground/80 hover:text-foreground [&::-webkit-details-marker]:hidden">
          <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden />Điều kiện lưu trú <span className="font-normal text-muted-foreground">· tối thiểu / tối đa, chặn ngày</span>
        </summary>
        <div className="mt-2 grid grid-cols-2 gap-3">
        <Field label="Ở tối thiểu (đêm)" hint="Tính theo ngày đến"><input name="minStay" type="number" min={1} max={60} placeholder="Giữ nguyên" className={INPUT} /></Field>
        <Field label="Ở tối đa (đêm)">
          <select name="maxStay" className={INPUT} defaultValue="">
            <option value="">Giữ nguyên</option><option value="none">Không giới hạn</option>
            {[1, 2, 3, 4, 5, 6, 7, 10, 14, 30].map(x => <option key={x} value={x}>{x} đêm</option>)}
          </select>
        </Field>
        <Field label="Chặn ngày đến">
          <select name="cta" className={INPUT} defaultValue=""><option value="">Giữ nguyên</option><option value="1">Chặn</option><option value="0">Bỏ chặn</option></select>
        </Field>
        <Field label="Chặn ngày đi">
          <select name="ctd" className={INPUT} defaultValue=""><option value="">Giữ nguyên</option><option value="1">Chặn</option><option value="0">Bỏ chặn</option></select>
        </Field>
        </div>
      </details>
      {write.isSuccess && <Notice ok>{write.data.message}</Notice>}
      {write.isError && <Notice ok={false}>{adminErrorText(write.error)}</Notice>}
      <Button type="submit" loading={write.isPending} disabled={!n} className="h-10">{`Áp dụng cho ${n} ngày`}</Button>
    </form>
  )
}

function RulesPanel({ plan }: { plan: DbPlan }) {
  const write = useAdminWrite()
  const [weekdays, setWeekdays] = useState<number[]>([])
  const [gen, setGen] = useState({ from: today(), to: addDays(today(), 89) })

  function addRule(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    const type = fd.get('type') === 'FIXED' ? 'FIXED' : 'PERCENT'
    write.mutate({
      op: 'rule.create', ratePlanId: plan.id, name: String(fd.get('name') ?? ''),
      startDate: String(fd.get('start')), endDate: String(fd.get('end')), weekdays, type,
      value: (type === 'FIXED' ? parseMoney(fd.get('value')) : parseInt0(fd.get('value'))) ?? NaN,
      priority: parseInt0(fd.get('priority')) ?? 0,
    }, { onSuccess: () => { form.reset(); setWeekdays([]) } })
  }

  return (
    <details className={`group ${CARD} overflow-hidden`}>
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-5 py-3 hover:bg-item-hover [&::-webkit-details-marker]:hidden">
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold">Quy tắc giá tự động <span className="font-normal text-muted-foreground">· {plan.name.vi} · {plan.rules.length} quy tắc</span></p>
          <p className="mt-0.5 text-[13px] text-pretty text-muted-foreground">Không bắt buộc. Dùng khi muốn sinh giá nhiều tháng theo giá gốc (+% cuối tuần, giá lễ…) thay vì sửa tay trên lịch.</p>
        </div>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="flex flex-wrap items-start justify-between gap-3 border-t border-border px-5 pt-4">
        <div>
          <p className="mt-0.5 text-xs text-pretty text-muted-foreground">
            Giá gốc {plan.basePrice != null ? vnd(plan.basePrice) : 'chưa đặt (quy tắc % cần giá gốc — sửa ở Hạng phòng → Gói giá)'}. Đêm khớp nhiều quy tắc: ưu tiên cao nhất thắng; không khớp quy tắc nào: giá gốc.
          </p>
        </div>
      </div>
      {plan.rules.length ? (
        <ul className="mt-3 divide-y divide-border border-y border-border">
          {plan.rules.map(r => (
            <li key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-2.5 text-sm">
              <span className="min-w-0 flex-1 font-medium">{r.name}</span>
              <span className="text-muted-foreground tabular-nums">{fmtDate(r.startDate)} – {fmtDate(r.endDate)} · {weekdayText(r.weekdays)}</span>
              <span className="tabular-nums">{r.type === 'FIXED' ? vnd(r.value) : `${r.value > 0 ? '+' : ''}${r.value}%`}</span>
              <span className="text-xs text-muted-foreground tabular-nums">ưu tiên {r.priority}</span>
              <button type="button" aria-label={`Xoá quy tắc ${r.name}`} disabled={write.isPending}
                onClick={() => confirm(`Xoá quy tắc "${r.name}"? Giá đã sinh giữ nguyên.`) && write.mutate({ op: 'rule.delete', id: r.id })}
                className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-item-hover hover:text-red-600"><Trash2 className="size-4" /></button>
            </li>
          ))}
        </ul>
      ) : <Empty>Chưa có quy tắc nào.</Empty>}

      <form onSubmit={addRule} className="grid gap-3 px-5 py-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Tên" className="sm:col-span-2"><input name="name" required maxLength={80} placeholder="Cuối tuần, Lễ 30/4…" className={INPUT} /></Field>
        <Field label="Từ"><input name="start" type="date" required className={INPUT} /></Field>
        <Field label="Đến"><input name="end" type="date" required className={INPUT} /></Field>
        <div className="sm:col-span-2"><WeekdayPicker value={weekdays} onChange={setWeekdays} /></div>
        <Field label="Loại"><select name="type" className={INPUT} defaultValue="PERCENT"><option value="PERCENT">± % trên giá gốc</option><option value="FIXED">Giá cố định (VND)</option></select></Field>
        <Field label="Giá trị" hint="% (vd 20, -10) hoặc VND"><input name="value" required inputMode="numeric" className={INPUT} /></Field>
        <Field label="Ưu tiên"><input name="priority" type="number" min={0} max={100} defaultValue={0} className={INPUT} /></Field>
        <div className="flex items-end sm:col-span-2 lg:col-span-3"><Button type="submit" variant="outline" loading={write.isPending} className="h-10">Thêm quy tắc</Button></div>
      </form>

      <div className="flex flex-wrap items-end gap-3 border-t border-border bg-muted/40 px-5 py-4">
        <Field label="Sinh giá từ"><input type="date" className={INPUT} value={gen.from} onChange={e => setGen({ ...gen, from: e.target.value })} /></Field>
        <Field label="đến"><input type="date" className={INPUT} value={gen.to} min={gen.from} onChange={e => setGen({ ...gen, to: e.target.value })} /></Field>
        <Button type="button" loading={write.isPending}
          onClick={() => confirm(`Ghi đè giá gói "${plan.name.vi}" từ ${fmtDate(gen.from)} đến ${fmtDate(gen.to)} theo quy tắc + giá gốc?`) && write.mutate({ op: 'generate', ratePlanId: plan.id, ...gen })}
          className="h-10">Sinh giá</Button>
        <p className="w-full text-xs text-muted-foreground">Ghi đè các đêm tính được; đêm không tính được (thiếu giá gốc) giữ nguyên.</p>
      </div>
      {(write.isSuccess || write.isError) && <div className="px-5 pb-4">{write.isSuccess ? <Notice ok>{write.data.message}</Notice> : <Notice ok={false}>{adminErrorText(write.error)}</Notice>}</div>}
    </details>
  )
}

export function RatesPanel({ slug }: { slug: string }) {
  const [month, setMonth] = useState(() => monthStart(today()))
  const from = month
  const to = monthEnd(month)
  const rates = useAdminRates(slug, from, to)
  const plans = useAdminPlans(slug)
  const [rtId, setRtId] = useState<string>()
  const [planId, setPlanId] = useState<string>()
  const [range, setRange] = useState({ from: today(), to: today(), weekdays: [] as number[] })
  const [anchor, setAnchor] = useState<string | null>(null)

  if (rates.isPending) return <div className={`${CARD} grid gap-3 p-5`}>{[0, 1, 2, 3].map(i => <Skel key={i} className="h-20" />)}</div>
  if (rates.isError || !rates.data) return <DbFailed error={rates.error} onRetry={() => rates.refetch()} />
  const rts = rates.data.roomTypes
  if (!rts.length) return <section className={CARD}><Empty>Khách sạn chưa có hạng phòng trong DB. Chạy yarn db:seed.</Empty></section>
  const rt = rts.find(r => r.id === rtId) ?? rts[0]
  const plan = rt.plans.find(p => p.id === planId) ?? rt.plans.find(p => p.isDefault) ?? rt.plans[0]
  const fullPlan = plans.data?.roomTypes.find(r => r.id === rt.id)?.plans.find(p => p.id === plan?.id)

  const days = datesIn(from, to)
  const lead = (weekdayOf(from) + 6) % 7 // ô trống trước ngày 1 (tuần bắt đầu T2)
  const picked = new Set(range.from <= range.to ? datesIn(range.from, range.to, range.weekdays) : [])
  // Bấm lần 1 = ngày đầu (neo), lần 2 = ngày cuối (sau ngày neo); bấm ngày trước neo thì neo lại từ đó.
  const pick = (d: string) => {
    if (anchor && d >= anchor) { setRange({ ...range, from: anchor, to: d }); setAnchor(null) }
    else { setRange({ ...range, from: d, to: d }); setAnchor(d) }
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {rts.map(r => (
          <button key={r.id} type="button" aria-pressed={r.id === rt.id} onClick={() => { setRtId(r.id); setPlanId(undefined) }}
            className={cn('h-9 rounded-full border px-3.5 text-sm font-medium', r.id === rt.id ? 'border-foreground bg-foreground text-background' : 'border-border-strong bg-card hover:bg-item-hover')}>
            {r.name.vi} <span className="font-normal opacity-70 tabular-nums">· {r.totalRooms}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className={`${CARD} min-w-0 p-3 sm:p-5`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="icon" aria-label="Tháng trước" onClick={() => setMonth(shiftMonth(month, -1))}><ChevronLeft /></Button>
              <h3 className="min-w-32 text-center text-sm font-semibold tabular-nums" aria-live="polite">{monthLabel(month)}</h3>
              <Button type="button" variant="ghost" size="icon" aria-label="Tháng sau" onClick={() => setMonth(shiftMonth(month, 1))}><ChevronRight /></Button>
            </div>
            {rt.plans.length > 1 ? (
              <label className="flex items-center gap-2 text-sm">Gói
                <select value={plan?.id} onChange={e => setPlanId(e.target.value)} className={`${INPUT} w-auto`}>
                  {rt.plans.map(p => <option key={p.id} value={p.id}>{p.name.vi}{p.active ? '' : ' (ngừng bán)'}</option>)}
                </select>
              </label>
            ) : <span className="text-sm text-muted-foreground">Gói: {plan ? plan.name.vi : 'chưa có'}</span>}
          </div>
          <div className={cn('mt-3 grid grid-cols-7 gap-1 sm:gap-1.5', rates.isPlaceholderData && 'opacity-60')}>
            {HEAD.map(h => <div key={h} className="pb-1 text-center text-xs font-medium text-muted-foreground">{h}</div>)}
            {Array.from({ length: lead }, (_, i) => <div key={`e${i}`} />)}
            {days.map(d => <Cell key={d} day={d} rt={rt} plan={plan} inRange={picked.has(d)} onPick={pick} />)}
          </div>
          <p className="mt-3 text-xs text-pretty text-muted-foreground">
            “còn x/y”: phòng web còn bán / số phòng chia cho web (phần còn lại bán OTA qua Gohost). “—”: chưa có giá. Viền đứt: chưa mở bán · nền xám: đóng · nền vàng: chưa bán được (thiếu giá hoặc hết phòng).
          </p>
        </section>
        <BulkForm key={rt.id} rt={rt} planId={plan?.id} range={range} setRange={setRange} />
      </div>

      {fullPlan ? <RulesPanel key={fullPlan.id} plan={fullPlan} /> : plans.isError ? <DbFailed error={plans.error} onRetry={() => plans.refetch()} /> : null}
    </div>
  )
}

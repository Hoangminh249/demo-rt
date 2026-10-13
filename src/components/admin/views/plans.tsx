'use client'
// Gói giá (Postgres của Rooty): RoomPlans = gói của một hạng phòng (trang hạng phòng), PoliciesPanel = chính sách huỷ, cọc dùng chung (tab Cài đặt).
// Sửa chính sách không đổi booking cũ (booking giữ ảnh chụp chính sách lúc đặt). Form mở tại chỗ bằng <details>.
import { useState, type FormEvent, type ReactNode } from 'react'
import { ChevronDown, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge, CARD, Empty, Skel, vnd } from '@/components/admin/ui'
import { Field, INPUT, Notice, parseInt0, parseMoney } from '@/components/admin/form'
import { adminErrorText, useAdminPlans, useAdminWrite } from '@/hooks/use-admin'
import { DEPOSIT_TYPES, MEAL_PLANS, type Command } from '@/lib/admin-commands'
import type { AdminPlans, DbCancelPolicy, DbDepositPolicy, DbPlan } from '@/types/admin'
import { DbFailed } from './rates'

const MEAL: Record<DbPlan['mealPlan'], string> = { RO: 'Chỉ phòng', BB: 'Ăn sáng', HB: 'Ăn sáng + 1 bữa', FB: 'Ăn 3 bữa', AI: 'Trọn gói' }
const DEPOSIT: Record<DbDepositPolicy['type'], string> = { PERCENT: 'Cọc %', FIXED: 'Cọc số tiền cố định', FIRST_NIGHT: 'Cọc đêm đầu', FULL: 'Trả đủ' }
const depositText = (d: Pick<DbDepositPolicy, 'type' | 'value'>) => d.type === 'PERCENT' ? `Cọc ${d.value}%` : d.type === 'FIXED' ? `Cọc ${vnd(d.value)}` : DEPOSIT[d.type]
const tiersText = (c: Pick<DbCancelPolicy, 'tiers' | 'noShowPercent'>) =>
  [...c.tiers].sort((a, b) => b.daysBefore - a.daysBefore).map(t => `≥ ${t.daysBefore} ngày: ${t.penaltyPercent}%`).join(' · ') + ` · không đến: ${c.noShowPercent}%`

/** Một dòng có thể mở ra form sửa. `summary` là nội dung dòng khi đóng. */
function Row({ summary, children, open }: { summary: ReactNode; children: ReactNode; open?: boolean }) {
  return (
    <details className="group" open={open}>
      <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 px-5 py-2.5 hover:bg-item-hover [&::-webkit-details-marker]:hidden">
        <div className="min-w-0 flex-1">{summary}</div>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="border-t border-border bg-muted/40 px-5 py-4">{children}</div>
    </details>
  )
}

/** Form gửi một lệnh; hiện kết quả ngay dưới. `build` đọc FormData → lệnh (server kiểm lại bằng zod). */
function CommandForm({ build, submit, danger, children }: {
  build: (fd: FormData) => Command; submit: string; children: ReactNode
  danger?: { label: string; confirm: string; cmd: Command }
}) {
  const write = useAdminWrite()
  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    write.mutate(build(new FormData(e.currentTarget)))
  }
  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      {children}
      {write.isSuccess && <Notice ok>{write.data.message}</Notice>}
      {write.isError && <Notice ok={false}>{adminErrorText(write.error)}</Notice>}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" loading={write.isPending} className="h-10">{submit}</Button>
        {danger && (
          <Button type="button" variant="outline" disabled={write.isPending} className="h-10 text-red-700"
            onClick={() => confirm(danger.confirm) && write.mutate(danger.cmd)}><Trash2 aria-hidden />{danger.label}</Button>
        )}
      </div>
    </form>
  )
}

function PlanForm({ roomTypeId, plan, policies }: { roomTypeId: string; plan?: DbPlan; policies: Pick<AdminPlans, 'cancellation' | 'deposit'> }) {
  const build = (fd: FormData): Command => ({
    op: 'plan.save', id: plan?.id, roomTypeId,
    code: String(fd.get('code') ?? '').trim().toUpperCase(),
    name: { vi: String(fd.get('vi') ?? ''), en: String(fd.get('en') ?? '') || undefined },
    mealPlan: fd.get('meal') as DbPlan['mealPlan'],
    refundable: fd.get('refundable') === 'on',
    basePrice: parseMoney(fd.get('base')) ?? null,
    extraAdultFee: parseMoney(fd.get('xa')) ?? 0,
    extraChildFee: parseMoney(fd.get('xc')) ?? 0,
    cancellationPolicyId: String(fd.get('cancel')),
    depositPolicyId: String(fd.get('deposit')),
    isDefault: fd.get('default') === 'on',
    active: fd.get('active') === 'on',
  })
  return (
    <CommandForm build={build} submit={plan ? 'Lưu gói' : 'Tạo gói'}
      danger={plan && { label: 'Xoá gói', confirm: `Xoá gói "${plan.name.vi}" và toàn bộ lịch giá của gói? Gói đã có booking thì chỉ ngừng bán.`, cmd: { op: 'plan.delete', id: plan.id } }}>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Tên gói (tiếng Việt)"><input name="vi" required defaultValue={plan?.name.vi} maxLength={200} placeholder="Gồm ăn sáng" className={INPUT} /></Field>
        <Field label="Tên gói (English)"><input name="en" defaultValue={plan?.name.en} maxLength={200} placeholder="Breakfast included" className={INPUT} /></Field>
        <Field label="Bữa ăn">
          <select name="meal" defaultValue={plan?.mealPlan ?? 'BB'} className={INPUT}>{MEAL_PLANS.map(m => <option key={m} value={m}>{MEAL[m]}</option>)}</select>
        </Field>
        <Field label="Giá gốc / đêm (VND)" hint="Dùng cho quy tắc giá %; bỏ trống được"><input name="base" inputMode="numeric" defaultValue={plan?.basePrice ?? ''} className={INPUT} /></Field>
        <Field label="Phụ thu người lớn / đêm"><input name="xa" inputMode="numeric" defaultValue={plan?.extraAdultFee ?? 0} className={INPUT} /></Field>
        <Field label="Phụ thu trẻ em / đêm"><input name="xc" inputMode="numeric" defaultValue={plan?.extraChildFee ?? 0} className={INPUT} /></Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Chính sách huỷ">
          <select name="cancel" required defaultValue={plan?.cancellationPolicyId ?? policies.cancellation[0]?.id} className={INPUT}>
            {policies.cancellation.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Chính sách cọc">
          <select name="deposit" required defaultValue={plan?.depositPolicyId ?? policies.deposit[0]?.id} className={INPUT}>
            {policies.deposit.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </Field>
        <Field label="Mã gói (nội bộ)" hint="Chữ in hoa, số, - _"><input name="code" required defaultValue={plan?.code} maxLength={20} placeholder="BB" className={INPUT} /></Field>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" name="refundable" defaultChecked={plan?.refundable ?? true} className="size-4" />Cho hoàn huỷ</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="default" defaultChecked={plan?.isDefault ?? false} className="size-4" />Gói mặc định của hạng</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="active" defaultChecked={plan?.active ?? true} className="size-4" />Đang bán</label>
      </div>
    </CommandForm>
  )
}

function TiersInput({ initial }: { initial: DbCancelPolicy['tiers'] }) {
  const [rows, setRows] = useState(initial.length ? initial : [{ daysBefore: 7, penaltyPercent: 50 }])
  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-medium">Mốc phạt <span className="font-normal text-muted-foreground">· huỷ khi còn ≥ N ngày trước ngày đến → phạt %</span></legend>
      {rows.map((r, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2 text-sm">
          ≥ <input name="days" type="number" min={0} max={365} required defaultValue={r.daysBefore} aria-label={`Mốc ${i + 1}: số ngày`} className={`${INPUT} w-24`} /> ngày →
          phạt <input name="pct" type="number" min={0} max={100} required defaultValue={r.penaltyPercent} aria-label={`Mốc ${i + 1}: % phạt`} className={`${INPUT} w-24`} /> %
          {rows.length > 1 && <button type="button" aria-label={`Bỏ mốc ${i + 1}`} onClick={() => setRows(rows.filter((_, j) => j !== i))} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-item-hover"><Trash2 className="size-4" /></button>}
        </div>
      ))}
      {rows.length < 10 && <button type="button" onClick={() => setRows([...rows, { daysBefore: 0, penaltyPercent: 100 }])} className="inline-flex w-fit items-center gap-1 text-sm font-medium text-primary hover:underline"><Plus className="size-4" />Thêm mốc</button>}
    </fieldset>
  )
}

function CancelForm({ c }: { c?: DbCancelPolicy }) {
  const build = (fd: FormData): Command => {
    const days = fd.getAll('days').map(Number)
    const pct = fd.getAll('pct').map(Number)
    const en = String(fd.get('en') ?? '')
    return {
      op: 'cancel.save', id: c?.id, name: String(fd.get('name') ?? ''),
      description: String(fd.get('vi') ?? '') ? { vi: String(fd.get('vi')), en: en || undefined } : undefined,
      tiers: days.map((d, i) => ({ daysBefore: d, penaltyPercent: pct[i] })),
      noShowPercent: parseInt0(fd.get('noshow')) ?? 100,
    }
  }
  return (
    <CommandForm build={build} submit={c ? 'Lưu chính sách' : 'Tạo chính sách'}
      danger={c && { label: 'Xoá', confirm: `Xoá chính sách "${c.name}"?`, cmd: { op: 'cancel.delete', id: c.id } }}>
      <Field label="Tên (nội bộ)"><input name="name" required maxLength={120} defaultValue={c?.name} className={INPUT} /></Field>
      <TiersInput initial={c?.tiers ?? []} />
      <Field label="Không đến (no-show): phạt %"><input name="noshow" type="number" min={0} max={100} defaultValue={c?.noShowPercent ?? 100} className={`${INPUT} w-28`} /></Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Câu cho khách (VI)" hint="Hiện cạnh gói giá; bỏ trống được"><textarea name="vi" rows={2} maxLength={200} defaultValue={c?.description?.vi} className={`${INPUT} h-auto py-2`} /></Field>
        <Field label="Câu cho khách (EN)"><textarea name="en" rows={2} maxLength={200} defaultValue={c?.description?.en} className={`${INPUT} h-auto py-2`} /></Field>
      </div>
    </CommandForm>
  )
}

function DepositForm({ d }: { d?: DbDepositPolicy }) {
  const build = (fd: FormData): Command => ({
    op: 'deposit.save', id: d?.id, name: String(fd.get('name') ?? ''),
    type: fd.get('type') as DbDepositPolicy['type'],
    value: parseMoney(fd.get('value')) ?? 0,
    holdMinutes: parseInt0(fd.get('hold')) ?? 15,
    balanceDueDaysBefore: parseInt0(fd.get('due')) ?? 0,
  })
  return (
    <CommandForm build={build} submit={d ? 'Lưu chính sách' : 'Tạo chính sách'}
      danger={d && { label: 'Xoá', confirm: `Xoá chính sách "${d.name}"?`, cmd: { op: 'deposit.delete', id: d.id } }}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Tên (nội bộ)" className="sm:col-span-2"><input name="name" required maxLength={120} defaultValue={d?.name} className={INPUT} /></Field>
        <Field label="Kiểu"><select name="type" defaultValue={d?.type ?? 'PERCENT'} className={INPUT}>{DEPOSIT_TYPES.map(t => <option key={t} value={t}>{DEPOSIT[t]}</option>)}</select></Field>
        <Field label="Giá trị" hint="% hoặc VND; đêm đầu / trả đủ: bỏ qua"><input name="value" inputMode="numeric" defaultValue={d?.value ?? 30} className={INPUT} /></Field>
        <Field label="Giữ phòng (phút)"><input name="hold" type="number" min={5} max={120} defaultValue={d?.holdMinutes ?? 15} className={INPUT} /></Field>
        <Field label="Hạn trả phần còn lại" hint="Số ngày trước ngày đến; 0 = tại quầy"><input name="due" type="number" min={0} max={60} defaultValue={d?.balanceDueDaysBefore ?? 0} className={INPUT} /></Field>
      </div>
    </CommandForm>
  )
}

function Section({ title, desc, children }: { title: string; desc?: string; children: ReactNode }) {
  return (
    <section className={`${CARD} overflow-hidden`}>
      <div className="px-5 pt-5 pb-3"><h3 className="text-[15px] font-semibold">{title}</h3>{desc && <p className="mt-0.5 text-[13px] text-pretty text-muted-foreground">{desc}</p>}</div>
      <div className="divide-y divide-border border-t border-border">{children}</div>
    </section>
  )
}

const add = (label: string) => <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary"><Plus className="size-4" aria-hidden />{label}</span>

/** Gói giá của một hạng phòng (trang chi tiết hạng phòng). */
export function RoomPlans({ slug, roomTypeId }: { slug: string; roomTypeId: string }) {
  const { data, isPending, isError, error, refetch } = useAdminPlans(slug)
  if (isPending) return <div className={`${CARD} grid gap-3 p-5`}>{[0, 1].map(i => <Skel key={i} className="h-12" />)}</div>
  if (isError || !data) return <DbFailed error={error} onRetry={() => refetch()} />
  const rt = data.roomTypes.find(r => r.id === roomTypeId)
  if (!rt) return <section className={CARD}><Empty>Không thấy hạng phòng.</Empty></section>
  const cancelName = (id: string) => data.cancellation.find(c => c.id === id)?.name ?? '—'
  const depositOf = (id: string) => data.deposit.find(d => d.id === id)
  return (
    <Section title="Gói giá" desc="Mỗi gói là một dòng giá khách chọn (vd có / không ăn sáng). Giá từng đêm nhập ở tab Giá & phòng trống.">
      {rt.plans.map(p => (
        <Row key={p.id} summary={
          <div className="grid gap-1 text-sm sm:flex sm:flex-wrap sm:items-center sm:gap-x-3">
            <span className="font-medium">{p.name.vi}</span>
            <span className="flex flex-wrap gap-1.5">
              <Badge tone="neutral">{MEAL[p.mealPlan]}</Badge>
              {p.isDefault && <Badge tone="ok">Mặc định</Badge>}
              {!p.active && <Badge tone="warn">Ngừng bán</Badge>}
            </span>
            <span className="text-[13px] text-muted-foreground tabular-nums sm:ml-auto">
              {cancelName(p.cancellationPolicyId)} · {depositOf(p.depositPolicyId) ? depositText(depositOf(p.depositPolicyId)!) : '—'}
            </span>
          </div>
        }>
          <PlanForm roomTypeId={rt.id} plan={p} policies={data} />
        </Row>
      ))}
      {!rt.plans.length && <Empty>Chưa có gói — hạng phòng này chưa bán được trên web.</Empty>}
      <Row summary={add('Thêm gói giá')}><PlanForm roomTypeId={rt.id} policies={data} /></Row>
    </Section>
  )
}

/** Chính sách huỷ + cọc dùng chung mọi khách sạn (tab Cài đặt). */
export function PoliciesPanel({ slug }: { slug: string }) {
  const { data, isPending, isError, error, refetch } = useAdminPlans(slug)
  if (isPending) return <div className={`${CARD} grid gap-3 p-5`}>{[0, 1, 2].map(i => <Skel key={i} className="h-12" />)}</div>
  if (isError || !data) return <DbFailed error={error} onRetry={() => refetch()} />
  return (
    <div className="grid gap-4">
      <Section title="Chính sách huỷ" desc="Dùng chung mọi khách sạn; gắn vào từng gói giá. Booking cũ giữ chính sách lúc đặt.">
        {data.cancellation.map(c => (
          <Row key={c.id} summary={<div className="text-sm"><p className="font-medium">{c.name} <span className="font-normal text-muted-foreground">· {c.used} gói</span></p><p className="text-[13px] text-muted-foreground tabular-nums">{tiersText(c)}</p></div>}>
            <CancelForm c={c} />
          </Row>
        ))}
        <Row summary={add('Thêm chính sách huỷ')}><CancelForm /></Row>
      </Section>
      <Section title="Chính sách cọc" desc="Phần còn lại trả tại quầy (admin ghi nhận ở Đặt phòng web).">
        {data.deposit.map(d => (
          <Row key={d.id} summary={<div className="text-sm"><p className="font-medium">{d.name} <span className="font-normal text-muted-foreground">· {d.used} gói</span></p><p className="text-[13px] text-muted-foreground">{depositText(d)} · giữ phòng {d.holdMinutes} phút · {d.balanceDueDaysBefore ? `trả nốt trước ${d.balanceDueDaysBefore} ngày` : 'trả nốt tại quầy'}</p></div>}>
            <DepositForm d={d} />
          </Row>
        ))}
        <Row summary={add('Thêm chính sách cọc')}><DepositForm /></Row>
      </Section>
    </div>
  )
}

'use client'
// Mảnh form dùng chung của admin (ghi Postgres): ô nhập gốc của trình duyệt (date, select, number) cho nhanh và dùng được trên điện thoại.
import { useState, type ReactNode } from 'react'
import { CircleAlert, CircleCheck } from 'lucide-react'
import { cn } from 'cn'

export const INPUT = 'h-10 w-full min-w-0 rounded-xl border border-border-strong bg-card px-3 text-sm outline-none focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-50'

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn('grid min-w-0 content-start gap-1.5', className)}>
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="text-xs text-pretty text-muted-foreground">{hint}</span>}
    </label>
  )
}

/** Thứ trong tuần: 0 = CN … 6 = T7, hiện theo thứ tự T2 → CN. Rỗng = mọi ngày. */
const DAYS: [number, string][] = [[1, 'T2'], [2, 'T3'], [3, 'T4'], [4, 'T5'], [5, 'T6'], [6, 'T7'], [0, 'CN']]
export const weekdayText = (w: number[]) => (!w.length || w.length === 7 ? 'Mọi ngày' : DAYS.filter(([d]) => w.includes(d)).map(([, l]) => l).join(', '))

export function WeekdayPicker({ value, onChange }: { value: number[]; onChange: (v: number[]) => void }) {
  return (
    <fieldset className="grid gap-1.5">
      <legend className="text-sm font-medium">Thứ <span className="font-normal text-muted-foreground">· không chọn = mọi ngày</span></legend>
      <div className="flex flex-wrap gap-1.5">
        {DAYS.map(([d, l]) => {
          const on = value.includes(d)
          return (
            <button key={d} type="button" aria-pressed={on} onClick={() => onChange(on ? value.filter(x => x !== d) : [...value, d])}
              className={cn('h-9 min-w-11 rounded-lg border px-2 text-sm font-medium transition-colors', on ? 'border-foreground bg-foreground text-background' : 'border-border-strong bg-card hover:bg-item-hover')}>
              {l}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

/** Kết quả lệnh ghi: xanh khi xong, đỏ khi bị từ chối (câu của server). */
export function Notice({ ok, children }: { ok: boolean; children: ReactNode }) {
  const Icon = ok ? CircleCheck : CircleAlert
  return (
    <p role={ok ? 'status' : 'alert'} className={cn('flex gap-2 rounded-xl px-3 py-2.5 text-sm text-pretty', ok ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700')}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />{children}
    </p>
  )
}

/** Số tiền gõ tự do ("2.720.000", "2720000") → số nguyên; rỗng → undefined. */
export const parseMoney = (v: FormDataEntryValue | null) => {
  const s = String(v ?? '').replace(/\D/g, '')
  return s ? Number(s) : undefined
}
/** Số nguyên (có thể âm) hoặc undefined khi rỗng. */
export const parseInt0 = (v: FormDataEntryValue | null) => {
  const s = String(v ?? '').trim()
  return s && /^-?\d+$/.test(s) ? Number(s) : undefined
}
/** Select ba trạng thái: '' = giữ nguyên, '1' = bật, '0' = tắt. */
export const parseTri = (v: FormDataEntryValue | null) => (v === '1' ? true : v === '0' ? false : undefined)

// ---------- Chữ hai ngôn ngữ + danh sách (form sản phẩm) ----------

export interface LValue { vi: string; en?: string }

/** Ô chữ hai ngôn ngữ: VI (bắt buộc khi `required`) | EN. `rows` > 1 → ô nhiều dòng. */
export function LInput({ label, value, onChange, rows = 1, required, hint }: { label: string; value: LValue | null | undefined; onChange: (v: LValue) => void; rows?: number; required?: boolean; hint?: string }) {
  const v = value ?? { vi: '' }
  const cls = rows > 1 ? `${INPUT} h-auto py-2` : INPUT
  const input = (lang: 'vi' | 'en') => {
    const props = { value: v[lang] ?? '', 'aria-label': `${label} (${lang.toUpperCase()})`, placeholder: lang.toUpperCase(), className: cls,
      onChange: (e: { target: { value: string } }) => onChange({ ...v, [lang]: e.target.value }) }
    return rows > 1 ? <textarea rows={rows} {...props} /> : <input required={required && lang === 'vi'} {...props} />
  }
  return (
    <div className="grid min-w-0 gap-1.5">
      <span className="text-sm font-medium">{label}{required && <span className="text-red-600"> *</span>}</span>
      <div className="grid gap-2 sm:grid-cols-2">{input('vi')}{input('en')}</div>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  )
}

/** Danh sách sửa được: thêm (khi có `make`), xoá, lên / xuống. `render(item, set)` vẽ một dòng. */
export function ListEditor<T>({ label, items, onChange, render, make, addLabel = 'Thêm', max = 50 }: {
  label: string; items: T[]; onChange: (v: T[]) => void; render: (item: T, set: (v: T) => void, i: number) => ReactNode; make?: () => T; addLabel?: string; max?: number
}) {
  const move = (i: number, d: number) => { const a = [...items]; const [x] = a.splice(i, 1); a.splice(i + d, 0, x); onChange(a) }
  const btn = 'grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-item-hover hover:text-foreground disabled:opacity-30'
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-1.5 text-sm font-medium">{label} <span className="font-normal text-muted-foreground tabular-nums">· {items.length}</span></legend>
      {items.map((it, i) => (
        <div key={i} className="flex items-start gap-2 rounded-xl border border-border bg-card p-2.5">
          <div className="min-w-0 flex-1">{render(it, v => onChange(items.map((x, j) => (j === i ? v : x))), i)}</div>
          <div className="flex shrink-0 flex-col">
            <button type="button" aria-label="Lên" disabled={i === 0} onClick={() => move(i, -1)} className={btn}>↑</button>
            <button type="button" aria-label="Xuống" disabled={i === items.length - 1} onClick={() => move(i, 1)} className={btn}>↓</button>
            <button type="button" aria-label="Xoá dòng" onClick={() => onChange(items.filter((_, j) => j !== i))} className={`${btn} hover:text-red-600`}>✕</button>
          </div>
        </div>
      ))}
      {make && items.length < max && <button type="button" onClick={() => onChange([...items, make()])} className="w-fit text-sm font-medium text-primary hover:underline">+ {addLabel}</button>}
    </fieldset>
  )
}

/** Ô JSON có kiểm cú pháp (phần nội dung phức tạp: đi lại, bảng trẻ em). Server kiểm hình dạng bằng zod khi lưu. */
export function JsonInput<T>({ label, value, onChange, hint, rows = 10 }: { label: string; value: T; onChange: (v: T) => void; hint?: string; rows?: number }) {
  const [text, setText] = useState(() => JSON.stringify(value, null, 2))
  const [err, setErr] = useState<string | null>(null)
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      <textarea rows={rows} spellCheck={false} value={text} className={`${INPUT} h-auto py-2 font-mono text-xs`}
        onChange={e => { setText(e.target.value); try { onChange(JSON.parse(e.target.value) as T); setErr(null) } catch { setErr('JSON chưa đúng cú pháp — chưa lưu phần này.') } }} />
      {err ? <span className="text-xs text-red-700">{err}</span> : hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </label>
  )
}

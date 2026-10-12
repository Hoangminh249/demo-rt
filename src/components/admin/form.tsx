'use client'
// Mảnh form dùng chung của admin (ghi Postgres): ô nhập gốc của trình duyệt (date, select, number) cho nhanh và dùng được trên điện thoại.
import type { ReactNode } from 'react'
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

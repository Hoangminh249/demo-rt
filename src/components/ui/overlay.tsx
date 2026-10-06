'use client'
// Dialog / Sheet dùng <dialog> gốc của trình duyệt (bẫy focus, Esc, backdrop sẵn) + Toast.
import { useEffect, useRef, useSyncExternalStore, type ReactNode } from 'react'
import { X, CheckCircle2, AlertTriangle, Info } from 'lucide-react'
import { Button, cn } from '.'

export function Dialog({ open, onClose, title, children, footer, side, wide }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; side?: 'bottom' | 'right'; wide?: boolean
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={e => { if (e.target === ref.current) onClose() }}
      aria-label={title}
      className={cn(
        'bg-surface text-fg shadow-2xl backdrop:backdrop-blur-[1px] p-0 m-auto max-h-[90vh] w-[calc(100%-2rem)] rounded-2xl',
        wide ? 'max-w-4xl' : 'max-w-lg',
        side === 'bottom' && 'mb-0 w-full max-w-none rounded-b-none max-h-[85vh]',
        side === 'right' && 'mr-0 h-full max-h-none w-full max-w-md rounded-none',
      )}
    >
      {open && (
        <div className="flex max-h-[inherit] flex-col">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <h2 className="font-semibold">{title}</h2>
            <button type="button" onClick={onClose} aria-label="Đóng" className="rounded-md p-1 text-muted hover:bg-surface-2"><X className="size-5" /></button>
          </div>
          <div className="overflow-y-auto px-5 py-4">{children}</div>
          {footer && <div className="flex justify-end gap-2 border-t border-border px-5 py-3">{footer}</div>}
        </div>
      )}
    </dialog>
  )
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Xác nhận', danger, onConfirm, onClose, children }: {
  open: boolean; title: string; message: ReactNode; confirmLabel?: string; danger?: boolean; onConfirm: () => void; onClose: () => void; children?: ReactNode
}) {
  return (
    <Dialog open={open} onClose={onClose} title={title}
      footer={<><Button variant="secondary" onClick={onClose}>Quay lại</Button><Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>{confirmLabel}</Button></>}>
      <div className="text-sm text-muted">{message}</div>
      {children}
    </Dialog>
  )
}

// ---- toast ----
type ToastItem = { id: number; text: string; kind: 'ok' | 'error' | 'info' }
let toasts: ToastItem[] = []
let tid = 0
const subs = new Set<() => void>()
const emit = () => subs.forEach(s => s())
export function toast(text: string, kind: ToastItem['kind'] = 'ok') {
  const id = ++tid
  toasts = [...toasts, { id, text, kind }]
  emit()
  setTimeout(() => { toasts = toasts.filter(t => t.id !== id); emit() }, 3500)
}
const EMPTY: ToastItem[] = []

export function Toaster() {
  const list = useSyncExternalStore(fn => { subs.add(fn); return () => { subs.delete(fn) } }, () => toasts, () => EMPTY)
  return (
    <div aria-live="polite" className="no-print pointer-events-none fixed bottom-4 left-1/2 z-[100] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 flex-col gap-2">
      {list.map(t => (
        <div key={t.id} className="pointer-events-auto flex items-start gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-fg shadow-lg">
          {t.kind === 'ok' ? <CheckCircle2 className="size-5 shrink-0 text-ok" /> : t.kind === 'error' ? <AlertTriangle className="size-5 shrink-0 text-danger" /> : <Info className="size-5 shrink-0 text-info" />}
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  )
}

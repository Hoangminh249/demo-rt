'use client'
// Dialog / panel trượt / hộp xác nhận / toast trên nền shadcn (Radix + sonner), giữ API cũ.
import type { ReactNode } from 'react'
import { TriangleAlert } from 'lucide-react'
import { toast as sonner } from 'sonner'
import { cn } from 'cn'
import { Button } from './button'
import { Dialog as UIDialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './dialog'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from './sheet'
import { Toaster as SonnerToaster } from './sonner'

export function Dialog({ open, onClose, title, children, footer, side, wide }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; side?: 'bottom' | 'right' | 'left'; wide?: boolean
}) {
  const onOpenChange = (o: boolean) => { if (!o) onClose() }
  if (side) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        {/* Panel trượt: vào 500ms, ra 350ms (luật khoá 12) */}
        <SheetContent side={side} className={cn('gap-0 bg-card data-closed:duration-350 data-open:duration-500',
          side === 'bottom' ? 'max-h-[88vh] rounded-t-2xl' : 'w-full sm:max-w-md')}>
          <SheetHeader className="border-b border-border px-5 py-4">
            <SheetTitle className="text-base font-semibold">{title}</SheetTitle>
            <SheetDescription className="sr-only">{title}</SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {footer && <SheetFooter className="flex-row justify-end gap-2 border-t border-border px-5 py-3">{footer}</SheetFooter>}
        </SheetContent>
      </Sheet>
    )
  }
  return (
    <UIDialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('max-h-[90vh] gap-0 overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-modal ring-0', wide ? 'sm:max-w-4xl' : 'sm:max-w-lg')}>
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-semibold">{title}</DialogTitle>
          <DialogDescription className="sr-only">{title}</DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer && <DialogFooter className="border-t border-border px-5 py-3">{footer}</DialogFooter>}
      </DialogContent>
    </UIDialog>
  )
}

/** Hộp xác nhận. Việc nguy hiểm (huỷ, xoá) tô đỏ như hộp xoá (luật khoá 3). */
export function ConfirmDialog({ open, title, message, confirmLabel = 'Xác nhận', danger, onConfirm, onClose, children }: {
  open: boolean; title: string; message: ReactNode; confirmLabel?: string; danger?: boolean; onConfirm: () => void; onClose: () => void; children?: ReactNode
}) {
  return (
    <UIDialog open={open} onOpenChange={o => { if (!o) onClose() }}>
      <DialogContent showCloseButton={false} className="rounded-2xl border border-border bg-card p-5 shadow-modal ring-0 sm:max-w-md">
        <DialogHeader className="flex-row items-start gap-3 text-left">
          {danger && <span className="grid size-10 shrink-0 place-items-center rounded-full bg-rose-500/10 text-rose-700"><TriangleAlert className="size-5" aria-hidden /></span>}
          <div className="min-w-0 space-y-1">
            <DialogTitle className="text-base font-semibold">{title}</DialogTitle>
            <DialogDescription asChild><div className="text-sm text-muted-foreground">{message}</div></DialogDescription>
          </div>
        </DialogHeader>
        {children}
        <DialogFooter className="mt-2 gap-2">
          <Button variant="outline" onClick={onClose}>Quay lại</Button>
          <Button variant={danger ? 'destructive' : 'default'} onClick={onConfirm}>{confirmLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </UIDialog>
  )
}

export function toast(text: string, kind: 'ok' | 'error' | 'info' = 'ok') {
  if (kind === 'error') sonner.error(text)
  else if (kind === 'info') sonner.info(text)
  else sonner.success(text)
}

export function Toaster() {
  return <SonnerToaster position="bottom-center" />
}

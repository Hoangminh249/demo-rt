'use client'
// Dialog gọn trên nền shadcn Dialog: tiêu đề, thân cuộn được, chân nút.
import type { ReactNode } from 'react'
import { cn } from 'cn'
import { Dialog as UIDialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './dialog'

export function Dialog({ open, onClose, title, children, footer, wide }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; wide?: boolean
}) {
  return (
    <UIDialog open={open} onOpenChange={o => { if (!o) onClose() }}>
      <DialogContent className={cn('max-h-[90vh] gap-0 overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-modal ring-0', wide ? 'sm:max-w-4xl' : 'sm:max-w-lg')}>
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="text-lg font-bold text-brand">{title}</DialogTitle>
          <DialogDescription className="sr-only">{title}</DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer && <DialogFooter className="gap-2 border-t border-border px-5 py-3">{footer}</DialogFooter>}
      </DialogContent>
    </UIDialog>
  )
}

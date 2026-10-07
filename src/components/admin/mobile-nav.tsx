'use client'
// Dưới lg: nút ☰ mở sidebar trượt từ trái (Sheet của dự án). Không nút ✕: đóng bằng bấm lớp phủ, Esc, hoặc bấm một link.
import { useState, type ReactNode } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'

export function MobileNav({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button type="button" variant="ghost" size="icon" className="lg:hidden" aria-label="Mở menu" onClick={() => setOpen(true)}>
        <Menu className="size-5" aria-hidden />
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" showCloseButton={false} className="w-[280px] gap-0 border-0 bg-card p-0 shadow-modal data-closed:duration-350 data-open:duration-500"
          onClick={e => { if ((e.target as HTMLElement).closest('a')) setOpen(false) }}>
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SheetDescription className="sr-only">Điều hướng admin</SheetDescription>
          {children}
        </SheetContent>
      </Sheet>
    </>
  )
}

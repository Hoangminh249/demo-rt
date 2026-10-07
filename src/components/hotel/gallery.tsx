'use client'
// Bộ ảnh đầu trang: 1 ảnh lớn + 4 ảnh nhỏ (điện thoại chỉ ảnh lớn), nút "Xem N ảnh" mở toàn bộ ảnh.
import { useState } from 'react'
import { Images } from 'lucide-react'
import { Dialog } from '@/components/ui/overlay'
import { Photo } from '@/components/site/kit'

const MORE = 'absolute right-3 bottom-3 inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-white px-4 text-[14px] font-semibold text-brand shadow-card hover:bg-mint'

export function Gallery({ name, images }: { name: string; images: string[] }) {
  const [open, setOpen] = useState(false)
  const more = <><Images className="size-4" aria-hidden />Xem {images.length} ảnh</>
  return (
    <>
      <div className="grid gap-2 sm:grid-cols-4 sm:grid-rows-2 sm:gap-3">
        <div className="relative sm:col-span-2 sm:row-span-2">
          <Photo src={images[0]} alt={name} priority sizes="(min-width: 640px) 50vw, 100vw" className="aspect-[4/3] w-full rounded-xl sm:aspect-auto sm:h-[440px]" />
          <button type="button" onClick={() => setOpen(true)} className={`${MORE} sm:hidden`}>{more}</button>
        </div>
        {images.slice(1, 5).map((src, i) => (
          <div key={src} className="relative hidden sm:block">
            <Photo src={src} alt={`${name} — ảnh ${i + 2}`} sizes="25vw" className="h-[214px] w-full rounded-xl" />
            {i === 3 && <button type="button" onClick={() => setOpen(true)} className={MORE}>{more}</button>}
          </div>
        ))}
      </div>
      <Dialog open={open} onClose={() => setOpen(false)} title={`Ảnh ${name}`} wide>
        <div className="grid gap-3 sm:grid-cols-2">
          {images.map((src, i) => <Photo key={src} src={src} alt={`${name} — ảnh ${i + 1}`} sizes="(min-width: 640px) 450px, 100vw" className="aspect-[4/3] w-full rounded-xl" />)}
        </div>
      </Dialog>
    </>
  )
}

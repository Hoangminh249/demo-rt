'use client'
// Bộ ảnh đầu trang: 1 ảnh lớn + 4 ảnh nhỏ (điện thoại chỉ ảnh lớn). Bấm ảnh nào mở lightbox đúng ảnh đó
// (yet-another-react-lightbox: vuốt, phím mũi tên, phóng to, dải ảnh nhỏ, bộ đếm).
import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Images } from 'lucide-react'
import Lightbox from 'yet-another-react-lightbox'
import Counter from 'yet-another-react-lightbox/plugins/counter'
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import 'yet-another-react-lightbox/styles.css'
import 'yet-another-react-lightbox/plugins/counter.css'
import 'yet-another-react-lightbox/plugins/thumbnails.css'
import { Photo } from '@/components/site/kit'

const MORE = 'absolute right-3 bottom-3 inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-white px-4 text-[14px] font-semibold text-brand shadow-card hover:bg-mint'
const TILE = 'group relative block w-full cursor-pointer overflow-hidden rounded-xl'
const VI_LABELS = { Previous: 'Ảnh trước', Next: 'Ảnh sau', Close: 'Đóng', 'Zoom in': 'Phóng to', 'Zoom out': 'Thu nhỏ', Lightbox: 'Xem ảnh', Carousel: 'Dải ảnh', Slide: 'Ảnh', Thumbnails: 'Ảnh nhỏ' }

export function Gallery({ name, images }: { name: string; images: string[] }) {
  const t = useTranslations('Hotel')
  const locale = useLocale()
  const [index, setIndex] = useState(-1)
  const alt = (i: number) => t('photoN', { name, n: i + 1 })
  const more = <><Images className="size-4" aria-hidden />{t('viewAll', { n: images.length })}</>
  const zoom = 'transition-transform duration-500 group-hover:scale-[1.03]'

  return (
    <>
      <div className="grid gap-2 sm:grid-cols-4 sm:grid-rows-2 sm:gap-3">
        <div className="relative sm:col-span-2 sm:row-span-2">
          <button type="button" onClick={() => setIndex(0)} className={TILE} aria-label={alt(0)}>
            <Photo src={images[0]} alt={name} priority sizes="(min-width: 640px) 50vw, 100vw" className={`aspect-[4/3] w-full sm:aspect-auto sm:h-[440px] ${zoom}`} />
          </button>
          <button type="button" onClick={() => setIndex(0)} className={`${MORE} sm:hidden`}>{more}</button>
        </div>
        {images.slice(1, 5).map((src, i) => (
          <div key={src} className="relative hidden sm:block">
            <button type="button" onClick={() => setIndex(i + 1)} className={TILE} aria-label={alt(i + 1)}>
              <Photo src={src} alt="" sizes="25vw" className={`h-[214px] w-full ${zoom}`} />
            </button>
            {i === 3 && <button type="button" onClick={() => setIndex(0)} className={MORE}>{more}</button>}
          </div>
        ))}
      </div>
      <Lightbox
        open={index >= 0}
        index={index}
        close={() => setIndex(-1)}
        slides={images.map((src, i) => ({ src, alt: alt(i) }))}
        plugins={[Counter, Thumbnails, Zoom]}
        labels={locale === 'vi' ? VI_LABELS : undefined}
        controller={{ closeOnBackdropClick: true }}
        thumbnails={{ width: 96, height: 64, border: 0, borderRadius: 8, padding: 0, gap: 8 }}
        styles={{ container: { backgroundColor: 'rgb(8 24 21 / 0.95)' }, thumbnailsContainer: { backgroundColor: 'rgb(8 24 21 / 0.95)' } }}
      />
    </>
  )
}

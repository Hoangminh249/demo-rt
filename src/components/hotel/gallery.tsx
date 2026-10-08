'use client'
// Bộ ảnh đầu trang. Trang khách sạn (từ 5 ảnh): 1 ảnh lớn + 4 ảnh nhỏ. Trang phòng (dưới 5 ảnh): mosaic 1 lớn + 1–3 ảnh bên phải.
// Điện thoại chỉ ảnh lớn. Bấm ảnh nào mở lightbox đúng ảnh đó (yet-another-react-lightbox: vuốt, phím mũi tên, phóng to,
// dải ảnh nhỏ, bộ đếm). Chưa có ảnh thì một khung "Ảnh đang cập nhật".
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
const TILE_M = 'group relative block w-full cursor-pointer overflow-hidden' // mosaic: khung ngoài bo góc
const VI_LABELS = { Previous: 'Ảnh trước', Next: 'Ảnh sau', Close: 'Đóng', 'Zoom in': 'Phóng to', 'Zoom out': 'Thu nhỏ', Lightbox: 'Xem ảnh', Carousel: 'Dải ảnh', Slide: 'Ảnh', Thumbnails: 'Ảnh nhỏ' }
// Mosaic: vị trí ảnh bên phải theo số ảnh (3 → 1 ngang trên + 2 ô dưới; 2 → 2 ô ngang; 1 → 1 ô cao).
const SPAN: Record<number, string[]> = { 3: ['sm:col-span-2', '', ''], 2: ['sm:col-span-2', 'sm:col-span-2'], 1: ['sm:col-span-2 sm:row-span-2'] }

export function Gallery({ name, images }: { name: string; images: string[] }) {
  const t = useTranslations('Hotel')
  const locale = useLocale()
  const [index, setIndex] = useState(-1)
  const alt = (i: number) => t('photoN', { name, n: i + 1 })
  const more = <><Images className="size-4" aria-hidden />{t('viewAll', { n: images.length })}</>
  const zoom = 'transition-transform duration-700 ease-out group-hover:scale-[1.04]'
  if (!images.length) return <Photo src={null} alt={name} className="aspect-[4/3] w-full rounded-xl sm:aspect-auto sm:h-[300px]" />

  const lightbox = (
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
  )

  if (images.length < 5) {
    const rest = images.slice(1, 4)
    return (
      <>
        <div className={`relative grid gap-2.5 overflow-hidden rounded-3xl sm:grid-rows-[250px_250px] ${rest.length ? 'sm:grid-cols-[7fr_3fr_3fr]' : ''}`}>
          <button type="button" onClick={() => setIndex(0)} className={`${TILE_M} sm:row-span-2`} aria-label={alt(0)}>
            <Photo src={images[0]} alt={name} priority sizes="(min-width: 640px) 55vw, 100vw" className={`aspect-[4/3] w-full sm:aspect-auto sm:h-full ${zoom}`} />
          </button>
          {rest.map((src, i) => (
            <button key={src} type="button" onClick={() => setIndex(i + 1)} className={`${TILE_M} hidden sm:block ${SPAN[rest.length][i]}`} aria-label={alt(i + 1)}>
              <Photo src={src} alt="" sizes="25vw" className={`h-full w-full ${zoom}`} />
            </button>
          ))}
          {images.length > 1 && (
            <button type="button" onClick={() => setIndex(0)} className="absolute right-4 bottom-4 inline-flex h-11 cursor-pointer items-center gap-2 rounded-full bg-white/95 px-4 text-[14px] font-semibold text-foreground shadow-[0_6px_18px_-8px_rgba(0,0,0,0.4)] hover:bg-white">{more}</button>
          )}
        </div>
        {lightbox}
      </>
    )
  }

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
      {lightbox}
    </>
  )
}

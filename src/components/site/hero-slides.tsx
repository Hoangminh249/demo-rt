'use client'
// Banner trang chủ: ảnh nền tự chuyển mỗi 5 giây (Embla + Autoplay), vuốt / kéo được — chỗ này sau sẽ là video.
// Bố cục theo màn hình: 70% trên là ảnh + tiêu đề, 30% dưới là dải kính (thanh chọn nhanh + những gì đã gồm) đè lên chân ảnh.
// Có nút tạm dừng (WCAG 2.2.2). Máy bật "giảm chuyển động" thì không tự chạy.
import Image from 'next/image'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { useTranslations } from 'next-intl'
import { ArrowRight, Pause, Play } from 'lucide-react'
import { cn } from 'cn'
import { Link } from '@/i18n/navigation'
import { CONTAINER } from './kit'

/** focus: object-position — điểm giữ lại khi ảnh bị cắt vào khung banner (ngang ở máy tính, dọc ở điện thoại). */
export interface Slide { src: string; focus: string; label?: string; href?: string }

export function HeroSlides({ slides, intro, bar, band }: { slides: Slide[]; intro: ReactNode; bar: ReactNode; band: ReactNode }) {
  const t = useTranslations('Home')
  const [emblaRef, api] = useEmblaCarousel({ loop: true, duration: 32 }, [
    Autoplay({ delay: 5000, stopOnInteraction: false, playOnInit: typeof window === 'undefined' || !window.matchMedia('(prefers-reduced-motion: reduce)').matches }),
  ])
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(true)

  useEffect(() => {
    if (!api) return
    const sync = () => { setIndex(api.selectedScrollSnap()); setPlaying(!!api.plugins().autoplay?.isPlaying()) }
    sync()
    api.on('select', sync).on('autoplay:play', sync).on('autoplay:stop', sync)
    return () => { api.off('select', sync).off('autoplay:play', sync).off('autoplay:stop', sync) }
  }, [api])

  const toggle = useCallback(() => {
    const ap = api?.plugins().autoplay
    if (ap) { if (ap.isPlaying()) ap.stop(); else ap.play() }
  }, [api])

  const current = slides[index]
  return (
    <section className="relative overflow-hidden bg-brand" aria-roledescription="carousel" aria-label={t('slides')}>
      <div ref={emblaRef} className="absolute inset-0 overflow-hidden">
        <div className="flex h-full touch-pan-y">
          {slides.map((s, i) => (
            <div key={s.src} className="relative h-full min-w-0 flex-[0_0_100%]" role="group" aria-roledescription="slide" aria-label={`${i + 1} / ${slides.length}${s.label ? `: ${s.label}` : ''}`}>
              <Image src={s.src} alt="" fill priority={i === 0} sizes="100vw" className="object-cover" style={{ objectPosition: s.focus }} />
            </div>
          ))}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[rgb(8_56_48/0.7)] via-[rgb(8_56_48/0.2)] to-[rgb(8_56_48/0.55)]" />

      <div className={`${CONTAINER} pointer-events-none relative flex h-[70svh] min-h-[460px] flex-col justify-end pt-28 pb-8`}>
        {intro}
        <div className="pointer-events-auto mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex items-center">
            {slides.map((s, i) => (
              <button key={s.src} type="button" onClick={() => api?.scrollTo(i)} aria-label={t('slideN', { n: i + 1 })} aria-current={i === index || undefined}
                className="grid size-8 cursor-pointer place-items-center">
                <span className={cn('h-2 rounded-full transition-all duration-300', i === index ? 'w-6 bg-yellow' : 'w-2 bg-white/60 hover:bg-white')} />
              </button>
            ))}
            <button type="button" onClick={toggle} aria-label={playing ? t('pause') : t('play')}
              className="ml-1 grid size-8 cursor-pointer place-items-center rounded-full text-white hover:bg-white/15">
              {playing ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
            </button>
          </div>
          {current?.label && (
            <p className="min-w-0 text-[14px] font-medium text-white/90">
              {current.href
                ? <Link href={current.href} className="inline-flex min-h-8 items-center gap-1 underline-offset-4 hover:underline">{current.label} <ArrowRight className="size-3.5" aria-hidden /></Link>
                : current.label}
            </p>
          )}
        </div>
      </div>

      <div className=" relative rounded-none border-x-0 border-b-0">
        <div className={`${CONTAINER} flex min-h-[30svh] flex-col justify-center gap-7 py-6`}>
          {bar}
          {band}
        </div>
      </div>
    </section>
  )
}

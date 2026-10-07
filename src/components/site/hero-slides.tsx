'use client'
// Banner trang chủ: ảnh nền tự chuyển mỗi 5 giây (Embla + Autoplay), vuốt / kéo được. Chữ và thanh chọn nhanh đứng yên phía trên.
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

export interface Slide { src: string; label: string; href?: string }

export function HeroSlides({ slides, intro, bar }: { slides: Slide[]; intro: ReactNode; bar: ReactNode }) {
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
            <div key={s.src} className="relative h-full min-w-0 flex-[0_0_100%]" role="group" aria-roledescription="slide" aria-label={`${i + 1} / ${slides.length}: ${s.label}`}>
              <Image src={s.src} alt="" fill priority={i === 0} sizes="100vw" className="object-cover" />
            </div>
          ))}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-black/5" />
      {/* Lớp tối trên cùng để chữ header trong suốt đọc được trên ảnh trời sáng */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/50 to-transparent" />

      <div className={`${CONTAINER} pointer-events-none relative flex min-h-[560px] flex-col justify-end pt-28 pb-10 lg:min-h-[640px]`}>
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
          <p className="min-w-0 text-[14px] font-medium text-white/90">
            {current?.href
              ? <Link href={current.href} className="inline-flex min-h-8 items-center gap-1 underline-offset-4 hover:underline">{current.label} <ArrowRight className="size-3.5" aria-hidden /></Link>
              : current?.label}
          </p>
        </div>
        <div className="pointer-events-auto mt-4">{bar}</div>
      </div>
    </section>
  )
}

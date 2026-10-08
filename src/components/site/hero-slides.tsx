'use client'
// Banner trang chủ (canvas "Trang chủ", 08/10/2026): ảnh nền tự chuyển mỗi 5 giây (Embla + Autoplay), vuốt / kéo được.
// Chữ đứng yên phía trên; thanh tìm phòng do trang đặt ngay sau, đè lên mép dưới banner.
// Có nút tạm dừng (WCAG 2.2.2). Máy bật "giảm chuyển động" thì không tự chạy.
import Image from 'next/image'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { useTranslations } from 'next-intl'
import { Check, Pause, Play } from 'lucide-react'
import { cn } from 'cn'
import { CONTAINER } from './kit'

/** focus: object-position — điểm giữ lại khi ảnh bị cắt vào khung banner (ngang ở máy tính, dọc ở điện thoại). */
export interface Slide { src: string; focus: string; label: string }

// Tối bên trái (chữ) và hai mép trên (header trong suốt) / dưới (thanh tìm phòng).
const SCRIM = 'linear-gradient(90deg, rgb(4 38 32 / .78) 0%, rgb(4 38 32 / .45) 40%, rgb(4 38 32 / .05) 75%), linear-gradient(180deg, rgb(4 38 32 / .6) 0%, rgb(4 38 32 / 0) 24%, rgb(4 38 32 / 0) 55%, rgb(4 38 32 / .85) 100%)'
const pad = (n: number) => String(n).padStart(2, '0')

export function HeroSlides({ slides, intro, checks }: { slides: Slide[]; intro: ReactNode; checks: string[] }) {
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

  return (
    <section className="relative overflow-hidden bg-brand" aria-roledescription="carousel" aria-label={t('slides')}>
      <div ref={emblaRef} className="absolute inset-0 overflow-hidden">
        <div className="flex h-full touch-pan-y">
          {slides.map((s, i) => (
            <div key={s.src} className="relative h-full min-w-0 flex-[0_0_100%]" role="group" aria-roledescription="slide" aria-label={`${i + 1} / ${slides.length}: ${s.label}`}>
              <Image src={s.src} alt="" fill priority={i === 0} sizes="100vw" className="object-cover" style={{ objectPosition: s.focus }} />
            </div>
          ))}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0" style={{ background: SCRIM }} />

      <div className={`${CONTAINER} pointer-events-none relative flex min-h-[600px] flex-col justify-end pt-28 pb-24 lg:min-h-[720px] lg:pb-28`}>
        {intro}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-4 lg:mt-8">
          <ul className="hidden flex-wrap gap-x-7 gap-y-2 text-[14px] text-white/90 sm:flex">
            {checks.map(x => <li key={x} className="flex items-center gap-2"><Check className="size-4 text-sand" strokeWidth={2} aria-hidden />{x}</li>)}
          </ul>
          {slides.length > 1 && (
            <div className="pointer-events-auto flex items-center gap-3 text-white">
              <span className="text-[13px] font-semibold tracking-[0.08em] tabular-nums" aria-hidden>{pad(index + 1)}<span className="text-white/50"> / {pad(slides.length)}</span></span>
              <div className="flex">
                {slides.map((s, i) => (
                  <button key={s.src} type="button" onClick={() => api?.scrollTo(i)} aria-label={t('slideN', { n: i + 1 })} aria-current={i === index || undefined}
                    className="grid h-8 w-10 cursor-pointer place-items-center">
                    <span className={cn('h-0.5 w-8 transition-colors duration-300', i === index ? 'bg-white' : 'bg-white/35 hover:bg-white/70')} />
                  </button>
                ))}
              </div>
              <button type="button" onClick={toggle} aria-label={playing ? t('pause') : t('play')}
                className="grid size-9 cursor-pointer place-items-center rounded-full border border-white/40 transition-colors hover:bg-white/15">
                {playing ? <Pause className="size-3.5" aria-hidden /> : <Play className="size-3.5" aria-hidden />}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

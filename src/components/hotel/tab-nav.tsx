'use client'
// Thanh mục lục dính khi cuộn, gạch chân mục đang xem (giống thanh tab trang tour rootytrip).
import { useEffect, useState } from 'react'
import { cn } from 'cn'
import { CONTAINER } from '@/components/site/kit'

export function TabNav({ tabs }: { tabs: [label: string, id: string][] }) {
  const [active, setActive] = useState(tabs[0][1])
  useEffect(() => {
    const seen = new Map<string, boolean>()
    const io = new IntersectionObserver(entries => {
      for (const e of entries) seen.set(e.target.id, e.isIntersecting)
      const first = tabs.find(([, id]) => seen.get(id))
      if (first) setActive(first[1])
    }, { rootMargin: '-140px 0px -55% 0px' })
    for (const [, id] of tabs) { const el = document.getElementById(id); if (el) io.observe(el) }
    return () => io.disconnect()
  }, [tabs])

  return (
    <div className="sticky top-16 z-30 mt-6 border-b border-border bg-white lg:top-[72px]">
      <nav aria-label="Mục lục" className={`${CONTAINER} scrollbar-clean flex gap-1 overflow-x-auto max-lg:[mask-image:linear-gradient(to_right,black_85%,transparent)]`}>
        {tabs.map(([label, id]) => (
          <a key={id} href={`#${id}`} aria-current={active === id ? 'true' : undefined}
            className={cn('shrink-0 border-b-2 px-4 py-4 text-[16px] whitespace-nowrap transition-colors',
              active === id ? 'border-brand font-semibold text-brand' : 'border-transparent text-primary hover:text-brand')}>
            {label}
          </a>
        ))}
      </nav>
    </div>
  )
}

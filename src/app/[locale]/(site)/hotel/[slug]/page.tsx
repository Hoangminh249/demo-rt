// Trang khách sạn — khuôn trang tour rootytrip: đường dẫn · bộ ảnh · thanh mục lục dính · nội dung trái
// (tổng quan, chọn phòng, đã gồm, đi lại & vị trí, chính sách, hỏi đáp) · thẻ giá dính phải.
// Khối nào nội dung chưa có thì không vẽ (cả tab của nó).
import { notFound } from 'next/navigation'
import { Suspense, type ReactNode } from 'react'
import { Ban, ChevronDown, Info, MapPin, Navigation } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { repo } from '@/lib/repo'
import { fmtDate, fmtPrice, today } from '@/lib/format'
import type { InfoTable, Locale } from '@/lib/types'
import { BTN, BTN_OUT, CheckItem, CONTAINER, EYEBROW, ICONS } from '@/components/site/kit'
import { Gallery } from '@/components/hotel/gallery'
import { TabNav } from '@/components/hotel/tab-nav'
import { Rooms } from '@/components/hotel/rooms'
import { PriceCard } from '@/components/hotel/price-card'

export const dynamicParams = false
export const generateStaticParams = () => repo.hotelSlugs().map(slug => ({ slug }))
// Dựng tĩnh, làm mới mỗi 10 phút ("Giá từ" lấy từ Gohost, cache 1 giờ). Phòng trống theo ngày tải ở trình duyệt.
export const revalidate = 600

export async function generateMetadata({ params }: PageProps<'/[locale]/hotel/[slug]'>) {
  const { locale, slug } = await params
  const h = repo.getHotel(slug, locale as Locale)
  return h ? { title: `${h.name} — ${h.area}`, description: h.tagline } : {}
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return <section id={id} className="scroll-mt-36 border-t border-border pt-10"><h2 className="text-[26px] font-bold text-brand">{title}</h2>{children}</section>
}

function Table({ table }: { table: InfoTable }) {
  return (
    <figure className="mt-4">
      <figcaption className="mb-2 text-[15px] font-semibold text-brand">{table.caption}</figcaption>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[420px] text-left text-[15px]">
          <thead className="bg-muted text-[14px] text-muted-foreground"><tr>{table.head.map(c => <th key={c} scope="col" className="px-4 py-2.5 font-semibold">{c}</th>)}</tr></thead>
          <tbody className="divide-y divide-border">{table.rows.map(r => <tr key={r.join('|')}>{r.map((c, i) => <td key={i} className="px-4 py-2.5 align-top">{c}</td>)}</tr>)}</tbody>
        </table>
      </div>
      {table.note && <p className="mt-2 text-[14px] text-muted-foreground">{table.note}</p>}
    </figure>
  )
}

export default async function HotelPage({ params }: PageProps<'/[locale]/hotel/[slug]'>) {
  const { locale, slug } = await params
  setRequestLocale(locale as Locale)
  const h = repo.getHotel(slug, locale as Locale)
  if (!h) notFound()
  const t = await getTranslations()
  const from = await repo.fromPrice(slug)
  const contact = repo.site(locale as Locale)
  const upcoming = h.opening && h.opening > today() ? h.opening : null
  const sections = [
    ['tong-quan', true],
    ['phong', true],
    ['tien-ich', h.included.length + h.not_available.length > 0],
    ['di-lai', true],
    ['chinh-sach', h.policies.length > 0 || !!h.children],
    ['hoi-dap', h.faq.length > 0],
  ] as const
  const tabs = sections.filter(([, show]) => show).map(([id]) => [t(`Hotel.tabs.${id}`), id] as [string, string])

  return (
    <>
      <nav aria-label={t('Hotel.breadcrumb')} className={`${CONTAINER} py-4 text-[14px]`}>
        <ol className="flex flex-wrap items-center gap-2 text-primary">
          <li><Link href="/" className="inline-flex min-h-8 items-center hover:underline">{t('Hotel.home')}</Link></li>
          <li aria-hidden>—</li>
          <li><Link href="/#khach-san" className="inline-flex min-h-8 items-center hover:underline">{t('Hotel.hotels')}</Link></li>
          <li aria-hidden>—</li>
          <li className="font-semibold text-brand" aria-current="page">{h.name}</li>
        </ol>
      </nav>

      <div className={CONTAINER}><Gallery name={h.name} images={h.gallery} /></div>
      <TabNav tabs={tabs} />

      <div className={`${CONTAINER} grid grid-cols-1 gap-10 pt-10 lg:grid-cols-[minmax(0,1fr)_340px]`}>
        <div className="grid min-w-0 grid-cols-1 gap-12">
          <section id="tong-quan" className="scroll-mt-36">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className={EYEBROW}>{h.area}</span>
              {upcoming && <span className="inline-flex h-7 items-center rounded-md bg-yellow px-2.5 text-[13px] font-semibold text-yellow-foreground">{t('Common.opening', { date: fmtDate(upcoming, locale) })}</span>}
            </div>
            <h1 className="mt-2 text-[34px] leading-tight font-bold text-brand sm:text-[42px]">{h.name}</h1>
            <ul className="mt-4 grid gap-3 border-b border-border pb-5 text-[15px] sm:grid-cols-2">
              {h.facts.map(f => { const Icon = ICONS[f.icon]; return <li key={f.label} className="flex gap-2.5"><Icon className="mt-1 size-4 shrink-0 text-brand" aria-hidden /><span><b className="font-semibold">{f.label}:</b> {f.value}</span></li> })}
            </ul>
            <p className="mt-5 text-[16px] leading-relaxed">{h.description}</p>
            {h.highlights.length > 0 && <>
              <p className="mt-5 font-semibold text-brand">{t('Hotel.highlights')}</p>
              <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">{h.highlights.map(x => <CheckItem key={x}>{x}</CheckItem>)}</ul>
            </>}
            <p className="mt-5 text-[14px] text-muted-foreground">{t('Hotel.operator', { name: h.operator })}</p>
          </section>

          <Suspense fallback={<section id="phong" className="scroll-mt-36 border-t border-border pt-10"><h2 className="text-[26px] font-bold text-brand">{t('Rooms.title')}</h2><div className="mt-6 h-64 animate-pulse rounded-2xl bg-muted" /></section>}>
            <Rooms hotel={{ slug: h.slug, name: h.name, online: h.online, opening: h.opening, cancel_summary: h.cancel_summary }} rooms={h.rooms} contact={contact} />
          </Suspense>

          {h.included.length + h.not_available.length > 0 && (
            <Section id="tien-ich" title={t('Hotel.included')}>
              <ul className="mt-6 grid gap-x-6 gap-y-5 sm:grid-cols-2">
                {h.included.map(a => {
                  const Icon = ICONS[a.icon]
                  return (
                    <li key={a.label} className="flex gap-3 text-[15px]">
                      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-mint text-brand"><Icon className="size-5" aria-hidden /></span>
                      <span className="min-w-0"><b className="block font-semibold">{a.label}</b>{a.desc && <span className="text-muted-foreground">{a.desc}</span>}</span>
                    </li>
                  )
                })}
              </ul>
              {h.not_available.length > 0 && (
                <div className="mt-6 rounded-xl border border-border px-5 py-4">
                  <p className="font-semibold text-brand">{t('Hotel.notAvailable')}</p>
                  <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-[15px] text-muted-foreground">
                    {h.not_available.map(x => <li key={x} className="inline-flex items-center gap-1.5"><Ban className="size-4 shrink-0" aria-hidden />{x}</li>)}
                  </ul>
                </div>
              )}
            </Section>
          )}

          <Section id="di-lai" title={t('Hotel.gettingHere')}>
            <div className="mt-6 flex flex-wrap items-start justify-between gap-4 rounded-xl bg-mint px-5 py-4">
              <p className="flex min-w-0 flex-1 gap-2 text-[15px]"><MapPin className="mt-0.5 size-4 shrink-0 text-orange" aria-hidden />{h.address}</p>
              <a href={h.map_url} target="_blank" rel="noopener" className={`${BTN_OUT} h-10`}><Navigation className="size-4" aria-hidden />{t('Hotel.directions')}</a>
            </div>
            {h.getting_here.map(g => (
              <div key={g.title} className="mt-8">
                <h3 className="text-xl font-bold text-brand">{g.title}</h3>
                {g.body && <p className="mt-1 text-[15px]">{g.body}</p>}
                {g.tables.map(x => <Table key={x.caption} table={x} />)}
                {g.notes.length > 0 && <ul className="mt-4 grid gap-2">{g.notes.map(n => <li key={n} className="flex gap-2 text-[15px]"><Info className="mt-1 size-4 shrink-0 text-orange" aria-hidden />{n}</li>)}</ul>}
              </div>
            ))}
          </Section>

          {(h.policies.length > 0 || h.children) && (
            <Section id="chinh-sach" title={t('Hotel.policies')}>
              <dl className="mt-6 divide-y divide-border rounded-xl border border-border">
                {h.policies.map(([k, v]) => <div key={k} className="grid gap-1 px-5 py-4 sm:grid-cols-[180px_1fr] sm:gap-6"><dt className="font-semibold text-brand">{k}</dt><dd className="text-[15px]">{v}</dd></div>)}
              </dl>
              {h.children && <Table table={h.children} />}
            </Section>
          )}

          {h.faq.length > 0 && (
            <Section id="hoi-dap" title={t('Hotel.faq')}>
              <div className="mt-6 divide-y divide-border rounded-xl border border-border">
                {h.faq.map(([q, a], i) => (
                  <details key={q} className="group px-5" open={i === 0}>
                    <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 font-semibold text-brand [&::-webkit-details-marker]:hidden">
                      {q}<ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
                    </summary>
                    <p className="pb-4 text-[15px]">{a}</p>
                  </details>
                ))}
              </div>
            </Section>
          )}
        </div>

        <aside className="hidden lg:block" aria-label={t('Hotel.bookAria')}>
          <div className="sticky top-[calc(var(--header-offset)+78px)] transition-[top] duration-300">
            <Suspense fallback={<div className="h-[390px] animate-pulse rounded-2xl bg-muted" />}><PriceCard fromPrice={from} opening={h.opening} contact={contact} /></Suspense>
          </div>
        </aside>
      </div>

      {/* Điện thoại: thanh đặt phòng dính đáy */}
      <div id="mobile-book-bar" className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-white px-4 py-3 lg:hidden">
        <div className="flex items-center justify-between gap-3">
          {from
            ? <p className="min-w-0"><span className="block text-[13px] text-muted-foreground">{t('Common.from')}</span><span className="text-lg font-semibold">{fmtPrice(from)}</span><span className="text-[13px] text-muted-foreground"> {t('Common.perNight')}</span></p>
            : <p className="min-w-0 text-[15px] font-semibold text-brand">{t('Hotel.priceByDate')}</p>}
          <a href="#phong" className={BTN}>{t('Hotel.chooseRoom')}</a>
        </div>
      </div>
    </>
  )
}

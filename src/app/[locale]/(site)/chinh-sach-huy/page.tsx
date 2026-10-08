// Chính sách huỷ và hoàn tiền: phần chung ở src/content/pages.ts, mức phí từng khách sạn đọc thẳng từ file khách sạn.
import { setRequestLocale } from 'next-intl/server'
import { siteApi } from '@/api/site'
import type { Locale } from '@/types/global'
import { PolicyPage } from '@/components/site/policy-page'

export async function generateMetadata({ params }: PageProps<'/[locale]/chinh-sach-huy'>) {
  const p = siteApi.page('chinh-sach-huy', (await params).locale as Locale)
  return { title: p.title, description: p.lead }
}

export default async function Page({ params }: PageProps<'/[locale]/chinh-sach-huy'>) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
  const fees = (
    <div className="mt-5 grid gap-4">
      {siteApi.cancelPolicies(locale as Locale).map(h => (
        <div key={h.slug} className="overflow-hidden rounded-2xl border border-border">
          <p className="bg-mint px-5 py-3 font-bold text-brand">{h.name}</p>
          <dl className="divide-y divide-border">
            {h.rows.map(([k, v]) => <div key={k} className="grid gap-1 px-5 py-3.5 sm:grid-cols-[170px_1fr] sm:gap-6"><dt className="font-semibold text-brand">{k}</dt><dd className="text-[15px]">{v}</dd></div>)}
          </dl>
        </div>
      ))}
    </div>
  )
  return <PolicyPage page={siteApi.page('chinh-sach-huy', locale as Locale)} contact={siteApi.info(locale as Locale)} extra={{ 'muc-phi': fees }} />
}

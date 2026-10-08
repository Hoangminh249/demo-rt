import { setRequestLocale } from 'next-intl/server'
import { siteApi } from '@/api/site'
import type { Locale } from '@/types/global'
import { PolicyPage } from '@/components/site/policy-page'

export async function generateMetadata({ params }: PageProps<'/[locale]/chinh-sach-bao-mat'>) {
  const p = siteApi.page('chinh-sach-bao-mat', (await params).locale as Locale)
  return { title: p.title, description: p.lead }
}

export default async function Page({ params }: PageProps<'/[locale]/chinh-sach-bao-mat'>) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
  return <PolicyPage page={siteApi.page('chinh-sach-bao-mat', locale as Locale)} contact={siteApi.info(locale as Locale)} />
}

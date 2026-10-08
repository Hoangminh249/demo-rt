import { setRequestLocale } from 'next-intl/server'
import { siteApi } from '@/api/site'
import type { Locale } from '@/types/global'
import { PolicyPage } from '@/components/site/policy-page'

export async function generateMetadata({ params }: PageProps<'/[locale]/dieu-khoan-dat-phong'>) {
  const p = siteApi.page('dieu-khoan-dat-phong', (await params).locale as Locale)
  return { title: p.title, description: p.lead }
}

export default async function Page({ params }: PageProps<'/[locale]/dieu-khoan-dat-phong'>) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
  return <PolicyPage page={siteApi.page('dieu-khoan-dat-phong', locale as Locale)} contact={siteApi.info(locale as Locale)} />
}

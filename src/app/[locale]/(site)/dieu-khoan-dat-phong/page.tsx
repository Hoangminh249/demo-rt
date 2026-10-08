import { setRequestLocale } from 'next-intl/server'
import { repo } from '@/lib/repo'
import type { Locale } from '@/lib/types'
import { PolicyPage } from '@/components/site/policy-page'

export async function generateMetadata({ params }: PageProps<'/[locale]/dieu-khoan-dat-phong'>) {
  const p = repo.page('dieu-khoan-dat-phong', (await params).locale as Locale)
  return { title: p.title, description: p.lead }
}

export default async function Page({ params }: PageProps<'/[locale]/dieu-khoan-dat-phong'>) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
  return <PolicyPage page={repo.page('dieu-khoan-dat-phong', locale as Locale)} contact={repo.site(locale as Locale)} />
}

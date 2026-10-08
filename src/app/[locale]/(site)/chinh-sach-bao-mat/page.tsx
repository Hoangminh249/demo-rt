import { setRequestLocale } from 'next-intl/server'
import { repo } from '@/lib/repo'
import type { Locale } from '@/lib/types'
import { PolicyPage } from '@/components/site/policy-page'

export async function generateMetadata({ params }: PageProps<'/[locale]/chinh-sach-bao-mat'>) {
  const p = repo.page('chinh-sach-bao-mat', (await params).locale as Locale)
  return { title: p.title, description: p.lead }
}

export default async function Page({ params }: PageProps<'/[locale]/chinh-sach-bao-mat'>) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
  return <PolicyPage page={repo.page('chinh-sach-bao-mat', locale as Locale)} contact={repo.site(locale as Locale)} />
}

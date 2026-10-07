import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

export default function NotFound() {
  const t = useTranslations('NotFound')
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <p className="text-6xl font-bold text-brand">404</p>
      <h1 className="mt-3 text-xl font-semibold">{t('title')}</h1>
      <p className="mt-2 text-muted-foreground">{t('body')}</p>
      <Link href="/" className="mt-6 inline-block rounded-lg bg-primary px-4 py-2 font-semibold text-white">{t('home')}</Link>
    </div>
  )
}

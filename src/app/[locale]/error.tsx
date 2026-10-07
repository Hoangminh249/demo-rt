'use client'
import { useTranslations } from 'next-intl'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  const t = useTranslations('Error')
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center" role="alert">
      <h1 className="text-xl font-semibold">{t('title')}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      <button type="button" onClick={reset} className="mt-6 rounded-lg bg-primary px-4 py-2 font-semibold text-white">{t('retry')}</button>
    </div>
  )
}

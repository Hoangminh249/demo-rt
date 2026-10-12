// Cổng thanh toán GIẢ LẬP (PAYMENT_PROVIDER=mock): đóng vai trang của cổng thật. Hai nút gửi form tới
// /api/payments/mock/simulate — server ký body như cổng rồi đi đúng đường webhook. Chỉ chủ payment xem được.
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { FlaskConical } from 'lucide-react'
import { bookingApi } from '@/api/booking'
import { currentUser } from '@/auth'
import { fmtPrice } from '@/lib/format'
import type { Locale } from '@/types/global'
import { Link } from '@/i18n/navigation'
import { BTN, BTN_OUT, CONTAINER } from '@/components/site/kit'

export async function generateMetadata() {
  return { title: (await getTranslations('Live'))('gatewayTitle'), robots: { index: false } }
}

export default async function MockGatewayPage({ params, searchParams }: PageProps<'/[locale]/thanh-toan-gia-lap'>) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
  if (!bookingApi.enabled() || !bookingApi.mockPayments()) notFound()
  const t = await getTranslations('Live')
  const ref = (await searchParams).ref
  const user = await currentUser()
  const p = user && typeof ref === 'string' ? await bookingApi.mockPayment(user.id, ref) : null
  if (!p) notFound()

  return (
    <div className={`${CONTAINER} flex justify-center py-16`}>
      <section className="w-full max-w-md rounded-2xl border border-dashed border-orange/60 bg-white p-6 sm:p-8">
        <p className="flex items-center gap-2 text-[13px] font-semibold tracking-wide text-orange uppercase"><FlaskConical className="size-4" aria-hidden />{t('gatewayTitle')}</p>
        <p className="mt-2 text-[14px] text-muted-foreground">{t('gatewayBody')}</p>
        <dl className="mt-6 grid gap-2 border-y border-border py-4 text-[15px]">
          <div className="flex justify-between gap-4"><dt className="text-muted-foreground">{t('bookingCode')}</dt><dd className="font-semibold tabular-nums">{p.code}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-muted-foreground">{p.hotelName}</dt><dd>{p.kind === 'DEPOSIT' ? t('payDepositTitle') : t('payFullTitle')}</dd></div>
          <div className="flex justify-between gap-4 text-lg font-bold text-brand"><dt>{t('gatewayAmount')}</dt><dd className="tabular-nums">{fmtPrice(p.amount)}</dd></div>
        </dl>
        {p.status === 'PENDING' ? (
          <form method="post" action="/api/payments/mock/simulate" className="mt-6 grid gap-3">
            <input type="hidden" name="ref" value={ref} />
            <input type="hidden" name="locale" value={locale} />
            <button type="submit" name="result" value="succeeded" className={`${BTN} h-12 w-full`}>{t('gatewaySuccess')}</button>
            <button type="submit" name="result" value="failed" className={`${BTN_OUT} h-12 w-full`}>{t('gatewayFail')}</button>
          </form>
        ) : (
          <div className="mt-6">
            <p className="text-[15px]">{t('gatewayDone')}</p>
            <Link href={`/dat-phong/xac-nhan?code=${encodeURIComponent(p.code)}`} className={`${BTN} mt-4 h-12 w-full`}>{t('bookingCode')}: {p.code}</Link>
          </div>
        )}
      </section>
    </div>
  )
}

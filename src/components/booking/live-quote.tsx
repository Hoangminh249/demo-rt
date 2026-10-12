'use client'
// Bước 2 (đặt phòng thật): báo giá SERVER — tiền phòng, phụ thu, khuyến mãi, thuế phí, tổng, cọc trực tuyến, còn lại tại quầy.
// Mã khuyến mãi nhập ở đây; server kiểm và tính lại. Số trên khối này là số gửi kèm khi giữ phòng (expectedTotal).
import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { AlertTriangle, Tag, Timer } from 'lucide-react'
import { fmtDate, fmtPrice } from '@/lib/format'
import type { LiveQuote } from '@/types/booking'
import { Input } from '@/components/ui/input'
import { BTN_OUT } from '@/components/site/kit'

export function QuoteErrors({ quote }: { quote: LiveQuote }) {
  const t = useTranslations('Live')
  const locale = useLocale()
  // Lỗi khuyến mãi hiện riêng cạnh ô mã; ở đây là lỗi làm lựa chọn không đặt được.
  const errs = quote.errors.filter(e => !e.code.startsWith('PROMO_'))
  if (!errs.length) return null
  const seen = new Set<string>()
  return (
    <ul role="alert" className="grid gap-1.5 rounded-xl bg-destructive/5 px-4 py-3 text-[14px] text-destructive">
      {errs.filter(e => !seen.has(e.code) && seen.add(e.code)).map(e => (
        <li key={e.code} className="flex gap-2"><AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />{t(`errors.${e.code}` as 'errors.SOLD_OUT', { date: e.date ? fmtDate(e.date, locale) : '' })}</li>
      ))}
    </ul>
  )
}

export function LiveQuoteCard({ quote, loading, failed, promo, onPromo }: {
  quote: LiveQuote | undefined; loading: boolean; failed: boolean; promo: string | null; onPromo: (code: string | null) => void
}) {
  const t = useTranslations('Live')
  const locale = useLocale()
  const [draft, setDraft] = useState(promo ?? '')
  const promoError = quote?.errors.find(e => e.code.startsWith('PROMO_'))
  const extra = quote ? quote.nights.reduce((s, n) => s + n.extraFee, 0) : 0
  const rows: [string, string, boolean?][] = quote ? [
    [t('subtotal'), fmtPrice(quote.subtotal - extra)],
    ...(extra ? [[t('extraFee'), fmtPrice(extra)] as [string, string]] : []),
    ...(quote.discount ? [[t('discount', { code: quote.promoCode ?? '' }), `− ${fmtPrice(quote.discount)}`] as [string, string]] : []),
    ...quote.taxLines.filter(x => !x.included).map(x => [x.name, fmtPrice(x.amount)] as [string, string]),
    [t('total'), fmtPrice(quote.total), true],
  ] : []

  return (
    <section className="rounded-2xl border border-border bg-white p-5 sm:p-6" aria-busy={loading}>
      <h2 className="text-xl font-bold text-brand">{t('quoteTitle')}</h2>

      {/* Không dùng <form>: khối này nằm trong form thông tin khách (form lồng form là HTML sai). Enter = Áp dụng. */}
      <div className="mt-4 flex flex-wrap items-end gap-2">
        <label className="grid min-w-0 flex-1 gap-1.5 text-[14px] font-medium">
          <span className="inline-flex items-center gap-1.5"><Tag className="size-4 text-brand" aria-hidden />{t('promo')}</span>
          <Input value={draft} onChange={e => setDraft(e.target.value.toUpperCase())} maxLength={40} autoComplete="off" className="h-11 rounded-lg uppercase"
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onPromo(draft.trim() || null) } }}
            aria-invalid={!!promoError} aria-describedby={promoError ? 'promo-err' : undefined} />
        </label>
        <button type="button" onClick={() => onPromo(draft.trim() || null)} className={`${BTN_OUT} h-11`}>{t('promoApply')}</button>
        {promo && <button type="button" onClick={() => { setDraft(''); onPromo(null) }} className="h-11 px-2 text-[14px] text-muted-foreground underline-offset-2 hover:underline">{t('promoRemove')}</button>}
        {promoError && <p id="promo-err" className="w-full text-[13px] text-destructive">{t(`errors.${promoError.code}` as 'errors.PROMO_NOT_FOUND')}</p>}
      </div>

      {failed && !quote ? <p role="alert" className="mt-4 text-[14px] text-destructive">{t('quoteFailed')}</p>
        : !quote ? <div className="mt-4 grid gap-2" role="status" aria-label={t('quoting')}>{[0, 1, 2].map(i => <div key={i} className="h-5 animate-pulse rounded bg-muted" />)}</div>
        : (
          <div className={loading ? 'opacity-60 transition-opacity' : undefined}>
            <dl className="mt-4 grid gap-2 border-t border-border pt-4 text-[15px]">
              {rows.map(([k, v, strong]) => (
                <div key={k} className={strong ? 'flex justify-between gap-4 border-t border-border pt-2 text-lg font-bold text-brand' : 'flex justify-between gap-4'}>
                  <dt className={strong ? undefined : 'text-muted-foreground'}>{k}</dt><dd className="tabular-nums">{v}</dd>
                </div>
              ))}
              {quote.taxLines.filter(x => x.included).map(x => <p key={x.name} className="text-[13px] text-muted-foreground">{t('taxIncluded', { name: x.name })}</p>)}
            </dl>
            <dl className="mt-3 grid gap-1.5 rounded-xl bg-mint px-4 py-3 text-[14px]">
              <div className="flex justify-between gap-4 font-semibold text-brand"><dt>{t('depositNow')}</dt><dd className="tabular-nums">{fmtPrice(quote.deposit)}</dd></div>
              <div className="flex justify-between gap-4"><dt>{quote.balanceDueAt ? t('payLaterBy', { date: fmtDate(quote.balanceDueAt, locale) }) : t('payLater')}</dt><dd className="tabular-nums">{fmtPrice(quote.balanceDue)}</dd></div>
            </dl>
            <p className="mt-3 flex gap-2 text-[13px] text-muted-foreground"><Timer className="mt-0.5 size-3.5 shrink-0" aria-hidden />{t('holdNote', { minutes: quote.holdMinutes })}</p>
            <div className="mt-3"><QuoteErrors quote={quote} /></div>
          </div>
        )}
    </section>
  )
}

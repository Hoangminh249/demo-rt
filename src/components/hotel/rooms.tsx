'use client'
// Khối "Chọn phòng": phòng trống + giá theo ngày khách chọn (lời gọi tìm phòng của Gohost), đủ 4 trạng thái
// có dữ liệu · đang tải · hết phòng (gợi ý ngày khác) · lỗi. Bấm "Đặt phòng" → bước thanh toán của Gohost.
import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { BedDouble, CalendarDays, CalendarX, CircleCheck, Eye, Flame, Info, Maximize2, Phone, RotateCw, Users, WifiOff } from 'lucide-react'
import { cn } from 'cn'
import { repo, type PlanOffer, type RoomOffer } from '@/lib/repo'
import { addDays, diffDays, fmtDayMonth, fmtPrice, fmtRange } from '@/lib/format'
import type { Hotel, Locale, Stay } from '@/lib/types'
import { Dialog } from '@/components/ui/overlay'
import { BTN, BTN_OUT, Photo } from '@/components/site/kit'
import { fmtMoney, useCurrency } from '@/components/site/currency'
import { DateRangeField, GuestsField } from '@/components/site/stay-fields'
import { useStay } from './use-stay'

const keyOf = (s: Stay) => `${s.checkin}|${s.checkout}|${s.adults}|${s.children}`
type Result = { key: string; rooms?: RoomOffer[]; suggestions?: Stay[]; error?: boolean }
type Pick = { offer: RoomOffer; plan: PlanOffer }

/** Câu điều kiện huỷ của một gói, theo ngôn ngữ đang xem. */
function useCancelNote() {
  const t = useTranslations('Rooms')
  const locale = useLocale()
  return (p: PlanOffer, stay: Stay) =>
    p.plan.free_cancel_days != null ? t('freeCancel', { date: fmtDayMonth(addDays(stay.checkin, -p.plan.free_cancel_days), locale) }) : t('nonRefund')
}

export function Rooms({ hotel }: { hotel: Hotel }) {
  const t = useTranslations()
  const locale = useLocale() as Locale
  const [stay, setStay] = useStay()
  const [attempt, setAttempt] = useState(0)
  const [res, setRes] = useState<Result>()
  const [editing, setEditing] = useState(false)
  const [picked, setPicked] = useState<Pick>()
  const key = keyOf(stay)
  const nights = diffDays(stay.checkin, stay.checkout)
  const party = t('Common.guests', { adults: stay.adults, children: stay.children })
  const range = fmtRange(stay.checkin, stay.checkout, locale)

  useEffect(() => {
    let live = true
    const [checkin, checkout, a, c] = key.split('|')
    const s = { checkin, checkout, adults: Number(a), children: Number(c) }
    repo.searchRooms(hotel.id, s, locale)
      .then(async rooms => {
        const soldOut = rooms.some(o => o.fits) && !rooms.some(o => o.fits && o.left > 0)
        const suggestions = soldOut ? await repo.suggestStays(hotel.id, s) : []
        if (live) setRes({ key, rooms, suggestions })
      })
      .catch(() => { if (live) setRes({ key, error: true }) })
    return () => { live = false }
  }, [hotel.id, key, attempt, locale])

  const ready = res?.key === key ? res : undefined
  const anyFits = ready?.rooms?.some(o => o.fits)
  // Hết phòng = có hạng đủ chỗ cho đoàn nhưng hạng nào cũng kín. Không hạng nào đủ chỗ thì vẫn hiện danh sách + lời khuyên đặt 2 phòng.
  const soldOut = anyFits && !ready?.rooms?.some(o => o.fits && o.left > 0)

  return (
    <section id="phong" className="scroll-mt-36 border-t border-border pt-10">
      <h2 className="text-[26px] font-bold text-brand">{t('Rooms.title')}</h2>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-mint px-4 py-3">
        <p className="inline-flex flex-wrap items-center gap-x-2 text-[15px]">
          <CalendarDays className="size-4 text-brand" aria-hidden />
          <b className="font-semibold">{range}</b>
          <span className="hidden sm:inline" aria-hidden>·</span>
          <span className="whitespace-nowrap">{t('Common.nights', { n: nights })} · {party}</span>
        </p>
        <button type="button" onClick={() => setEditing(true)} className="inline-flex min-h-8 cursor-pointer items-center text-[15px] font-semibold text-brand underline underline-offset-4">{t('Rooms.change')}</button>
      </div>

      <div className="mt-6" aria-live="polite" aria-busy={!ready}>
        {!ready ? (
          <div className="grid gap-5" role="status" aria-label={t('Rooms.loading')}>
            {[0, 1].map(i => (
              <div key={i} className="grid gap-5 rounded-2xl border border-border p-4 md:grid-cols-[260px_1fr]">
                <div className="aspect-[4/3] animate-pulse rounded-xl bg-muted" />
                <div className="space-y-3 py-1"><div className="h-6 w-1/2 animate-pulse rounded-md bg-muted" /><div className="h-4 w-2/3 animate-pulse rounded-md bg-muted" /><div className="h-14 animate-pulse rounded-lg bg-muted" /><div className="h-14 animate-pulse rounded-lg bg-muted" /></div>
              </div>
            ))}
          </div>
        ) : ready.error ? (
          <div role="alert" className="flex flex-col items-center rounded-2xl border border-border px-6 py-12 text-center">
            <WifiOff className="size-8 text-muted-foreground" aria-hidden />
            <p className="mt-3 text-lg font-semibold text-brand">{t('Rooms.errorTitle')}</p>
            <p className="mt-1 max-w-md text-[15px] text-muted-foreground">{t('Rooms.errorBody')}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button type="button" onClick={() => setAttempt(n => n + 1)} className={BTN_OUT}><RotateCw className="size-4" aria-hidden />{t('Rooms.retry')}</button>
              <a href="tel:0886068886" className={BTN}><Phone className="size-4" aria-hidden />{t('Common.callBook')}</a>
            </div>
          </div>
        ) : soldOut ? (
          <div className="flex flex-col items-center rounded-2xl border border-border px-6 py-12 text-center">
            <CalendarX className="size-8 text-muted-foreground" aria-hidden />
            <p className="mt-3 text-lg font-semibold text-brand">{t('Rooms.soldOut', { range })}</p>
            {ready.suggestions?.length ? (
              <>
                <p className="mt-1 max-w-md text-[15px] text-muted-foreground">{t('Rooms.nearest', { nights: t('Common.nights', { n: nights }) })}</p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {ready.suggestions.map(s => (
                    <button key={s.checkin} type="button" onClick={() => setStay(s)} className="h-10 cursor-pointer rounded-lg border border-border-strong bg-white px-4 text-[15px] font-medium hover:bg-mint">
                      {fmtRange(s.checkin, s.checkout, locale)}
                    </button>
                  ))}
                </div>
              </>
            ) : <p className="mt-1 max-w-md text-[15px] text-muted-foreground">{t('Rooms.holdCall')}</p>}
          </div>
        ) : (
          <div className="grid gap-5">
            {!anyFits && (
              <p role="status" className="flex gap-2.5 rounded-xl border border-border px-4 py-3 text-[15px]">
                <Users className="mt-0.5 size-4 shrink-0 text-orange" aria-hidden />{t('Rooms.notFit', { party })}
              </p>
            )}
            {ready.rooms!.map(o => <RoomCard key={o.rt.room_type_id} offer={o} stay={stay} onPick={plan => setPicked({ offer: o, plan })} onOtherDates={() => setEditing(true)} />)}</div>
        )}
      </div>

      <Dialog open={editing} onClose={() => setEditing(false)} title={t('Rooms.change')}>
        <div className="grid gap-4">
          <DateRangeField id="rooms-dates" stay={stay} onChange={setStay} />
          <GuestsField id="rooms-guests" stay={stay} onChange={setStay} />
        </div>
        <button type="button" onClick={() => setEditing(false)} className={`${BTN} mt-5 w-full`}>{t('Common.seeRooms')}</button>
      </Dialog>

      <BookingDialog hotel={hotel} stay={stay} picked={picked} onClose={() => setPicked(undefined)} />
    </section>
  )
}

function RoomCard({ offer, stay, onPick, onOtherDates }: { offer: RoomOffer; stay: Stay; onPick: (p: PlanOffer) => void; onOtherDates: () => void }) {
  const t = useTranslations()
  const locale = useLocale()
  const currency = useCurrency()
  const cancelNote = useCancelNote()
  const { rt, left, fits } = offer
  const soldOut = left <= 0
  const off = soldOut || !fits
  return (
    <article className={cn('grid gap-5 rounded-2xl border border-border p-4 md:grid-cols-[260px_1fr]', off ? 'bg-muted/60' : 'bg-white')}>
      <Photo src={rt.image} alt={rt.name} sizes="(min-width: 768px) 260px, 100vw" className={cn('aspect-[4/3] w-full rounded-xl md:aspect-auto md:h-full md:min-h-[220px]', off && 'opacity-60')} />
      <div className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="text-xl font-bold text-brand">{rt.name}</h3>
          {!off && left <= 3 && <span className="inline-flex h-7 items-center gap-1 rounded-md bg-yellow px-2.5 text-[13px] font-semibold text-yellow-foreground"><Flame className="size-3.5" aria-hidden />{t('Rooms.lowStock', { n: left })}</span>}
        </div>
        <ul className="mt-2 grid gap-x-6 gap-y-1.5 text-[14px] text-muted-foreground sm:grid-flow-col sm:grid-cols-[max-content_1fr] sm:grid-rows-2">
          <li className="inline-flex items-center gap-1.5"><Maximize2 className="size-4 shrink-0" aria-hidden />{rt.size_m2} m²</li>
          <li className="inline-flex items-center gap-1.5"><BedDouble className="size-4 shrink-0" aria-hidden />{rt.beds}</li>
          <li className="inline-flex items-center gap-1.5"><Eye className="size-4 shrink-0" aria-hidden />{rt.view}</li>
          <li className="inline-flex items-center gap-1.5"><Users className="size-4 shrink-0" aria-hidden />{t('Common.capacity', { adults: rt.max_adults, children: rt.max_children })}</li>
        </ul>
        <p className="mt-2 text-[15px]">{rt.description}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">{rt.amenities.map(a => <span key={a} className="inline-flex h-7 items-center rounded-md bg-mint px-2.5 text-[13px] text-brand">{a}</span>)}</div>

        {soldOut ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-border-strong px-4 py-3">
            <p className="text-[15px] font-medium text-muted-foreground">{t('Rooms.soldOut', { range: fmtRange(stay.checkin, stay.checkout, locale) })}</p>
            <button type="button" onClick={onOtherDates} className={`${BTN_OUT} h-10`}>{t('Rooms.otherDates')}</button>
          </div>
        ) : !fits ? (
          <p className="mt-4 rounded-xl border border-dashed border-border-strong px-4 py-3 text-[15px] text-muted-foreground">
            {t('Rooms.roomMax', { max: t('Common.guests', { adults: rt.max_adults, children: rt.max_children }), party: t('Common.guests', { adults: stay.adults, children: stay.children }) })}
          </p>
        ) : (
          <div className="mt-4 grid gap-2.5">
            {offer.plans.map(p => (
              <div key={p.plan.rate_plan_id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-xl border border-border px-4 py-3">
                <div className="min-w-[190px] flex-1">
                  <p className="text-[15px] font-medium">{p.plan.name}</p>
                  <p className={cn('inline-flex items-center gap-1.5 text-[14px]', p.plan.free_cancel_days != null ? 'text-primary' : 'text-muted-foreground')}>
                    {p.plan.free_cancel_days != null ? <CircleCheck className="size-3.5" aria-hidden /> : <Info className="size-3.5" aria-hidden />}{cancelNote(p, stay)}
                  </p>
                </div>
                <div className="flex w-full items-center justify-between gap-4 sm:ml-auto sm:w-auto sm:justify-end">
                  <p className="sm:text-right">
                    <span className="text-xl font-semibold">{fmtMoney(p.nightly, currency)}</span><span className="text-[13px] text-muted-foreground"> {t('Common.perNight')}</span>
                    <span className="block text-[13px] whitespace-nowrap text-muted-foreground">{t('Rooms.total', { total: fmtMoney(p.total, currency), nights: t('Common.nights', { n: p.days_breakdown.length }) })}</span>
                  </p>
                  <button type="button" onClick={() => onPick(p)} className={`${p.plan.has_breakfast ? BTN : BTN_OUT} h-10`}>{t('Rooms.book')}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}

/** Bản chính thức: mở trang đặt phòng của Gohost với phòng + gói đã chọn (D2 trong file yêu cầu). Demo dừng ở đây. */
function BookingDialog({ hotel, stay, picked, onClose }: { hotel: Hotel; stay: Stay; picked?: Pick; onClose: () => void }) {
  const t = useTranslations()
  const locale = useLocale()
  const currency = useCurrency()
  const cancelNote = useCancelNote()
  const rows: [string, string][] = picked ? [
    [t('Rooms.rowHotel'), hotel.name],
    [t('Rooms.rowRoom'), picked.offer.rt.name],
    [t('Rooms.rowPlan'), `${picked.plan.plan.name} · ${cancelNote(picked.plan, stay)}`],
    [t('Rooms.rowDates'), `${fmtRange(stay.checkin, stay.checkout, locale)} · ${t('Common.nights', { n: picked.plan.days_breakdown.length })}`],
    [t('Rooms.rowGuests'), t('Common.guests', { adults: stay.adults, children: stay.children })],
  ] : []
  return (
    <Dialog open={!!picked} onClose={onClose} title={t('Rooms.checkoutTitle')}
      footer={<><button type="button" onClick={onClose} className={BTN_OUT}>{t('Rooms.back')}</button><a href="tel:0886068886" className={BTN}><Phone className="size-4" aria-hidden />{t('Common.callBook')}</a></>}>
      {picked && (
        <>
          <dl className="divide-y divide-border rounded-xl border border-border">
            {rows.map(([k, v]) => <div key={k} className="grid gap-1 px-4 py-3 sm:grid-cols-[120px_1fr] sm:gap-4"><dt className="text-[14px] text-muted-foreground">{k}</dt><dd className="text-[15px] font-medium">{v}</dd></div>)}
            <div className="grid gap-1 px-4 py-3 sm:grid-cols-[120px_1fr] sm:gap-4">
              <dt className="text-[14px] text-muted-foreground">{t('Rooms.rowTotal')}</dt>
              <dd>
                <span className="text-xl font-semibold">{fmtMoney(picked.plan.total, currency)}</span>
                {currency !== 'VND' && <span className="mt-1 block text-[14px] text-muted-foreground">{t('Rooms.payInVnd', { amount: fmtPrice(picked.plan.total), code: currency })}</span>}
              </dd>
            </div>
          </dl>
          <p className="mt-4 rounded-xl bg-mint px-4 py-3 text-[14px] text-brand">{t('Rooms.gohostNote')}</p>
        </>
      )}
    </Dialog>
  )
}

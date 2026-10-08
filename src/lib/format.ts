// Ngày lưu dạng chuỗi ISO 'YYYY-MM-DD' (ngày lịch Asia/Ho_Chi_Minh), không mang giờ nên không lệch múi giờ.

/** Hôm nay theo giờ Việt Nam, 'YYYY-MM-DD'. */
export const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date())

const toUTC = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}
const fromUTC = (t: number) => new Date(t).toISOString().slice(0, 10)

export const addDays = (iso: string, n: number) => fromUTC(toUTC(iso) + n * 86400000)
export const diffDays = (from: string, to: string) => Math.round((toUTC(to) - toUTC(from)) / 86400000)
export const isISODate = (s: string | null | undefined): s is string => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && fromUTC(toUTC(s)) === s

const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** vi: 16/10 · en: 16 Oct */
export const fmtDayMonth = (iso: string, locale = 'vi') =>
  locale === 'en' ? `${Number(iso.slice(8, 10))} ${MONTHS_EN[Number(iso.slice(5, 7)) - 1]}` : `${iso.slice(8, 10)}/${iso.slice(5, 7)}`

/** vi: T6 · en: Fri */
export const fmtWeekday = (iso: string, locale = 'vi') =>
  new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'vi-VN', { weekday: 'short', timeZone: 'UTC' }).format(new Date(toUTC(iso)))

/** vi: 16/10/2026 · en: 16 Oct 2026 */
export const fmtDate = (iso: string, locale = 'vi') => `${fmtDayMonth(iso, locale)}${locale === 'en' ? ' ' : '/'}${iso.slice(0, 4)}`

/** vi: 16/10 – 19/10/2026 · 30/12/2026 – 02/01/2027 — en: 16 Oct – 19 Oct 2026 */
export function fmtRange(from: string, to: string, locale = 'vi') {
  const sameYear = from.slice(0, 4) === to.slice(0, 4)
  if (locale === 'en') return `${fmtDayMonth(from, 'en')}${sameYear ? '' : ` ${from.slice(0, 4)}`} – ${fmtDayMonth(to, 'en')} ${to.slice(0, 4)}`
  return `${fmtDayMonth(from)}${sameYear ? '' : `/${from.slice(0, 4)}`} – ${fmtDayMonth(to)}/${to.slice(0, 4)}`
}

/** Giá kiểu rootytrip.com: "đ 2,850,000". Giá luôn là VND (Gohost tính và thu bằng VND). */
export const fmtPrice = (n: number) => `đ ${Math.round(n).toLocaleString('en-US')}`

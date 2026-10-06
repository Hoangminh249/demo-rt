// Ngày lưu dạng chuỗi ISO 'YYYY-MM-DD' (ngày lịch theo Asia/Ho_Chi_Minh), không mang giờ
// nên không lệch múi giờ. Mọi phép tính ngày đi qua UTC.

export const TODAY = '2026-10-06'

const toUTC = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}
const fromUTC = (t: number) => new Date(t).toISOString().slice(0, 10)

export const addDays = (iso: string, n: number) => fromUTC(toUTC(iso) + n * 86400000)
export const diffDays = (from: string, to: string) => Math.round((toUTC(to) - toUTC(from)) / 86400000)
export const dow = (iso: string) => new Date(toUTC(iso)).getUTCDay() // 0 = CN
export const isWeekendNight = (iso: string) => dow(iso) === 5 || dow(iso) === 6

export function nightsBetween(checkin: string, checkout: string): string[] {
  const out: string[] = []
  for (let d = checkin; d < checkout; d = addDays(d, 1)) out.push(d)
  return out
}

export function monthRange(ym: string): { from: string; to: string } {
  const [y, m] = ym.split('-').map(Number)
  const from = `${ym}-01`
  const to = fromUTC(Date.UTC(y, m, 0)) // ngày cuối tháng
  return { from, to }
}

export const isISODate = (s: string | null | undefined): s is string => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s)

// ---- hiển thị ----
export function fmtDate(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

/** 12–15/10/2026 · 28/10–02/11/2026 · 30/12/2026–02/01/2027 */
export function fmtRange(from: string, to: string) {
  const [y1, m1, d1] = from.split('-')
  const [y2, m2, d2] = to.split('-')
  if (y1 !== y2) return `${d1}/${m1}/${y1}–${d2}/${m2}/${y2}`
  if (m1 !== m2) return `${d1}/${m1}–${d2}/${m2}/${y2}`
  return `${d1}–${d2}/${m2}/${y2}`
}

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
export const fmtWeekday = (iso: string) => WEEKDAYS[dow(iso)]
export const fmtDayMonth = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`
export const fmtMonth = (ym: string) => `${ym.slice(5, 7)}/${ym.slice(0, 4)}`

const vnd = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 })
export const fmtNumber = (n: number) => vnd.format(Math.round(n))
export const fmtVND = (n: number) => `${vnd.format(Math.round(n))}đ`

/** 8,4 tỷ · 2,45 triệu · 850.000đ */
export function fmtMoneyShort(n: number) {
  const f = (x: number, d: number) => x.toLocaleString('vi-VN', { maximumFractionDigits: d })
  if (Math.abs(n) >= 1e9) return `${f(n / 1e9, 1)} tỷ`
  if (Math.abs(n) >= 1e6) return `${f(n / 1e6, 2)} triệu`
  return fmtVND(n)
}

export const fmtPct = (x: number, digits = 1) => `${(x * 100).toLocaleString('vi-VN', { maximumFractionDigits: digits })}%`

export function fmtDateTime(isoDateTime: string) {
  const [d, t] = isoDateTime.split('T')
  return `${fmtDate(d)} ${t?.slice(0, 5) ?? ''}`.trim()
}

export const guestsLabel = (adults: number, children: number) =>
  `${adults} người lớn${children ? ` + ${children} trẻ em` : ''}`
export const roomsLeft = (n: number, word = 'left') => `${n} room${n === 1 ? '' : 's'} ${word}`
/** Nhãn trục biểu đồ: 1,2 tỷ · 340tr */
export const fmtAxis = (n: number) => (n >= 1e9 ? `${(n / 1e9).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tỷ` : n >= 1e6 ? `${Math.round(n / 1e6)}tr` : fmtNumber(n))

// Ngày lưu dạng chuỗi ISO 'YYYY-MM-DD' (ngày lịch Asia/Ho_Chi_Minh), không mang giờ nên không lệch múi giờ.

export const TODAY = '2026-10-07' // ngày "hôm nay" cố định của bản demo

const toUTC = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}
const fromUTC = (t: number) => new Date(t).toISOString().slice(0, 10)

export const addDays = (iso: string, n: number) => fromUTC(toUTC(iso) + n * 86400000)
export const diffDays = (from: string, to: string) => Math.round((toUTC(to) - toUTC(from)) / 86400000)
export const isWeekendNight = (iso: string) => [5, 6].includes(new Date(toUTC(iso)).getUTCDay())
export const isISODate = (s: string | null | undefined): s is string => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s)

export function nightsBetween(checkin: string, checkout: string): string[] {
  const out: string[] = []
  for (let d = checkin; d < checkout; d = addDays(d, 1)) out.push(d)
  return out
}

/** 16/10 – 19/10/2026 · 30/12/2026 – 02/01/2027 */
export function fmtRange(from: string, to: string) {
  const [y1, m1, d1] = from.split('-')
  const [y2, m2, d2] = to.split('-')
  return y1 === y2 ? `${d1}/${m1} – ${d2}/${m2}/${y2}` : `${d1}/${m1}/${y1} – ${d2}/${m2}/${y2}`
}
export const fmtDayMonth = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`

/** Giá kiểu rootytrip.com: "đ 2,850,000" */
export const fmtPrice = (n: number) => `đ ${Math.round(n).toLocaleString('en-US')}`

export const guestsLabel = (adults: number, children: number) =>
  `${adults} người lớn${children ? `, ${children} trẻ em` : ''}`

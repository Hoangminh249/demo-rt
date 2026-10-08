// Chọn ngôn ngữ cho chữ hai ngôn ngữ (L) — thiếu en thì dùng vi.
import type { InfoTable, InfoTableContent, L, Locale } from '@/types/global'

export const tr = (l: L, locale: Locale) => (locale === 'en' && l.en) || l.vi
export const table = (x: InfoTableContent, locale: Locale): InfoTable => ({
  caption: tr(x.caption, locale),
  head: x.head.map(h => tr(h, locale)),
  rows: x.rows.map(r => r.map(c => tr(c, locale))),
  note: x.note && tr(x.note, locale),
})

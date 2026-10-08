// Nội dung chung của website: kênh liên hệ + pháp nhân, 4 trang tĩnh (menu Hỗ trợ). Chỉ đọc src/content, không gọi Gohost.
import 'server-only'
import { HOTELS, SITE } from '@/content'
import { PAGES } from '@/content/pages'
import { tr } from '@/lib/tr'
import type { L, Locale } from '@/types/global'
import type { Page, PageSlug } from '@/types/page'

// Các dòng chính sách khách sạn mà trang huỷ đọc thẳng (khớp theo nhãn tiếng Việt trong src/content/*.ts).
const CANCEL_KEYS = ['Huỷ phòng', 'Đổi ngày', 'Lễ, Tết', 'Gián đoạn phương tiện ra đảo']

export const siteApi = {
  /** Kênh liên hệ (Zalo / hotline / email) + pháp nhân đứng tên website. */
  info: (locale: Locale) => ({ ...SITE, owner: { ...SITE.owner, address: tr(SITE.owner.address, locale) } }),

  page: (slug: PageSlug, locale: Locale): Page => {
    const p = PAGES[slug]
    const t = (l: L) => tr(l, locale)
    return {
      slug, eyebrow: t(p.eyebrow), title: t(p.title), lead: t(p.lead), updated: p.updated, draft: p.draft,
      sections: p.sections.map(s => ({ id: s.id, title: t(s.title), body: s.body.map(t), list: s.list?.map(t), link: s.link && { href: s.link.href, label: t(s.link.label) } })),
    }
  },

  /** Huỷ / đổi ngày / lễ Tết / gián đoạn trong chính sách từng khách sạn — trang huỷ đọc thẳng, không chép lại. */
  cancelPolicies: (locale: Locale) => HOTELS.map(h => ({
    slug: h.slug,
    name: h.name,
    rows: h.policies.filter(([k]) => CANCEL_KEYS.includes(k.vi)).map(([k, v]) => [tr(k, locale), tr(v, locale)] as [string, string]),
  })),
}

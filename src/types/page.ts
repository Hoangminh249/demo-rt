// Trang tĩnh (menu Hỗ trợ). Nội dung ở src/content/pages.ts, đọc qua src/api/site.ts.
import type { L } from './global'

/** Trang tĩnh (liên hệ, chính sách). `draft`: bản Rooty soạn, chờ pháp chế duyệt — web gắn nhãn. */
export type PageSlug = 'lien-he' | 'chinh-sach-huy' | 'chinh-sach-bao-mat' | 'dieu-khoan-dat-phong'
export interface PageSectionContent { id: string; title: L; body: L[]; list?: L[]; link?: { href: string; label: L } }
export interface PageContent { slug: PageSlug; eyebrow: L; title: L; lead: L; updated: string; draft: boolean; sections: PageSectionContent[] }
export interface PageSection { id: string; title: string; body: string[]; list?: string[]; link?: { href: string; label: string } }
export interface Page { slug: PageSlug; eyebrow: string; title: string; lead: string; updated: string; draft: boolean; sections: PageSection[] }

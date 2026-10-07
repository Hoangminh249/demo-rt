import { defineRouting } from 'next-intl/routing'

// Tiếng Việt giữ URL gốc (/, /hotel/…); tiếng Anh thêm /en. Không tự đổi theo ngôn ngữ trình duyệt:
// muốn bật thì đổi localeDetection thành true.
export const routing = defineRouting({ locales: ['vi', 'en'], defaultLocale: 'vi', localePrefix: 'as-needed', localeDetection: false })

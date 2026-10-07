import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

export default createMiddleware(routing)

// Chạy cho mọi trang, trừ /api, /_next, /_vercel và file tĩnh (đường dẫn có dấu chấm như /images/a.jpg).
export const config = { matcher: '/((?!api|_next|_vercel|.*\\..*).*)' }

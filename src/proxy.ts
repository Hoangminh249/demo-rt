import { NextResponse, type NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { ADMIN_CHALLENGE, isAdmin } from './lib/admin-auth'
import { routing } from './i18n/routing'

const intl = createMiddleware(routing)

// /admin: Basic Auth, không qua next-intl (admin chỉ tiếng Việt, nằm ngoài [locale]). Còn lại: next-intl như cũ.
export default function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname
  if (path !== '/admin' && !path.startsWith('/admin/')) return intl(req)
  return isAdmin(req.headers.get('authorization'))
    ? NextResponse.next()
    : new NextResponse('Unauthorized', { status: 401, headers: ADMIN_CHALLENGE })
}

// Mẫu 1: mọi trang trừ /api, /_next, /_vercel và file tĩnh (đường dẫn có dấu chấm như /images/a.jpg).
// Mẫu 2: /admin/* kể cả đường dẫn có dấu chấm — mẫu 1 bỏ qua chúng nên /admin/x.json sẽ lọt nếu thiếu dòng này.
export const config = { matcher: ['/((?!api|_next|_vercel|.*\\..*).*)', '/admin/:path*'] }

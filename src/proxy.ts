import { NextResponse, type NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { isSession, SESSION_COOKIE } from './lib/admin-auth'
import { routing } from './i18n/routing'

const intl = createMiddleware(routing)

// /admin và /api/admin: phải có phiên đăng nhập (cookie ký HMAC), không qua next-intl (admin chỉ tiếng Việt).
// Chưa đăng nhập: trang → chuyển tới /admin/login, API → 401. Còn lại: next-intl như cũ.
export default function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname
  const isApi = path.startsWith('/api/admin/')
  if (!isApi && path !== '/admin' && !path.startsWith('/admin/')) return intl(req)

  const signedIn = isSession(req.cookies.get(SESSION_COOKIE)?.value)
  if (path === '/api/admin/session') return NextResponse.next() // đăng nhập / đăng xuất
  if (path === '/admin/login') return signedIn ? NextResponse.redirect(new URL('/admin', req.url)) : NextResponse.next()
  if (signedIn) return NextResponse.next()
  if (isApi) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const login = new URL('/admin/login', req.url)
  if (path !== '/admin') login.searchParams.set('next', path + req.nextUrl.search)
  return NextResponse.redirect(login)
}

// Mẫu 1: mọi trang trừ /api, /_next, /_vercel và file tĩnh (đường dẫn có dấu chấm như /images/a.jpg).
// Mẫu 2, 3: /admin/* và /api/admin/* kể cả đường dẫn có dấu chấm — mẫu 1 bỏ qua chúng nên /admin/x.json sẽ lọt nếu thiếu.
export const config = { matcher: ['/((?!api|_next|_vercel|.*\\..*).*)', '/admin/:path*', '/api/admin/:path*'] }

import { NextResponse, type NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { AUTHJS_COOKIES, isSession, SESSION_COOKIE } from './lib/admin-auth'
import { routing } from './i18n/routing'

const intl = createMiddleware(routing)

// /admin và /api/admin: phải có phiên — cookie ký HMAC (tài khoản env) hoặc cookie phiên Auth.js (Google / email + mã).
// Đây chỉ là lọc thô: role ADMIN/STAFF kiểm ở layout /admin và trong từng route (src/lib/admin-actor.ts). Không qua next-intl.
// Chưa đăng nhập: trang → chuyển tới /admin/login, API → 401. Còn lại: next-intl như cũ.
export default function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname
  const isApi = path.startsWith('/api/admin/')
  if (!isApi && path !== '/admin' && !path.startsWith('/admin/')) return intl(req)

  const envSession = isSession(req.cookies.get(SESSION_COOKIE)?.value)
  const signedIn = envSession || AUTHJS_COOKIES.some(c => req.cookies.has(c))
  if (path === '/api/admin/session') return NextResponse.next() // đăng nhập / đăng xuất
  // Trang đăng nhập tự chuyển về /admin nếu phiên Google có quyền; ở proxy chỉ chắc được với tài khoản env.
  if (path === '/admin/login') return envSession ? NextResponse.redirect(new URL('/admin', req.url)) : NextResponse.next()
  if (signedIn) return NextResponse.next()
  if (isApi) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const login = new URL('/admin/login', req.url)
  if (path !== '/admin') login.searchParams.set('next', path + req.nextUrl.search)
  return NextResponse.redirect(login)
}

// Mẫu 1: mọi trang trừ /api, /_next, /_vercel và file tĩnh (đường dẫn có dấu chấm như /images/a.jpg).
// Mẫu 2, 3: /admin/* và /api/admin/* kể cả đường dẫn có dấu chấm — mẫu 1 bỏ qua chúng nên /admin/x.json sẽ lọt nếu thiếu.
export const config = { matcher: ['/((?!api|_next|_vercel|.*\\..*).*)', '/admin/:path*', '/api/admin/:path*'] }

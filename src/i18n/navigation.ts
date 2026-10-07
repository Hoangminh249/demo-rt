import { createNavigation } from 'next-intl/navigation'
import { routing } from './routing'

/** Link / router tự thêm /en khi đang ở tiếng Anh. Dùng thay next/link, next/navigation cho link trong site. */
export const { Link, usePathname, useRouter } = createNavigation(routing)

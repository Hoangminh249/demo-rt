import { gohostProperties } from '@/lib/repo/admin'
import { adminGet } from '../_lib'

export const GET = adminGet(() => gohostProperties())

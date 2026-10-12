// GET /media/<yyyy>/<mm>/<uuid>.<ext> — phát ảnh admin đã tải lên (UPLOAD_DIR, Render Persistent Disk).
// Chỉ đọc trong UPLOAD_DIR (chặn ../), tên file là uuid nên cache vĩnh viễn được.
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { uploadDir } from '@/api/catalog-admin'

const TYPES: Record<string, string> = { '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif' }

export async function GET(_req: Request, ctx: RouteContext<'/media/[...path]'>) {
  const dir = uploadDir()
  const parts = (await ctx.params).path
  const type = TYPES[path.extname(parts.at(-1) ?? '').toLowerCase()]
  if (!dir || !type || !parts.every(p => /^[\w-]+(\.\w+)?$/.test(p))) return new Response('Not found', { status: 404 })
  const root = path.resolve(dir)
  const file = path.resolve(root, ...parts)
  if (!file.startsWith(root + path.sep)) return new Response('Not found', { status: 404 })
  try {
    return new Response(new Uint8Array(await readFile(file)), { headers: { 'Content-Type': type, 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff' } })
  } catch {
    return new Response('Not found', { status: 404 })
  }
}

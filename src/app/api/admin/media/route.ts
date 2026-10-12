// GET  /api/admin/media — thư viện ảnh (ảnh có sẵn trong public/ + ảnh tải lên).
// POST /api/admin/media — tải ảnh lên (multipart, field "file", có thể nhiều). Chỉ khi có UPLOAD_DIR (Render Persistent Disk);
// lưu UPLOAD_DIR/yyyy/mm/<uuid>.<ext>, phát qua /media/… (src/app/media/[...path]/route.ts). Chỉ ảnh JPEG/PNG/WebP/AVIF ≤ 8 MB.
import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { NextResponse } from 'next/server'
import { catalogAdminApi, UPLOAD_URL_PREFIX, uploadDir } from '@/api/catalog-admin'
import { db } from '@/lib/db'
import { audit, withActor } from '@/lib/audit'
import { adminGet, dbFail } from '../_lib'

const MAX_BYTES = 8 * 1024 * 1024
const TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif' }

/** Nhận diện ảnh bằng byte đầu file (không tin Content-Type trình duyệt gửi). */
function sniff(b: Buffer): string | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg'
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png'
  if (b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp'
  if (b.subarray(4, 12).toString('ascii') === 'ftypavif') return 'image/avif'
  return null
}

export const GET = adminGet(async () => {
  try {
    return await catalogAdminApi.media()
  } catch (e) {
    return dbFail(e)
  }
})

export const POST = adminGet(async (req, _ctx: unknown, actor) => {
  const dir = uploadDir()
  if (!dir) return NextResponse.json({ error: 'UPLOAD_DISABLED', message: 'Chưa bật tải ảnh (thiếu UPLOAD_DIR). Ảnh có sẵn trong public/ vẫn dùng được.' }, { status: 503 })
  const files = (await req.formData().catch(() => null))?.getAll('file').filter((f): f is File => f instanceof File) ?? []
  if (!files.length || files.length > 20) return NextResponse.json({ error: 'BAD_REQUEST', message: 'Chọn 1–20 ảnh.' }, { status: 400 })
  const now = new Date()
  const sub = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}`
  const saved: string[] = []
  try {
    for (const f of files) {
      if (f.size > MAX_BYTES) return NextResponse.json({ error: 'TOO_LARGE', message: `${f.name}: quá 8 MB.` }, { status: 413 })
      const buf = Buffer.from(await f.arrayBuffer())
      const type = sniff(buf)
      if (!type) return NextResponse.json({ error: 'BAD_TYPE', message: `${f.name}: chỉ nhận ảnh JPEG, PNG, WebP, AVIF.` }, { status: 415 })
      const rel = `${sub}/${randomUUID()}.${TYPES[type]}`
      await mkdir(path.join(dir, sub), { recursive: true })
      await writeFile(path.join(dir, rel), buf, { flag: 'wx' })
      const urlPath = `${UPLOAD_URL_PREFIX}${rel}`
      await withActor(actor.userId, () => db().$transaction(async tx => {
        const m = await tx.mediaAsset.create({ data: { path: urlPath, source: 'UPLOAD', alt: { vi: f.name.replace(/\.[^.]+$/, '') } } })
        await audit(tx, 'upload', 'MediaAsset', m.id, { path: urlPath, bytes: f.size, name: f.name })
      }))
      saved.push(urlPath)
    }
    return { ok: true, message: `Đã tải lên ${saved.length} ảnh.`, paths: saved }
  } catch (e) {
    return dbFail(e)
  }
})

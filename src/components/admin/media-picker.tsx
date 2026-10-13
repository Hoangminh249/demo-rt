'use client'
// Bộ ảnh của khách sạn / hạng phòng: sắp thứ tự, chọn ảnh bìa (GALLERY), điểm lấy nét (HERO), thêm từ thư viện, tải ảnh mới
// (khi server có UPLOAD_DIR). Lưu = một lệnh media.set (thay cả danh sách).
import { useState } from 'react'
import { ArrowLeft, ArrowRight, ImagePlus, Trash2, Upload, X } from 'lucide-react'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/overlay'
import { Empty, Photo, Skel } from '@/components/admin/ui'
import { INPUT, Notice } from '@/components/admin/form'
import { adminErrorText, useAdminMedia, useAdminWrite, useUploadMedia } from '@/hooks/use-admin'
import type { AdminMediaLink } from '@/types/admin'

function Library({ open, onClose, chosen, onPick }: { open: boolean; onClose: () => void; chosen: Set<string>; onPick: (m: { id: string; path: string }) => void }) {
  const lib = useAdminMedia()
  const upload = useUploadMedia()
  const write = useAdminWrite()
  return (
    <Dialog open={open} onClose={onClose} title="Thư viện ảnh" wide>
      {lib.data?.uploadEnabled ? (
        <label className="mb-4 flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border-strong px-4 py-3 text-sm hover:bg-item-hover">
          <Upload className="size-4" aria-hidden />{upload.isPending ? 'Đang tải lên…' : 'Tải ảnh lên (JPEG, PNG, WebP, AVIF · ≤ 8 MB)'}
          <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" disabled={upload.isPending}
            onChange={e => { const f = [...(e.target.files ?? [])]; if (f.length) upload.mutate(f); e.target.value = '' }} />
        </label>
      ) : lib.data && <p className="mb-4 text-xs text-pretty text-muted-foreground">Tải ảnh mới cần UPLOAD_DIR (ổ đĩa lưu ảnh trên Render). Hiện dùng được ảnh có sẵn trong public/.</p>}
      {upload.isSuccess && <div className="mb-3"><Notice ok>{upload.data.message}</Notice></div>}
      {upload.isError && <div className="mb-3"><Notice ok={false}>{adminErrorText(upload.error)}</Notice></div>}
      {write.isError && <div className="mb-3"><Notice ok={false}>{adminErrorText(write.error)}</Notice></div>}
      {lib.isPending ? <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">{Array.from({ length: 10 }, (_, i) => <Skel key={i} className="aspect-[4/3]" />)}</div>
        : !lib.data?.items.length ? <Empty>Thư viện chưa có ảnh.</Empty> : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {lib.data.items.map(m => {
              const on = chosen.has(m.id)
              return (
                <div key={m.id} className="group relative min-w-0">
                  <button type="button" disabled={on} onClick={() => onPick({ id: m.id, path: m.path })} aria-label={on ? 'Đã chọn' : `Thêm ${m.path}`}
                    className={cn('block w-full overflow-hidden rounded-xl ring-offset-2 focus-visible:ring-2 focus-visible:ring-focus', on && 'opacity-40')}>
                    <Photo src={m.path} sizes="20vw" className="aspect-[4/3]" />
                  </button>
                  <p className="mt-1 truncate text-[11px] text-muted-foreground" title={m.path}>{m.source === 'UPLOAD' ? 'Tải lên' : 'Có sẵn'} · {m.used ? `dùng ${m.used}` : 'chưa dùng'}</p>
                  {m.source === 'UPLOAD' && !m.used && (
                    <button type="button" aria-label="Xoá ảnh khỏi thư viện" disabled={write.isPending} onClick={() => confirm('Xoá hẳn ảnh này?') && write.mutate({ op: 'media.delete', id: m.id })}
                      className="absolute top-1 right-1 hidden size-7 place-items-center rounded-lg bg-white/90 text-red-600 group-hover:grid"><Trash2 className="size-4" /></button>
                  )}
                </div>
              )
            })}
          </div>
        )}
    </Dialog>
  )
}

/** `kind`: 'GALLERY' (ảnh khách sạn, có ảnh bìa) · 'HERO' (banner trang chủ, có điểm lấy nét) · 'ROOM' (ảnh hạng phòng, ảnh đầu = ảnh thẻ). */
export function MediaSet({ title, hint, target, targetId, kind, value }: {
  title: string; hint?: string; target: 'hotel' | 'roomType'; targetId: string; kind: 'GALLERY' | 'HERO' | 'ROOM'; value: AdminMediaLink[]
}) {
  const write = useAdminWrite()
  const [items, setItems] = useState(value)
  const [cover, setCover] = useState<string | null>(value.find(v => v.isCover)?.mediaId ?? value[0]?.mediaId ?? null)
  const [lib, setLib] = useState(false)
  const dirty = JSON.stringify(items) !== JSON.stringify(value) || (kind === 'GALLERY' && cover !== (value.find(v => v.isCover)?.mediaId ?? value[0]?.mediaId ?? null))
  const move = (i: number, d: number) => { const a = [...items]; const [x] = a.splice(i, 1); a.splice(i + d, 0, x); setItems(a) }
  const save = () => write.mutate({
    op: 'media.set', target, targetId, kind: kind === 'HERO' ? 'HERO' : 'GALLERY',
    items: items.map(i => ({ mediaId: i.mediaId, focus: kind === 'HERO' ? i.focus || 'center' : null })),
    coverId: kind === 'GALLERY' ? (items.some(i => i.mediaId === cover) ? cover : items[0]?.mediaId ?? null) : null,
  })
  const btn = 'grid size-7 place-items-center rounded-md bg-white/90 text-foreground shadow-sm hover:bg-white disabled:opacity-30'

  return (
    <section className="grid gap-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div><h4 className="text-sm font-semibold">{title} <span className="font-normal text-muted-foreground tabular-nums">· {items.length}</span></h4>{hint && <p className="text-xs text-muted-foreground">{hint}</p>}</div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setLib(true)}><ImagePlus aria-hidden />Thêm ảnh</Button>
          <Button type="button" size="sm" loading={write.isPending} disabled={!dirty} onClick={save}>Lưu bộ ảnh</Button>
        </div>
      </div>
      {items.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-6">
          {items.map((m, i) => (
            <figure key={m.mediaId} className="min-w-0">
              <div className="relative">
                <Photo src={m.path} sizes="(min-width: 1280px) 16vw, (min-width: 640px) 25vw, 50vw" className={cn('aspect-[4/3] rounded-xl', kind === 'GALLERY' && cover === m.mediaId && 'ring-2 ring-primary ring-offset-2')} />
                <span className="absolute top-1.5 left-1.5 rounded-md bg-black/60 px-1.5 text-[11px] font-semibold text-white tabular-nums">{i + 1}</span>
                <div className="absolute right-1.5 bottom-1.5 flex gap-1">
                  <button type="button" aria-label="Lên trước" disabled={i === 0} onClick={() => move(i, -1)} className={btn}><ArrowLeft className="size-3.5" /></button>
                  <button type="button" aria-label="Ra sau" disabled={i === items.length - 1} onClick={() => move(i, 1)} className={btn}><ArrowRight className="size-3.5" /></button>
                  <button type="button" aria-label="Gỡ ảnh" onClick={() => setItems(items.filter(x => x.mediaId !== m.mediaId))} className={`${btn} text-red-600`}><X className="size-3.5" /></button>
                </div>
              </div>
              {kind === 'GALLERY' && (
                <label className="mt-1.5 flex items-center gap-1.5 text-xs"><input type="radio" name={`cover-${targetId}`} checked={cover === m.mediaId} onChange={() => setCover(m.mediaId)} />Ảnh bìa</label>
              )}
              {kind === 'HERO' && (
                <input value={m.focus ?? ''} placeholder="center" aria-label={`Điểm lấy nét ảnh ${i + 1}`} title="object-position: center, 50% 30%, left…"
                  onChange={e => setItems(items.map(x => (x.mediaId === m.mediaId ? { ...x, focus: e.target.value } : x)))} className={`${INPUT} mt-1.5 h-8 text-xs`} />
              )}
              {kind === 'ROOM' && i === 0 && <p className="mt-1 text-xs text-muted-foreground">Ảnh thẻ phòng</p>}
            </figure>
          ))}
        </div>
      ) : <Empty>Chưa có ảnh — web hiện khung “Ảnh đang cập nhật”.</Empty>}
      {write.isSuccess && !dirty && <Notice ok>{write.data.message}</Notice>}
      {write.isError && <Notice ok={false}>{adminErrorText(write.error)}</Notice>}
      <Library open={lib} onClose={() => setLib(false)} chosen={new Set(items.map(i => i.mediaId))}
        onPick={m => setItems([...items, { mediaId: m.id, path: m.path, isCover: false, focus: kind === 'HERO' ? 'center' : null }])} />
    </section>
  )
}

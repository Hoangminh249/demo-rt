'use client'
import Link from 'next/link'
import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { repo } from '@/lib/repo'
import { useAsync } from '@/store/provider'
import { useAdmin } from '@/components/admin/use-admin'
import { fmtDate, fmtDateTime } from '@/lib/format'
import { Badge, Button, Card, Empty, Field, Input, PageTitle, SkeletonList, Table, Textarea } from '@/components/ui'
import { toast } from '@/components/ui/overlay'

function BannerForm({ initial, canEdit }: { initial: { headline: string; sub: string }; canEdit: boolean }) {
  const [f, setF] = useState(initial)
  return (
    <form onSubmit={async e => { e.preventDefault(); await repo.saveBanner(f); toast('Đã cập nhật banner trang chủ') }} className="space-y-3">
      <Field label="Tiêu đề"><Input disabled={!canEdit} value={f.headline} onChange={e => setF({ ...f, headline: e.target.value })} /></Field>
      <Field label="Mô tả"><Textarea disabled={!canEdit} value={f.sub} onChange={e => setF({ ...f, sub: e.target.value })} /></Field>
      <div className="flex gap-2">{canEdit && <Button type="submit">Lưu banner</Button>}<Link href="/" target="_blank" className="inline-flex h-10 items-center gap-1 px-2 text-sm text-primary">Xem trang chủ <ExternalLink className="size-3.5" /></Link></div>
    </form>
  )
}

export default function ContentAdmin() {
  const a = useAdmin()
  const canEdit = a.can('content', 'full')
  const banner = useAsync(() => repo.getBanner(), [])
  const articles = useAsync(() => repo.listArticles(true), [])
  const leads = useAsync(() => repo.listLeads(), [])
  const hotels = repo.hotelsSync().filter(h => !a.locked || h.id === a.locked)
  return (
    <div className="space-y-6">
      <PageTitle title="Content" sub="Trang khách sạn, cẩm nang, banner trang chủ (giả lập CMS)" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5"><h2 className="mb-3 font-semibold">Banner trang chủ</h2>{banner.data ? <BannerForm initial={banner.data} canEdit={canEdit} /> : <SkeletonList rows={1} />}</Card>
        <Card className="p-5">
          <h2 className="mb-3 font-semibold">Trang khách sạn</h2>
          <ul className="divide-y divide-border text-sm">
            {hotels.map(h => (
              <li key={h.id} className="flex items-center justify-between py-2">
                <span><span className="font-medium">{h.name}</span><span className="block text-xs text-muted-foreground">/{h.slug} · 9 mục: tổng quan, phòng, tiện ích, nhà hàng, trải nghiệm, gallery, chính sách, ưu đãi, đặt phòng</span></span>
                <Link href={`/admin/hotels/${h.id}`} className="text-primary hover:underline">Sửa</Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <section>
        <h2 className="mb-2 font-semibold">Cẩm nang</h2>
        {!articles.data ? <SkeletonList /> : (
          <Table>
            <thead><tr><th>Bài viết</th><th>Chuyên mục</th><th>Ngày</th><th>Trạng thái</th><th /></tr></thead>
            <tbody>{articles.data.map(x => (
              <tr key={x.slug}>
                <td><Link href={`/cam-nang/${x.slug}`} target="_blank" className="font-medium hover:text-primary">{x.title}</Link></td>
                <td>{x.category}</td><td>{fmtDate(x.date)}</td>
                <td>{x.published ? <Badge tone="ok">Đã đăng</Badge> : <Badge>Ẩn</Badge>}</td>
                <td>{canEdit && <Button size="sm" variant="ghost" onClick={async () => { await repo.saveArticle(x.slug, { published: !x.published }); toast(x.published ? 'Đã ẩn bài viết' : 'Đã đăng bài viết') }}>{x.published ? 'Ẩn' : 'Đăng'}</Button>}</td>
              </tr>
            ))}</tbody>
          </Table>
        )}
      </section>
      <section>
        <h2 className="mb-2 font-semibold">Yêu cầu báo giá (Hội nghị & Wedding)</h2>
        {!leads.data ? <SkeletonList rows={1} /> : leads.data.length === 0 ? <Empty title="Chưa có yêu cầu">Gửi thử ở trang <Link href="/hoi-nghi-su-kien" className="text-primary underline">Hội nghị & Sự kiện</Link> hoặc <Link href="/wedding" className="text-primary underline">Wedding</Link>.</Empty> : (
          <Table>
            <thead><tr><th>Loại</th><th>Khách</th><th>Ngày dự kiến</th><th className="text-right">Số khách</th><th>Ghi chú</th><th>Gửi lúc</th></tr></thead>
            <tbody>{leads.data.map(l => <tr key={l.id}><td><Badge tone={l.kind === 'wedding' ? 'info' : 'brand'}>{l.kind === 'wedding' ? 'Wedding' : 'MICE'}</Badge></td><td>{l.name}<div className="text-xs text-muted-foreground">{l.phone} · {l.email}</div></td><td>{l.date && fmtDate(l.date)}</td><td className="text-right">{l.guests}</td><td className="text-xs">{l.note}</td><td className="text-xs">{fmtDateTime(l.at)}</td></tr>)}</tbody>
          </Table>
        )}
      </section>
    </div>
  )
}

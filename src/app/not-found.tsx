import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <p className="text-6xl font-bold text-brand-accent">404</p>
      <h1 className="mt-3 text-xl font-semibold">Không tìm thấy trang</h1>
      <p className="mt-2 text-muted-foreground">Đường dẫn khách sạn có dạng rootyhospitality.com/ten-khach-san.</p>
      <Link href="/" className="mt-6 inline-block rounded-lg bg-primary px-4 py-2 font-semibold text-white">Về trang chủ</Link>
    </div>
  )
}

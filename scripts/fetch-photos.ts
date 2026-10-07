// Tải ảnh thật của khách sạn từ Google Drive "4. ROOTY HOSPITALITY/<KS>/HÌNH ẢNH" về public/images (không hotlink Drive).
// Dùng ảnh thu nhỏ của Drive (`sz=s<cạnh dài>`) để có cỡ vừa web — next.config đang để images.unoptimized.
// Thêm ảnh: tìm ID trong Drive (mở ảnh → link /file/d/<ID>/view), thêm một dòng, chạy `yarn photos`. File đã có thì bỏ qua.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const GALLERY = 1600 // cạnh dài, bìa + bộ ảnh (mở to trong lightbox)
const ROOM = 1200 // ảnh hạng phòng

// đường dẫn trong public/images → [ID file Drive, cạnh dài, tên gốc trên Drive để đối chiếu]
const PHOTOS: Record<string, [id: string, size: number, original: string]> = {
  'pito-hon-thom/mat-tien': ['1pcu9L2pKRcSsD7MjMbqmlN9SRSMymxjw', GALLERY, 'Outside and inside/53e4376232fabfa4e6eb1.jpg'],
  'pito-hon-thom/sanh': ['1-Kt004PaNCvw8vU7a54oj1A3qTYt0QVm', GALLERY, 'Outside and inside/27718395009943719155.jpg'],
  'pito-hon-thom/terrace-3': ['1rG0WkOjDzkeCfBhIYDaT-C4ZOlsssC3z', GALLERY, 'Terrace/86b45366-f921-4cf9-873f-7b0dde14f944.jpg'],
  'pito-hon-thom/mat-tien-2': ['1be6iot4bBEudtEP903ViEz7KShZOAn7f', GALLERY, 'Outside and inside/93ed8e168b8e06d05f9f2.jpg'],
  'pito-hon-thom/le-tan': ['1WAS-KEQrPVlnWGr0RUn-73rYhVY01KTq', GALLERY, 'Outside and inside/3df3c601c3994ec7178810.jpg'],
  'pito-hon-thom/terrace-1': ['1g29cuVExk1I8LshatvF-fvBIEvpfz5e3', GALLERY, 'Terrace/162792074334269660648.jpg'],
  'pito-hon-thom/terrace-2': ['12YAA4DFfO2llQuZ3F7y0L_EHFsA06nWC', GALLERY, 'Terrace/254252136614961529747.jpg'],
  'pito-hon-thom/ban-cong-301': ['1iByImj2OdIC3YOixKiBZ45ME5K-QeLlr', GALLERY, 'Room 301/1fcc69dfa22f2f71763e105.jpg'],
  'pito-hon-thom/cua-so-tron-403': ['1b_j2Z5bkOPihK6TyEIrXueX51HCC9RK-', GALLERY, 'Room 403/370500628343300856221.jpg'],
  'pito-hon-thom/rooms/superior-1': ['1tM1k0JEE6RTpszIiBiUm6hmeU0_D15Rz', ROOM, 'Room 402/112863934232171433531.jpg'],
  'pito-hon-thom/rooms/superior-2': ['1JLOjaXjJs9DCHoRZqZae2ni_zQmBOC3m', ROOM, 'Room 302/87da73835f40d21e8b5112.jpg'],
  'pito-hon-thom/rooms/superior-3': ['1scXeZCDvzCpJCLqJdpRRR2YvZ-dZVL5W', ROOM, 'Room 302/18167e4f528cdfd2869d14.jpg'],
  'pito-hon-thom/rooms/superior-4': ['1ISGTxreLRZBXk2p4JhuNSjBi7DcrcDeN', ROOM, 'Room 202/58160692795946987982.jpg'],
  'pito-hon-thom/rooms/deluxe-bathtub-1': ['1LuT27jpA7uXv1Dfrqky8m1sUL4JGobAd', ROOM, 'Room 303/275f521ea8e825b67cf987.jpg'],
  'pito-hon-thom/rooms/deluxe-bathtub-2': ['1UXg1JsSpC_qjKv_xEnFk1910sqnywR8k', ROOM, 'Room 303/58fe62839875152b4c6490.jpg'],
  'pito-hon-thom/rooms/deluxe-bathtub-3': ['1IBX_dqATZAewKx3U3wZfIZJyuFensmqW', ROOM, 'Room 503/1d8cb6809843151d4c5243.jpg'],
  'pito-hon-thom/rooms/deluxe-bathtub-4': ['1BBRwE1dTXThp1jdD3y1215tlSwtWInOx', ROOM, 'Room 403/370500628343300856218.jpg'],
  'pito-hon-thom/rooms/premier-bathtub-1': ['16Hhp3q9JLGUrkqlVtxGMVG5Yd0ynhf49', ROOM, 'Room 201/244124632961835398271.jpg'],
  'pito-hon-thom/rooms/premier-bathtub-2': ['1uw1R71ff5CFsgJMrUB2NB8i41jgUoios', ROOM, 'Room 201/0f8947247bd2f68cafc377.jpg'],
  'pito-hon-thom/rooms/premier-bathtub-3': ['1MoNkD5jV8SLvVF9RqJ72yXd9-oHvPIDc', ROOM, 'Room 301/b6816395a865253b7c74106.jpg'],
}

const OUT = join(__dirname, '..', 'public', 'images')

async function main() {
  const failed: string[] = []
  let bytes = 0
  for (const [path, [id, size]] of Object.entries(PHOTOS)) {
    const file = join(OUT, `${path}.jpg`)
    if (existsSync(file)) continue
    const res = await fetch(`https://drive.google.com/thumbnail?id=${id}&sz=s${size}`)
    // Drive trả trang HTML (đăng nhập, quá tải) thay vì ảnh khi file chưa chia sẻ công khai → báo lỗi, không ghi file.
    if (!res.ok || !res.headers.get('content-type')?.startsWith('image/')) { failed.push(`${path} (${res.status})`); continue }
    const buf = Buffer.from(await res.arrayBuffer())
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, buf)
    bytes += buf.length
    process.stdout.write('.')
  }
  console.log(`\nXong, tải ${(bytes / 1048576).toFixed(1)} MB. Lỗi: ${failed.join(', ') || 'không'}`)
  if (failed.length) process.exitCode = 1
}
main()

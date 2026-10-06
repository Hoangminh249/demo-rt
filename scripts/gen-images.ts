// Sinh ảnh placeholder SVG (gradient + icon + tên) vào public/images theo đúng đường dẫn trong dữ liệu.
// Thay ảnh thật: ghi đè file cùng tên (có thể đổi đuôi .jpg và sửa đường dẫn trong src/data).
// Chạy: yarn images
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { HOTELS, ROOM_TYPES } from '../src/data/hotels'
import { ADDONS, PROMOTIONS } from '../src/data/commerce'
import { ARTICLES, DESTINATIONS, EXPERIENCES } from '../src/data/content'

const OUT = join(__dirname, '..', 'public')
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)

function svg(title: string, sub: string, hue: number, variant: number) {
  const h2 = (hue + 25) % 360
  const sun = 820 + (variant % 5) * 60
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="1200" height="800">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue} 45% 38%)"/><stop offset="1" stop-color="hsl(${h2} 55% 70%)"/></linearGradient></defs>
<rect width="1200" height="800" fill="url(#g)"/>
<circle cx="${sun}" cy="${220 + (variant % 3) * 30}" r="90" fill="hsl(45 90% 85% / .55)"/>
<path d="M0 560 Q 200 ${500 + (variant % 4) * 15} 400 560 T 800 560 T 1200 560 V800 H0Z" fill="hsl(${hue} 50% 25% / .35)"/>
<path d="M0 640 Q 250 590 500 640 T 1000 640 T 1500 640 V800 H0Z" fill="hsl(${hue} 50% 18% / .35)"/>
<text x="60" y="690" font-family="Be Vietnam Pro, Segoe UI, Arial, sans-serif" font-size="56" font-weight="700" fill="#fff">${esc(title)}</text>
<text x="60" y="740" font-family="Be Vietnam Pro, Segoe UI, Arial, sans-serif" font-size="26" fill="#fff" fill-opacity=".85">${esc(sub)} · Ảnh minh hoạ — thay bằng ảnh thật</text>
</svg>`
}

const items: [string, string, string, number][] = []
const GALLERY = ['Toàn cảnh', 'Hồ bơi', 'Bãi biển', 'Sảnh đón', 'Nhà hàng', 'Phòng ngủ', 'Spa', 'Hoàng hôn']
for (const h of HOTELS) {
  items.push([h.cover, h.name, h.tagline, h.hue])
  h.gallery.forEach((g, i) => items.push([g, h.name, GALLERY[i % GALLERY.length], h.hue + i * 4]))
}
for (const r of ROOM_TYPES) {
  const h = HOTELS.find(x => x.id === r.hotel_id)!
  items.push([r.image, r.name, `${h.name} · ${r.view}`, h.hue + 10])
}
for (const p of PROMOTIONS) items.push([p.image, p.name.split('–')[0].trim(), 'Ưu đãi Rooty Hospitality', 160 + (hash(p.id) % 60)])
for (const a of ADDONS) items.push([a.image, a.name, a.provider, a.provider === 'RIVUS' ? 215 : a.provider === 'Rooty Trip' ? 175 : 30])
for (const d of DESTINATIONS) items.push([d.image, d.name, 'Điểm đến', 180 + (hash(d.slug) % 40)])
for (const e of EXPERIENCES) items.push([e.image, e.name, 'Trải nghiệm', 150 + (hash(e.slug) % 80)])
for (const a of ARTICLES) items.push([a.image, a.title.slice(0, 34), 'Cẩm nang', 170 + (hash(a.slug) % 50)])
items.push(['/images/hero.svg', 'Rooty Hospitality', 'Phú Quốc', 172])
items.push(['/images/mice.svg', 'Hội nghị & Sự kiện', 'MICE', 200])
items.push(['/images/wedding.svg', 'Wedding', 'Tiệc cưới bên biển', 340])
items.push(['/images/loyalty.svg', 'Rooty Members', 'Thành viên', 165])

for (const [path, title, sub, hue] of items) {
  const file = join(OUT, path)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, svg(title, sub, hue % 360, hash(path)))
}

// Bản đồ tĩnh Phú Quốc (đường bờ phác hoạ) — ghim khách sạn vẽ đè trong component.
const P = (lng: number, lat: number) => `${(((lng - 103.8) / 0.32) * 400).toFixed(0)},${(((10.48 - lat) / 0.58) * 600).toFixed(0)}`
const island = [[103.93, 10.46], [103.99, 10.42], [104.05, 10.38], [104.075, 10.3], [104.07, 10.18], [104.06, 10.08], [104.04, 10.01], [104.0, 9.97], [103.985, 10.02], [103.97, 10.1], [103.95, 10.2], [103.9, 10.3], [103.85, 10.36], [103.84, 10.4], [103.88, 10.44]]
writeFileSync(join(OUT, 'images/map-phu-quoc.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" width="400" height="600">
<rect width="400" height="600" fill="#cfe8f0"/>
<polygon points="${island.map(([a, b]) => P(a, b)).join(' ')}" fill="#e7f0d8" stroke="#9fbf8a" stroke-width="3"/>
<ellipse cx="${P(104.02, 9.94).split(',')[0]}" cy="${P(104.02, 9.94).split(',')[1]}" rx="12" ry="7" fill="#e7f0d8" stroke="#9fbf8a" stroke-width="2"/>
<text x="20" y="580" font-family="Arial" font-size="13" fill="#4b6b73">Bản đồ minh hoạ — không theo tỉ lệ</text>
</svg>`)
console.log(`Đã tạo ${items.length + 1} ảnh placeholder`)

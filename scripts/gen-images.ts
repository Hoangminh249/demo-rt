// Sinh bản đồ tĩnh Phú Quốc (đường bờ phác hoạ) cho chế độ xem bản đồ. Ảnh chụp thì xem `yarn photos`.
// Chạy: yarn images
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

const P = (lng: number, lat: number) => `${(((lng - 103.8) / 0.32) * 400).toFixed(0)},${(((10.48 - lat) / 0.58) * 600).toFixed(0)}`
const island = [[103.93, 10.46], [103.99, 10.42], [104.05, 10.38], [104.075, 10.3], [104.07, 10.18], [104.06, 10.08], [104.04, 10.01], [104.0, 9.97], [103.985, 10.02], [103.97, 10.1], [103.95, 10.2], [103.9, 10.3], [103.85, 10.36], [103.84, 10.4], [103.88, 10.44]]
const [hx, hy] = P(104.02, 9.94).split(',')

writeFileSync(join(__dirname, '..', 'public', 'images', 'map-phu-quoc.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" width="400" height="600">
<rect width="400" height="600" fill="#d7ebef"/>
<polygon points="${island.map(([a, b]) => P(a, b)).join(' ')}" fill="#eef3e6" stroke="#b6cfa6" stroke-width="2"/>
<ellipse cx="${hx}" cy="${hy}" rx="12" ry="7" fill="#eef3e6" stroke="#b6cfa6" stroke-width="2"/>
<text x="20" y="580" font-family="Arial" font-size="13" fill="#5b6866">Bản đồ minh hoạ — không theo tỉ lệ</text>
</svg>`)
console.log('Đã tạo map-phu-quoc.svg')

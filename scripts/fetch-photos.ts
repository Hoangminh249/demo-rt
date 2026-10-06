// Tải ảnh mẫu Unsplash về public/images (không hotlink — giữ yêu cầu prompt 02).
// Ảnh MẪU: thay bằng ảnh thật của khách sạn trước khi chạy thật (ghi đè file cùng tên).
// Chạy: yarn photos
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'

const P = {
  pool: ['1610641818989-c2051b5e2cfd', '1551918120-9739cb430c6d', '1571003123894-1f0594d2b5d9', '1488345979593-09db0f85545f', '1561501900-3701fa6a0864', '1596445160941-797eb529e19a', '1527142879-95b61a0b8226', '1562407132-e23789f81bb7', '1521750465-672a0f580901', '1500815845799-7748ca339f27'],
  ocean: ['1609602126247-4ab7188b4aa1', '1624964649310-8fa8af99b4e7', '1605538032432-a9f0c8d9baac', '1709805619372-40de3f158e83', '1759299983175-295c32e5b2d9', '1708920326697-b219695c89ba', '1702830499141-a0634d87d6af', '1759299983523-d883f6ecf097'],
  villa: ['1596178067639-5c6e68aea6dc', '1582610116397-edb318620f90', '1613977257488-902d4de070b8', '1603034203013-d532350372c6', '1581974206967-93856b25aa13', '1651108066220-f61c22fc281f', '1692736933760-8a8a9b8c1b6f', '1675657144361-98ae33e6b6f9'],
  bedroom: ['1611892440504-42a792e24d32', '1629140727571-9b5c6f6267b4', '1631049307264-da0ec9d70304', '1631049552057-403cdb8f0658', '1568495248636-6432b97bd949', '1590490360182-c33d57733427', '1576354302919-96748cb8299e', '1630660664869-c9d3cc676880', '1631049421450-348ccd7f8949', '1552858725-a19e7fcd3ac4', '1559414059-34fe0a59e57a', '1549638441-b787d2e11f14'],
  tropical: ['1605538108568-7f0d77a214c1', '1594433575301-cf59b8ada6b1', '1558117338-aa433feb1c62', '1516203722367-8b43ba2ec073', '1605581813258-076a6654a37f', '1658591049748-4937f0a9051a', '1674205710296-606898df6642', '1722428667804-4cc2f260848b'],
  bungalow: ['1552385375-10049c62b6f9', '1665375571922-95b43f76a214', '1692417045306-bb61bfe7afd4', '1665375571897-ca7124831aa4', '1665375571919-e6dac80edca7', '1625224588813-cc8d5055493f', '1609602126473-2941dc2c58bc', '1579117460782-ffbb1ec4bafe', '1626526371766-4008339e0d7c', '1565065590167-59f260459e86'],
  seafood: ['1758448786233-2051ecd150c8', '1657485990998-4b6fca3ca696', '1657486004957-dc1114aa4849', '1710464213364-4d339be3eb2e', '1729543239723-1feccd5c00b6', '1748244452972-8d81858d2081', '1657485991003-127e74dc8fb2', '1759369983522-b12cd771fe01'],
  spa: ['1544161515-4ab6ce6db874', '1591343395082-e120087004b4', '1596178060671-7a80dc8059ea', '1630595632518-8217c0bceb8f', '1611920629515-3f76f8c36b37', '1656570788675-1de3a58747e6', '1716893917077-5b320c1ecfec'],
  boat: ['1708705261234-605b15436541', '1662536998749-241444d693b0', '1538825996775-f9e58951a1bb', '1681221822847-785d4b7e1827', '1645074685419-65072e107ffb', '1516911594441-ab64c0d553f0', '1662536998892-ddc0402983a8'],
  yacht: ['1562281302-809108fd533c', '1593351415075-3bac9f45c877', '1534619039567-4db91b8d7e31', '1569282066844-679ec34e3416', '1570422774250-c951ec3ef74c', '1574850802664-10ad30c3ed80'],
  breakfast: ['1596252890311-caa6a004a6ee', '1578704311587-4fbd590630d5', '1535567465397-7523840f2ae9', '1540304453527-62f979142a17', '1547464040-670c959f79cf', '1535479939465-f597a4f58943'],
  pq: ['1746292448726-9e75b5f1067d', '1693294603830-f44c9511d643', '1730714103959-5d5a30acf547', '1732243395944-cb3ff9311091', '1693282814784-649be45a459b', '1609597254239-d9ace3c0b39c', '1732784258726-23832e93dc59', '1693282815546-f7eeb0fa909b', '1698809807960-758cf416e96e', '1621094305060-081171d1c171', '1737192579368-d81c7a468166', '1587772495731-909d40b30851', '1581551395534-8e9e29d90caf'],
  family: ['1595182084742-abd9ecc0f0c8', '1597524678053-5e6fef52d8a3', '1576696058573-12b47c49559e', '1591849995584-262878b2d556', '1550096197-74450b766366', '1593294575374-433c3b5c2d47'],
  van: ['1495150434753-f8ceb319e9dc', '1647206826104-6df8ef5fc59f', '1621120219014-058fa0e4f6fd', '1621120201311-ceab79f6c036'],
  couple: ['1615966650071-855b15f29ad1', '1623137285582-8a3608b5ff09', '1578660692094-da697dfc1c78', '1575388104683-e076ee9ccaa0'],
  lobby: ['1723516908282-b3c795e9416a', '1688741663046-d4b95efb3bd9', '1696158773201-b726a0ce6d6e', '1666101052610-ba6e6c4e18fa', '1676089775605-9de96f8e02f8', '1561501878-aabd62634533', '1660061540566-e537ad1f67dc', '1742844553019-5874910636d4'],
  snorkel: ['1583364493238-248032147fbd', '1637308109237-4ea1a7dd22f5', '1682687981630-cefe9cd73072'],
  plane: ['1543797414-a0c3ad076f7c', '1603277103691-756354934c2d', '1565444007614-6b38c78224df'],
}
type Cat = keyof typeof P

// đường dẫn ảnh → [nhóm, vị trí ưu tiên]
const MAP: [string, Cat, number][] = [
  ['hero', 'tropical', 4],
  ['pito-hon-thom/cover', 'pool', 0], ['pito-hon-thom/gallery-1', 'pool', 1], ['pito-hon-thom/gallery-2', 'tropical', 0], ['pito-hon-thom/gallery-3', 'lobby', 0], ['pito-hon-thom/gallery-4', 'seafood', 0],
  ['pito-hon-thom/gallery-5', 'bedroom', 0], ['pito-hon-thom/gallery-6', 'spa', 0], ['pito-hon-thom/gallery-7', 'pq', 0], ['pito-hon-thom/gallery-8', 'breakfast', 0],
  ['calista/cover', 'pool', 2], ['calista/gallery-1', 'pool', 3], ['calista/gallery-2', 'lobby', 1], ['calista/gallery-3', 'breakfast', 1], ['calista/gallery-4', 'bedroom', 1],
  ['calista/gallery-5', 'spa', 1], ['calista/gallery-6', 'seafood', 1], ['calista/gallery-7', 'lobby', 2], ['calista/gallery-8', 'bedroom', 2],
  ['sao-bien-bai-dai/cover', 'villa', 0], ['sao-bien-bai-dai/gallery-1', 'villa', 1], ['sao-bien-bai-dai/gallery-2', 'villa', 2], ['sao-bien-bai-dai/gallery-3', 'tropical', 1], ['sao-bien-bai-dai/gallery-4', 'seafood', 2],
  ['sao-bien-bai-dai/gallery-5', 'spa', 2], ['sao-bien-bai-dai/gallery-6', 'bungalow', 0], ['sao-bien-bai-dai/gallery-7', 'villa', 3], ['sao-bien-bai-dai/gallery-8', 'pq', 1],
  ['ngoc-lan-boutique/cover', 'lobby', 3], ['ngoc-lan-boutique/gallery-1', 'bedroom', 3], ['ngoc-lan-boutique/gallery-2', 'breakfast', 2], ['ngoc-lan-boutique/gallery-3', 'lobby', 4], ['ngoc-lan-boutique/gallery-4', 'bedroom', 4],
  ['ngoc-lan-boutique/gallery-5', 'pq', 2], ['ngoc-lan-boutique/gallery-6', 'breakfast', 3], ['ngoc-lan-boutique/gallery-7', 'lobby', 5], ['ngoc-lan-boutique/gallery-8', 'pq', 3],
  ['rang-dong-bay/cover', 'bungalow', 1], ['rang-dong-bay/gallery-1', 'bungalow', 2], ['rang-dong-bay/gallery-2', 'bungalow', 3], ['rang-dong-bay/gallery-3', 'tropical', 2], ['rang-dong-bay/gallery-4', 'spa', 3],
  ['rang-dong-bay/gallery-5', 'seafood', 3], ['rang-dong-bay/gallery-6', 'pool', 4], ['rang-dong-bay/gallery-7', 'bungalow', 4], ['rang-dong-bay/gallery-8', 'tropical', 3],
  ['pito-hon-thom/rooms/deluxe-ocean-view', 'ocean', 0], ['pito-hon-thom/rooms/family-ocean-view', 'ocean', 1], ['pito-hon-thom/rooms/family-suite', 'ocean', 2], ['pito-hon-thom/rooms/superior-garden', 'bedroom', 5],
  ['calista/rooms/superior-city-view', 'bedroom', 6], ['calista/rooms/deluxe-pool-view', 'ocean', 3], ['calista/rooms/family-suite', 'bedroom', 7],
  ['sao-bien-bai-dai/rooms/deluxe-ocean', 'ocean', 4], ['sao-bien-bai-dai/rooms/garden-villa', 'villa', 4], ['sao-bien-bai-dai/rooms/beachfront-pool-villa', 'villa', 5],
  ['ngoc-lan-boutique/rooms/standard-city', 'bedroom', 8], ['ngoc-lan-boutique/rooms/deluxe-balcony', 'bedroom', 9],
  ['rang-dong-bay/rooms/deluxe-garden', 'bungalow', 5], ['rang-dong-bay/rooms/ocean-bungalow', 'bungalow', 6], ['rang-dong-bay/rooms/family-bungalow', 'bungalow', 7],
  ['offers/early-bird', 'plane', 0], ['offers/stay-longer', 'tropical', 5], ['offers/family', 'family', 1], ['offers/honeymoon', 'couple', 0], ['offers/package', 'boat', 0],
  ['addons/transfer', 'van', 0], ['addons/tour-4-dao', 'boat', 1], ['addons/tour-bac-dao', 'pq', 4], ['addons/cau-muc', 'boat', 2], ['addons/rivus-cano', 'boat', 3],
  ['addons/rivus-sunset', 'yacht', 0], ['addons/spa', 'spa', 4], ['addons/dinner', 'seafood', 4],
  ['destinations/phu-quoc', 'pq', 5], ['destinations/bac-dao', 'pq', 6], ['destinations/trung-tam', 'pq', 7], ['destinations/nam-dao', 'pq', 8],
  ['experiences/am-thuc', 'seafood', 5], ['experiences/spa', 'spa', 5], ['experiences/ho-boi', 'pool', 6], ['experiences/hoat-dong', 'snorkel', 0],
  ['experiences/tour', 'boat', 4], ['experiences/transfer', 'van', 1], ['experiences/rivus', 'yacht', 1],
  ['articles/phu-quoc-mua-nao-dep', 'pq', 9], ['articles/lich-trinh-3-ngay-2-dem', 'family', 3], ['articles/cap-treo-hon-thom', 'pq', 10], ['articles/an-gi-o-phu-quoc', 'seafood', 6],
  ['articles/du-thuyen-rivus', 'yacht', 2], ['articles/phu-quoc-voi-tre-nho', 'family', 4],
  ['mice', 'lobby', 6], ['wedding', 'couple', 1], ['loyalty', 'pool', 7],
]

const OUT = join(__dirname, '..', 'public', 'images')
const used = new Set<string>()
const wide = (p: string) => /cover|hero|offers|destinations/.test(p)

async function get(id: string, w: number) {
  const res = await fetch(`https://images.unsplash.com/photo-${id}?w=${w}&q=72&auto=format&fit=crop&fm=jpg`)
  return res.ok ? Buffer.from(await res.arrayBuffer()) : null
}

async function main() {
  const failed: string[] = []
  for (const [path, cat, pref] of MAP) {
    const file = join(OUT, `${path}.jpg`)
    if (existsSync(file)) { continue }
    const ids = [...P[cat].slice(pref), ...P[cat].slice(0, pref)]
    let ok = false
    for (const id of ids) {
      if (used.has(id) && ids.some(x => !used.has(x))) continue // mỗi mục một ảnh khác nhau khi còn ảnh
      const buf = await get(id, wide(path) ? 1600 : 1000)
      if (!buf) { console.log(`  404 ${id}`); continue }
      mkdirSync(dirname(file), { recursive: true })
      writeFileSync(file, buf)
      used.add(id)
      ok = true
      break
    }
    if (!ok) failed.push(path)
    process.stdout.write('.')
  }
  console.log(`\nXong. Lỗi: ${failed.join(', ') || 'không'}`)
}
main()

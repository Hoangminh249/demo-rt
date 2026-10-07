// Dữ liệu mẫu cho bản demo. Chỉ src/lib/repo được import file này.
// Nội dung (mô tả, tiện ích, nhà hàng, hỏi đáp, ảnh) là MẪU — Marketing thay bằng nội dung thật.
import type { Hotel, RatePlan, RoomType } from '@/lib/types'

const gallery = (slug: string) => [`/images/${slug}/cover.jpg`, ...Array.from({ length: 8 }, (_, i) => `/images/${slug}/gallery-${i + 1}.jpg`)]

const POLICIES = (pets = 'Không nhận thú cưng.'): Hotel['policies'] => [
  ['Nhận phòng', 'Từ 14:00'],
  ['Trả phòng', 'Trước 12:00'],
  ['Huỷ phòng', 'Gói có ghi "Huỷ miễn phí": huỷ miễn phí trước 3 ngày so với ngày nhận phòng. Gói không hoàn huỷ: không hoàn tiền.'],
  ['Trẻ em', 'Dưới 6 tuổi ở miễn phí khi dùng giường có sẵn. 6–11 tuổi phụ thu ăn sáng đ 150,000/đêm.'],
  ['Thú cưng', pets],
]
const RT = 'https://rootytrip.com'

export const HOTELS: Hotel[] = [
  {
    id: 'H01', tenant_id: 'gh-tenant-pito', slug: 'pito-hon-thom', name: 'PITO Hòn Thơm', stars: 5, area: 'Nam đảo · Hòn Thơm',
    address: 'Đảo Hòn Thơm, An Thới, Phú Quốc', phone: '0886 068 886',
    tagline: 'Nghỉ dưỡng trên đảo Hòn Thơm, mở cửa là biển',
    description: 'PITO Hòn Thơm nằm trên bãi cát trắng phía Nam đảo, cách cáp treo Hòn Thơm 5 phút. 52 phòng hướng biển hoặc hướng vườn, hồ bơi vô cực, Kids Club và nhà hàng hải sản ngay mép nước.',
    highlights: ['Bãi biển riêng, hồ bơi vô cực', '5 phút tới cáp treo Hòn Thơm', 'Kids Club cho gia đình có bé', 'Nhà hàng hải sản ngay mép nước'],
    facts: [
      { icon: 'map-pin', label: 'Địa chỉ', value: 'Đảo Hòn Thơm, An Thới, Phú Quốc' },
      { icon: 'clock', label: 'Nhận / trả phòng', value: '14:00 / 12:00' },
      { icon: 'cable-car', label: 'Di chuyển', value: '5 phút tới cáp treo Hòn Thơm' },
      { icon: 'door-open', label: 'Quy mô', value: '52 phòng, 4 hạng phòng' },
    ],
    amenities: [
      { icon: 'waves', label: 'Hồ bơi vô cực' }, { icon: 'umbrella', label: 'Bãi biển riêng' }, { icon: 'baby', label: 'Kids Club' },
      { icon: 'flower', label: 'Spa' }, { icon: 'dumbbell', label: 'Phòng gym' }, { icon: 'utensils', label: 'Nhà hàng hải sản' },
      { icon: 'martini', label: 'Quầy bar hoàng hôn' }, { icon: 'wifi', label: 'Wi-Fi miễn phí' }, { icon: 'car', label: 'Đưa đón sân bay' },
    ],
    restaurants: [
      { name: 'Sóng Bạc', meta: 'Hải sản Phú Quốc · 11:00–22:00', desc: 'Hải sản tươi chọn tại bể, chế biến kiểu nhà chài.', image: '/images/addons/dinner.jpg' },
      { name: 'Morning Tide', meta: 'Buffet sáng Á – Âu · 06:30–10:30', desc: 'Buffet sáng với góc bánh canh chả cá và bún quậy.', image: '/images/pito-hon-thom/gallery-8.jpg' },
      { name: 'Sunset Deck', meta: 'Bar & đồ nhẹ · 16:00–23:00', desc: 'Quầy bar ngắm hoàng hôn trên bãi biển.', image: '/images/experiences/am-thuc.jpg' },
    ],
    experiences: [
      { name: 'Cáp treo Hòn Thơm', desc: '5 phút từ khách sạn', image: '/images/addons/tour-4-dao.jpg', href: `${RT}/san-pham/tour-cano-dao-cap-treo-va-buffet-hon-thom/` },
      { name: 'Lặn ngắm san hô bằng cano RIVUS', desc: 'Ra quần đảo An Thới', image: '/images/experiences/hoat-dong.jpg', href: 'https://rivusyacht.com' },
      { name: 'Câu mực đêm', desc: 'Tour Rooty Trip, đón tại sảnh', image: '/images/addons/rivus-cano.jpg', href: `${RT}/tour-phu-quoc-trong-ngay/` },
    ],
    distances: [['Ga cáp treo Hòn Thơm', '5 phút'], ['Sân bay Phú Quốc', '50 phút'], ['Sunset Town', '20 phút'], ['Chợ đêm Phú Quốc', '60 phút']],
    policies: POLICIES(),
    faq: [
      ['Khách sạn có đón sân bay không?', 'Có. Đặt trực tiếp từ 2 đêm được tặng xe đón một chiều của Rooty Trip; các trường hợp khác phụ thu theo xe.'],
      ['Đi từ sân bay tới khách sạn mất bao lâu?', 'Khoảng 35 phút đi xe tới ga cáp treo An Thới, rồi 15 phút cáp treo hoặc 20 phút cano.'],
      ['Có phòng cho gia đình 4 người không?', 'Có: Family Ocean View (2 người lớn + 2 trẻ em) và Family Suite (tối đa 4 người lớn + 2 trẻ em).'],
      ['Thanh toán thế nào?', 'Thẻ quốc tế, ATM/QR hoặc chuyển khoản khi đặt trên web; có gói trả tại khách sạn.'],
    ],
    map_url: 'https://www.google.com/maps/search/?api=1&query=9.955,104.015',
    cover: '/images/pito-hon-thom/cover.jpg', gallery: gallery('pito-hon-thom'),
  },
  {
    id: 'H02', tenant_id: 'gh-tenant-calista', slug: 'calista', name: 'Calista Phú Quốc', stars: 4, area: 'Trung tâm · Dương Đông',
    address: '68 Trần Hưng Đạo, Dương Đông, Phú Quốc', phone: '0886 068 886',
    tagline: 'Giữa trung tâm Dương Đông, đi bộ ra chợ đêm',
    description: 'Calista ở ngay trục Trần Hưng Đạo: 10 phút tới sân bay, đi bộ ra chợ đêm Phú Quốc. Hồ bơi tầng thượng, Kids Club trong nhà, Family Suite cho gia đình 4 người. Hợp với khách muốn ăn chơi trong thị trấn và đi tour mỗi ngày.',
    highlights: ['10 phút tới sân bay Phú Quốc', 'Đi bộ 7 phút ra chợ đêm', 'Hồ bơi và bar tầng thượng', 'Rooty Trip đón đi tour tại sảnh'],
    facts: [
      { icon: 'map-pin', label: 'Địa chỉ', value: '68 Trần Hưng Đạo, Dương Đông, Phú Quốc' },
      { icon: 'clock', label: 'Nhận / trả phòng', value: '14:00 / 12:00' },
      { icon: 'plane', label: 'Di chuyển', value: '10 phút tới sân bay Phú Quốc' },
      { icon: 'door-open', label: 'Quy mô', value: '28 phòng, 3 hạng phòng' },
    ],
    amenities: [
      { icon: 'waves', label: 'Hồ bơi tầng thượng' }, { icon: 'baby', label: 'Kids Club' }, { icon: 'utensils', label: 'Nhà hàng' },
      { icon: 'martini', label: 'Rooftop bar' }, { icon: 'dumbbell', label: 'Phòng gym' }, { icon: 'wifi', label: 'Wi-Fi miễn phí' },
      { icon: 'parking', label: 'Bãi đỗ xe' }, { icon: 'car', label: 'Đưa đón sân bay' }, { icon: 'store', label: 'Gần chợ đêm' },
    ],
    restaurants: [
      { name: 'Cali Kitchen', meta: 'Á – Âu · 06:30–22:00', desc: 'Buffet sáng, gọi món trưa và tối.', image: '/images/calista/gallery-3.jpg' },
      { name: 'Sky 68', meta: 'Rooftop bar · 17:00–24:00', desc: 'Ngắm toàn cảnh Dương Đông từ tầng thượng.', image: '/images/calista/gallery-5.jpg' },
    ],
    experiences: [
      { name: 'Chợ đêm Phú Quốc', desc: 'Đi bộ 7 phút từ khách sạn', image: '/images/calista/gallery-6.jpg', href: `${RT}/cung-doc/` },
      { name: 'Tour cano 4 đảo', desc: 'Rooty Trip đón tại sảnh 7:30', image: '/images/addons/tour-4-dao.jpg', href: `${RT}/san-pham/tour-cano-dao-cap-treo-va-buffet-hon-thom/` },
      { name: 'Du thuyền ngắm hoàng hôn RIVUS', desc: 'Khởi hành từ cảng Dương Đông', image: '/images/experiences/rivus.jpg', href: 'https://rivusyacht.com' },
    ],
    distances: [['Sân bay Phú Quốc', '10 phút'], ['Chợ đêm Phú Quốc', '7 phút đi bộ'], ['Bãi Trường', '10 phút'], ['Ga cáp treo Hòn Thơm', '40 phút']],
    policies: POLICIES(),
    faq: [
      ['Khách sạn có đón sân bay không?', 'Có. Đặt trực tiếp từ 2 đêm được tặng xe đón một chiều của Rooty Trip.'],
      ['Từ khách sạn ra biển bao xa?', 'Khoảng 10 phút đi xe tới Bãi Trường; khách sạn có xe đưa đón theo giờ.'],
      ['Có phòng cho gia đình 4 người không?', 'Có: Family Suite có giường tầng cho 2 bé, sát Kids Club.'],
      ['Thanh toán thế nào?', 'Thẻ quốc tế, ATM/QR hoặc chuyển khoản khi đặt trên web; có gói trả tại khách sạn.'],
    ],
    map_url: 'https://www.google.com/maps/search/?api=1&query=10.205,103.965',
    cover: '/images/calista/cover.jpg', gallery: gallery('calista'),
  },
]

const BASE = ['Điều hoà', 'Minibar', 'Két sắt', 'Wi-Fi']
type Seed = Omit<RoomType, 'hotel_id' | 'room_type_id' | 'image'> & { code: string; noPhoto?: boolean }
const rooms = (hotel: Hotel, list: Seed[]): RoomType[] =>
  list.map(({ code, noPhoto, ...x }) => ({ ...x, room_type_id: `RT-${code}`, hotel_id: hotel.id, image: noPhoto ? '' : `/images/${hotel.slug}/rooms/${x.slug}.jpg` }))

const [PITO, CALISTA] = HOTELS

export const ROOM_TYPES: RoomType[] = [
  ...rooms(PITO, [
    { code: 'PITO-DOV', slug: 'deluxe-ocean-view', name: 'Deluxe Ocean View', quantity: 30, max_adults: 2, max_children: 1, size_m2: 34, beds: '1 giường King hoặc 2 giường đơn', view: 'Hướng biển', base_price: 2_850_000, amenities: ['Ban công', 'Bồn tắm', ...BASE], description: 'Ban công nhìn thẳng ra biển Hòn Thơm, bồn tắm đặt cạnh cửa kính.' },
    { code: 'PITO-FOV', slug: 'family-ocean-view', name: 'Family Ocean View', quantity: 8, max_adults: 2, max_children: 2, size_m2: 45, beds: '1 giường King + 1 sofa giường', view: 'Hướng biển', base_price: 2_966_000, amenities: ['Ban công', 'Góc chơi trẻ em', ...BASE], description: 'Rộng 45m², có sofa giường cho 2 bé, gần Kids Club.' },
    { code: 'PITO-FS', slug: 'family-suite', name: 'Family Suite', quantity: 4, max_adults: 4, max_children: 2, size_m2: 72, beds: '2 phòng ngủ: 1 King + 2 đơn', view: 'Hướng biển', base_price: 4_200_000, amenities: ['Phòng khách riêng', '2 phòng tắm', ...BASE], description: 'Hai phòng ngủ, phòng khách riêng, cho gia đình nhiều thế hệ.' },
    // Cố ý chưa có ảnh: ca "Chưa có ảnh" (S8)
    { code: 'PITO-SG', slug: 'superior-garden', name: 'Superior Garden', quantity: 10, max_adults: 2, max_children: 1, size_m2: 30, beds: '1 giường Queen', view: 'Hướng vườn', base_price: 1_950_000, amenities: BASE, description: 'Yên tĩnh, nhìn ra vườn nhiệt đới.', noPhoto: true },
  ]),
  ...rooms(CALISTA, [
    { code: 'CAL-SUP', slug: 'superior-city-view', name: 'Superior City View', quantity: 12, max_adults: 2, max_children: 1, size_m2: 28, beds: '1 giường Queen', view: 'Hướng phố', base_price: 1_600_000, amenities: BASE, description: 'Gọn gàng, nhìn ra trung tâm Dương Đông.' },
    { code: 'CAL-DPV', slug: 'deluxe-pool-view', name: 'Deluxe Pool View', quantity: 10, max_adults: 2, max_children: 1, size_m2: 32, beds: '1 giường King', view: 'Hướng hồ bơi', base_price: 2_200_000, amenities: ['Ban công', ...BASE], description: 'Ban công nhìn xuống hồ bơi.' },
    { code: 'CAL-FS', slug: 'family-suite', name: 'Family Suite', quantity: 6, max_adults: 2, max_children: 2, size_m2: 55, beds: '1 King + 2 giường tầng', view: 'Hướng hồ bơi', base_price: 3_200_000, amenities: ['Giường tầng cho bé', 'Bồn tắm', ...BASE], description: 'Giường tầng cho bé, sát Kids Club.' },
  ]),
]

export const RATE_PLANS: RatePlan[] = ROOM_TYPES.flatMap(rt => [
  { rate_plan_id: `${rt.room_type_id}-BB`, room_type_id: rt.room_type_id, name: 'Bao gồm ăn sáng', has_breakfast: true, free_cancel_days: 3, factor: 1 },
  { rate_plan_id: `${rt.room_type_id}-RO`, room_type_id: rt.room_type_id, name: 'Không ăn sáng', has_breakfast: false, free_cancel_days: null, factor: 0.9 },
])

/** Số phòng đã bán mỗi đêm — giả lập phần Gohost trả về qua quantity. Khoá: room_type_id.
 *  full_month: tháng bán hết (ca "Hết phòng" của một hạng). */
export const DEMO_SOLD: Record<string, { base: number; weekend: number; full_month?: string }> = {
  'RT-PITO-DOV': { base: 26, weekend: 27 }, // còn 3–4 phòng → "Chỉ còn 3 phòng"
  'RT-PITO-FOV': { base: 2, weekend: 4 },
  'RT-PITO-FS': { base: 1, weekend: 2, full_month: '2026-10' },
  'RT-PITO-SG': { base: 4, weekend: 6 },
  'RT-CAL-SUP': { base: 5, weekend: 9 },
  'RT-CAL-DPV': { base: 7, weekend: 8 },
  'RT-CAL-FS': { base: 2, weekend: 4 },
}

/** Đêm cả hai khách sạn kín phòng (giao thừa) — xem ca "Hết phòng" của cả trang: chọn 30/12 – 02/01. */
export const FULL_NIGHTS = ['2026-12-30', '2026-12-31']

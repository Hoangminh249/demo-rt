// Dữ liệu giả lập. Chỉ src/lib/repo được import file này.
import type { Hotel, RatePlan, RoomType } from '@/lib/types'

const gallery = (slug: string) => Array.from({ length: 8 }, (_, i) => `/images/${slug}/gallery-${i + 1}.svg`)

const STD_POLICIES = {
  checkin: 'Nhận phòng từ 14:00',
  checkout: 'Trả phòng trước 12:00',
  cancel: 'Gói "Huỷ miễn phí": huỷ miễn phí trước 3 ngày so với ngày nhận phòng. Gói "Room Only": không hoàn huỷ.',
  children: 'Trẻ dưới 6 tuổi ở miễn phí khi dùng giường có sẵn. Trẻ 6–11 tuổi phụ thu ăn sáng 150.000đ/đêm.',
  pets: 'Không nhận thú cưng.',
}

export const HOTELS: Hotel[] = [
  {
    id: 'H01', tenant_id: 'gh-tenant-pito', slug: 'pito-hon-thom', name: 'PITO Hòn Thơm', area: 'nam-dao', stars: 5,
    address: 'Đảo Hòn Thơm, An Thới, Phú Quốc, Kiên Giang', phone: '0297 3 888 001', email: 'stay@pito.rootyhospitality.com',
    lat: 9.955, lng: 104.015, hue: 172,
    tagline: 'Nghỉ dưỡng trên đảo Hòn Thơm, mở cửa là biển',
    description: 'PITO Hòn Thơm nằm trên bãi cát trắng phía Nam đảo, cách cáp treo Hòn Thơm 5 phút. 52 phòng hướng biển hoặc hướng vườn, hồ bơi vô cực, Kids Club và nhà hàng hải sản ngay mép nước. Khách đặt trực tiếp được xe đón sân bay của Rooty Trip.',
    amenities: ['Hồ bơi vô cực', 'Bãi biển riêng', 'Kids Club', 'Spa', 'Phòng gym', 'Nhà hàng hải sản', 'Quầy bar hoàng hôn', 'Wi-Fi miễn phí', 'Đưa đón sân bay'],
    tags: ['gan-bien', 'ho-boi', 'kids-club', 'spa', 'an-sang', 'huy-mien-phi'],
    restaurants: [
      { name: 'Sóng Bạc', cuisine: 'Hải sản Phú Quốc', hours: '11:00–22:00', desc: 'Hải sản tươi chọn tại bể, chế biến kiểu nhà chài.' },
      { name: 'Morning Tide', cuisine: 'Buffet sáng Á – Âu', hours: '06:30–10:30', desc: 'Buffet sáng với góc bánh canh chả cá và bún quậy.' },
      { name: 'Sunset Deck', cuisine: 'Bar & đồ nhẹ', hours: '16:00–23:00', desc: 'Quầy bar ngắm hoàng hôn trên bãi biển.' },
    ],
    experiences: [
      { name: 'Cáp treo Hòn Thơm', desc: 'Cáp treo vượt biển dài nhất thế giới, cách khách sạn 5 phút.' },
      { name: 'Lặn ngắm san hô', desc: 'Đi cano RIVUS ra quần đảo An Thới.' },
      { name: 'Câu mực đêm', desc: 'Tour Rooty Trip, đón tại sảnh.' },
    ],
    policies: { ...STD_POLICIES, pets: 'Không nhận thú cưng.' },
    gallery: gallery('pito-hon-thom'), cover: '/images/pito-hon-thom/cover.svg',
  },
  {
    id: 'H02', tenant_id: 'gh-tenant-calista', slug: 'calista', name: 'Calista Phú Quốc', area: 'trung-tam', stars: 4,
    address: '68 Trần Hưng Đạo, Dương Đông, Phú Quốc, Kiên Giang', phone: '0297 3 888 002', email: 'stay@calista.rootyhospitality.com',
    lat: 10.205, lng: 103.965, hue: 190,
    tagline: 'Giữa trung tâm Dương Đông, đi bộ ra chợ đêm',
    description: 'Calista ở ngay trục Trần Hưng Đạo: 10 phút tới sân bay, đi bộ ra chợ đêm Phú Quốc. Hồ bơi tầng thượng, Kids Club trong nhà, phòng Family Suite cho gia đình 4 người. Hợp với khách muốn ăn chơi trong thị trấn và đi tour mỗi ngày.',
    amenities: ['Hồ bơi tầng thượng', 'Kids Club', 'Nhà hàng', 'Rooftop bar', 'Phòng gym', 'Wi-Fi miễn phí', 'Bãi đỗ xe'],
    tags: ['ho-boi', 'kids-club', 'an-sang', 'huy-mien-phi'],
    restaurants: [
      { name: 'Cali Kitchen', cuisine: 'Á – Âu', hours: '06:30–22:00', desc: 'Buffet sáng, gọi món trưa tối.' },
      { name: 'Sky 68', cuisine: 'Rooftop bar', hours: '17:00–24:00', desc: 'View toàn cảnh Dương Đông.' },
    ],
    experiences: [
      { name: 'Chợ đêm Phú Quốc', desc: 'Đi bộ 7 phút.' },
      { name: 'Tour 4 đảo', desc: 'Rooty Trip đón tại sảnh 7:30.' },
    ],
    policies: STD_POLICIES,
    gallery: gallery('calista'), cover: '/images/calista/cover.svg',
  },
  {
    id: 'H03', tenant_id: 'gh-tenant-saobien', slug: 'sao-bien-bai-dai', name: 'Sao Biển Bãi Dài Resort', area: 'bac-dao', stars: 5,
    address: 'Bãi Dài, Gành Dầu, Phú Quốc, Kiên Giang', phone: '0297 3 888 003', email: 'stay@saobien.rootyhospitality.com',
    lat: 10.335, lng: 103.885, hue: 205,
    tagline: 'Villa trên bãi biển hoang sơ nhất Bắc đảo',
    description: 'Khu villa thấp tầng trên Bãi Dài, gần VinWonders và Safari. Mỗi villa có sân vườn riêng; hạng Beachfront có hồ bơi riêng hướng biển. Phù hợp gia đình và nhóm bạn muốn yên tĩnh.',
    amenities: ['Bãi biển riêng', 'Hồ bơi chung', 'Villa hồ bơi riêng', 'Spa', 'Nhà hàng', 'Xe điện nội khu', 'Wi-Fi miễn phí'],
    tags: ['gan-bien', 'ho-boi', 'spa', 'an-sang', 'huy-mien-phi'],
    restaurants: [
      { name: 'Ngàn Sao', cuisine: 'Việt & hải sản', hours: '06:30–22:00', desc: 'Nhà hàng mở trên bãi cát.' },
    ],
    experiences: [
      { name: 'VinWonders & Safari', desc: 'Cách 10 phút, có xe trung chuyển.' },
      { name: 'Hoàng hôn Gành Dầu', desc: 'Du thuyền RIVUS khởi hành 16:30.' },
    ],
    policies: { ...STD_POLICIES, pets: 'Nhận thú cưng dưới 10kg ở hạng Garden Villa, phụ thu 500.000đ/đêm.' },
    gallery: gallery('sao-bien-bai-dai'), cover: '/images/sao-bien-bai-dai/cover.svg',
  },
  {
    id: 'H04', tenant_id: 'gh-tenant-ngoclan', slug: 'ngoc-lan-boutique', name: 'Ngọc Lan Boutique Hotel', area: 'trung-tam', stars: 3,
    address: '15 Nguyễn Trãi, Dương Đông, Phú Quốc, Kiên Giang', phone: '0297 3 888 004', email: 'stay@ngoclan.rootyhospitality.com',
    lat: 10.215, lng: 103.958, hue: 150,
    tagline: 'Khách sạn nhỏ, giá vừa, sát bến tàu Dương Đông',
    description: 'Boutique 22 phòng phong cách Đông Dương, giá hợp lý cho khách đi tour nhiều ngày. Có ăn sáng kiểu Việt, quầy tour Rooty Trip ngay sảnh.',
    amenities: ['Nhà hàng sáng', 'Quầy tour', 'Cho thuê xe máy', 'Wi-Fi miễn phí'],
    tags: ['an-sang', 'huy-mien-phi'],
    restaurants: [{ name: 'Lan Café', cuisine: 'Ăn sáng Việt', hours: '06:00–10:00', desc: 'Bún kèn, bánh mì, cà phê phin.' }],
    experiences: [{ name: 'Dinh Cậu', desc: 'Đi bộ 10 phút.' }],
    policies: STD_POLICIES,
    gallery: gallery('ngoc-lan-boutique'), cover: '/images/ngoc-lan-boutique/cover.svg',
  },
  {
    id: 'H05', tenant_id: 'gh-tenant-rangdong', slug: 'rang-dong-bay', name: 'Rạng Đông Bay Resort', area: 'nam-dao', stars: 4,
    address: 'Bãi Khem, An Thới, Phú Quốc, Kiên Giang', phone: '0297 3 888 005', email: 'stay@rangdong.rootyhospitality.com',
    lat: 10.03, lng: 104.03, hue: 25,
    tagline: 'Bungalow mái lá trên Bãi Khem cát trắng',
    description: 'Resort bungalow trên Bãi Khem, gần Sunset Town và cầu Hôn. Hồ bơi hướng biển, spa thảo mộc, bến cano RIVUS cách 2km.',
    amenities: ['Bãi biển', 'Hồ bơi hướng biển', 'Spa thảo mộc', 'Nhà hàng', 'Bar', 'Wi-Fi miễn phí'],
    tags: ['gan-bien', 'ho-boi', 'spa', 'an-sang', 'huy-mien-phi'],
    restaurants: [{ name: 'Khem Grill', cuisine: 'Nướng & hải sản', hours: '11:00–22:00', desc: 'BBQ tối thứ 6, thứ 7.' }],
    experiences: [{ name: 'Sunset Town', desc: '5 phút đi xe.' }, { name: 'Lặn biển Hòn Móng Tay', desc: 'Cano RIVUS.' }],
    policies: STD_POLICIES,
    gallery: gallery('rang-dong-bay'), cover: '/images/rang-dong-bay/cover.svg',
  },
]

type RoomSeed = Omit<RoomType, 'hotel_id' | 'image' | 'room_type_id'> & { code: string }
const r = (hotel: Hotel, rooms: RoomSeed[]): RoomType[] =>
  rooms.map(({ code, ...x }) => ({
    ...x, room_type_id: `RT-${code}`, hotel_id: hotel.id, image: `/images/${hotel.slug}/rooms/${x.slug}.svg`,
  }))

const [PITO, CALISTA, SAOBIEN, NGOCLAN, RANGDONG] = HOTELS
const BASE_AMEN = ['Điều hoà', 'Minibar', 'Két sắt', 'Máy sấy tóc', 'Wi-Fi', 'TV 55"']

export const ROOM_TYPES: RoomType[] = [
  ...r(PITO, [
    { code: 'PITO-DOV', slug: 'deluxe-ocean-view', name: 'Deluxe Ocean View', quantity: 30, max_adults: 2, max_children: 1, size_m2: 34, beds: '1 giường King hoặc 2 giường đơn', view: 'Hướng biển', ocean_view: true, family: false, base_price: 2_850_000, public_rate: 3_000_000, amenities: [...BASE_AMEN, 'Ban công', 'Bồn tắm'], description: 'Ban công nhìn thẳng ra biển Hòn Thơm, bồn tắm đặt cạnh cửa kính.' },
    { code: 'PITO-FOV', slug: 'family-ocean-view', name: 'Family Ocean View', quantity: 8, max_adults: 2, max_children: 2, size_m2: 45, beds: '1 giường King + 1 sofa giường', view: 'Hướng biển', ocean_view: true, family: true, base_price: 2_966_000, public_rate: 3_300_000, amenities: [...BASE_AMEN, 'Ban công', 'Góc chơi trẻ em'], description: 'Rộng 45m², có sofa giường cho 2 bé, gần Kids Club.' },
    { code: 'PITO-FS', slug: 'family-suite', name: 'Family Suite', quantity: 4, max_adults: 4, max_children: 2, size_m2: 72, beds: '2 phòng ngủ: 1 King + 2 đơn', view: 'Hướng biển', ocean_view: true, family: true, base_price: 4_200_000, public_rate: 4_600_000, amenities: [...BASE_AMEN, 'Phòng khách riêng', '2 phòng tắm'], description: 'Hai phòng ngủ, phòng khách riêng, cho gia đình nhiều thế hệ.' },
    { code: 'PITO-SG', slug: 'superior-garden', name: 'Superior Garden', quantity: 10, max_adults: 2, max_children: 1, size_m2: 30, beds: '1 giường Queen', view: 'Hướng vườn', ocean_view: false, family: false, base_price: 1_950_000, public_rate: 2_100_000, amenities: BASE_AMEN, description: 'Yên tĩnh, nhìn ra vườn nhiệt đới.' },
  ]),
  ...r(CALISTA, [
    { code: 'CAL-SUP', slug: 'superior-city-view', name: 'Superior City View', quantity: 12, max_adults: 2, max_children: 1, size_m2: 28, beds: '1 giường Queen', view: 'Hướng phố', ocean_view: false, family: false, base_price: 1_600_000, public_rate: 1_750_000, amenities: BASE_AMEN, description: 'Gọn gàng, nhìn ra trung tâm Dương Đông.' },
    { code: 'CAL-DPV', slug: 'deluxe-pool-view', name: 'Deluxe Pool View', quantity: 10, max_adults: 2, max_children: 1, size_m2: 32, beds: '1 giường King', view: 'Hướng hồ bơi', ocean_view: false, family: false, base_price: 2_200_000, public_rate: 2_400_000, amenities: [...BASE_AMEN, 'Ban công'], description: 'Ban công nhìn xuống hồ bơi.' },
    { code: 'CAL-FS', slug: 'family-suite', name: 'Family Suite', quantity: 6, max_adults: 2, max_children: 2, size_m2: 55, beds: '1 King + 2 giường tầng', view: 'Hướng hồ bơi', ocean_view: false, family: true, base_price: 3_200_000, public_rate: 3_500_000, amenities: [...BASE_AMEN, 'Giường tầng cho bé', 'Bồn tắm'], description: 'Giường tầng cho bé, sát Kids Club.' },
  ]),
  ...r(SAOBIEN, [
    { code: 'SB-DO', slug: 'deluxe-ocean', name: 'Deluxe Ocean', quantity: 10, max_adults: 2, max_children: 1, size_m2: 38, beds: '1 giường King', view: 'Hướng biển', ocean_view: true, family: false, base_price: 2_600_000, public_rate: 2_800_000, amenities: [...BASE_AMEN, 'Ban công'], description: 'Phòng tầng 2 nhìn ra Bãi Dài.' },
    { code: 'SB-GV', slug: 'garden-villa', name: 'Garden Villa', quantity: 8, max_adults: 2, max_children: 2, size_m2: 80, beds: '1 King + 1 sofa giường', view: 'Sân vườn riêng', ocean_view: false, family: true, base_price: 3_500_000, public_rate: 3_900_000, amenities: [...BASE_AMEN, 'Sân vườn riêng', 'Bồn tắm ngoài trời'], description: 'Villa một tầng có sân vườn riêng.' },
    { code: 'SB-BPV', slug: 'beachfront-pool-villa', name: 'Beachfront Pool Villa', quantity: 6, max_adults: 4, max_children: 2, size_m2: 120, beds: '2 phòng ngủ', view: 'Hướng biển', ocean_view: true, family: true, base_price: 5_200_000, public_rate: 5_800_000, amenities: [...BASE_AMEN, 'Hồ bơi riêng', 'Bếp nhỏ'], description: 'Hồ bơi riêng sát bãi cát.' },
  ]),
  ...r(NGOCLAN, [
    { code: 'NL-STD', slug: 'standard-city', name: 'Standard City', quantity: 10, max_adults: 2, max_children: 1, size_m2: 22, beds: '1 giường Queen', view: 'Hướng phố', ocean_view: false, family: false, base_price: 1_300_000, public_rate: 1_400_000, amenities: BASE_AMEN.slice(0, 5), description: 'Phòng nhỏ gọn, đủ tiện nghi.' },
    { code: 'NL-DB', slug: 'deluxe-balcony', name: 'Deluxe Balcony', quantity: 8, max_adults: 2, max_children: 1, size_m2: 26, beds: '1 giường King', view: 'Hướng phố', ocean_view: false, family: false, base_price: 1_700_000, public_rate: 1_850_000, amenities: [...BASE_AMEN.slice(0, 5), 'Ban công'], description: 'Có ban công nhỏ.' },
    { code: 'NL-FAM', slug: 'family-room', name: 'Family Room', quantity: 4, max_adults: 2, max_children: 2, size_m2: 36, beds: '2 giường Queen', view: 'Hướng phố', ocean_view: false, family: true, base_price: 2_400_000, public_rate: 2_600_000, amenities: BASE_AMEN.slice(0, 5), description: 'Hai giường Queen cho gia đình 4 người.' },
  ]),
  ...r(RANGDONG, [
    { code: 'RD-DG', slug: 'deluxe-garden', name: 'Deluxe Garden', quantity: 10, max_adults: 2, max_children: 1, size_m2: 32, beds: '1 giường King', view: 'Hướng vườn', ocean_view: false, family: false, base_price: 1_900_000, public_rate: 2_050_000, amenities: BASE_AMEN, description: 'Bungalow trong vườn dừa.' },
    { code: 'RD-OB', slug: 'ocean-bungalow', name: 'Ocean Bungalow', quantity: 8, max_adults: 2, max_children: 1, size_m2: 40, beds: '1 giường King', view: 'Hướng biển', ocean_view: true, family: false, base_price: 2_900_000, public_rate: 3_150_000, amenities: [...BASE_AMEN, 'Hiên gỗ'], description: 'Hiên gỗ nhìn ra Bãi Khem.' },
    { code: 'RD-FB', slug: 'family-bungalow', name: 'Family Bungalow', quantity: 6, max_adults: 2, max_children: 2, size_m2: 55, beds: '1 King + 2 đơn', view: 'Hướng vườn', ocean_view: false, family: true, base_price: 3_400_000, public_rate: 3_700_000, amenities: [...BASE_AMEN, 'Hiên gỗ'], description: 'Hai không gian ngủ, hiên rộng.' },
  ]),
]

export const RATE_PLANS: RatePlan[] = ROOM_TYPES.flatMap(rt => [
  { rate_plan_id: `${rt.room_type_id}-RO`, room_type_id: rt.room_type_id, name: 'Room Only · Không hoàn huỷ', has_breakfast: false, free_cancel_days: null, factor: 0.9 },
  { rate_plan_id: `${rt.room_type_id}-BB`, room_type_id: rt.room_type_id, name: 'Bao gồm ăn sáng · Huỷ miễn phí', has_breakfast: true, free_cancel_days: 3, factor: 1 },
])

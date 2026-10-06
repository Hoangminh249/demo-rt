// Dữ liệu giả lập: ưu đãi, add-on hệ sinh thái, đại lý, khách hàng, người dùng admin.
import type { Addon, AdminUser, Agent, Customer, Promotion, Tier } from '@/lib/types'
import { makeRng, nationalityOf, personName, phoneOf, slugEmail } from '@/lib/rng'

export const PROMOTIONS: Promotion[] = [
  {
    id: 'P01', slug: 'early-bird', type: 'early-bird', name: 'Early Bird – Đặt sớm giảm 15%',
    summary: 'Đặt trước từ 30 ngày, giảm 15% giá phòng.',
    description: 'Lên kế hoạch sớm, giá tốt hơn. Áp dụng cho mọi hạng phòng khi đặt trước ngày nhận phòng ít nhất 30 ngày.',
    perks: ['Giảm 15% giá phòng', 'Áp dụng cả gói ăn sáng'], discount_pct: 15, min_advance_days: 30,
    valid_from: '2026-07-01', valid_to: '2027-03-31', hotel_ids: 'all', active: true, image: '/images/offers/early-bird.jpg',
  },
  {
    id: 'P02', slug: 'stay-longer', type: 'stay-longer', name: 'Stay Longer – Ở 4 đêm giảm 10%',
    summary: 'Ở từ 4 đêm trở lên, giảm 10%.',
    description: 'Ở lâu hơn để khám phá trọn Phú Quốc: từ 4 đêm giảm 10% giá phòng.',
    perks: ['Giảm 10% giá phòng', 'Trả phòng muộn tới 14:00 (tuỳ tình trạng)'], discount_pct: 10, min_nights: 4,
    valid_from: '2026-07-01', valid_to: '2027-03-31', hotel_ids: 'all', active: true, image: '/images/offers/stay-longer.jpg',
  },
  {
    id: 'P03', slug: 'family', type: 'family', name: 'Family – Gia đình có trẻ em giảm 8%',
    summary: 'Đi cùng trẻ em: giảm 8%, bé dưới 12 tuổi ăn sáng miễn phí.',
    description: 'Dành cho gia đình có ít nhất 1 trẻ em. Áp dụng tại các khách sạn có Kids Club.',
    perks: ['Giảm 8% giá phòng', 'Bé dưới 12 tuổi ăn sáng miễn phí', 'Quà chào mừng cho bé'], discount_pct: 8, min_children: 1,
    valid_from: '2026-07-01', valid_to: '2026-12-31', hotel_ids: ['H01', 'H02', 'H03', 'H05'], active: true, image: '/images/offers/family.jpg',
  },
  {
    id: 'P04', slug: 'honeymoon', type: 'honeymoon', name: 'Honeymoon – Trăng mật',
    summary: 'Giảm 10%, trang trí phòng, rượu vang và bữa tối lãng mạn.',
    description: 'Chọn ưu đãi khi đặt phòng cho cặp đôi mới cưới (trong vòng 6 tháng).',
    perks: ['Giảm 10% giá phòng', 'Trang trí phòng & bánh', 'Rượu vang chào mừng'], discount_pct: 10, needs_code: true,
    valid_from: '2026-07-01', valid_to: '2027-06-30', hotel_ids: ['H01', 'H03', 'H05'], active: true, image: '/images/offers/honeymoon.jpg',
  },
  {
    id: 'P05', slug: 'package', type: 'package', name: 'Package – Phòng + Xe + Tour giảm 12%',
    summary: 'Đặt phòng kèm xe sân bay và tour Rooty Trip: giảm 12% giá phòng.',
    description: 'Trọn gói Đến – Ở – Trải nghiệm trong một lần đặt. Thêm xe đưa đón sân bay và ít nhất 1 tour Rooty Trip ở bước dịch vụ thêm để kích hoạt.',
    perks: ['Giảm 12% giá phòng', 'Xe sân bay ưu tiên', 'Một lần thanh toán'], discount_pct: 12, needs_addons: ['transfer', 'tour'],
    valid_from: '2026-07-01', valid_to: '2027-03-31', hotel_ids: 'all', active: true, image: '/images/offers/package.jpg',
  },
]

export const ADDONS: Addon[] = [
  { id: 'AD-TRF', name: 'Xe đưa đón sân bay', provider: 'Rooty Trip', category: 'transfer', unit: 'trip', price: 600_000, desc: 'Xe 7 chỗ đón tại sân bay Phú Quốc, có biển tên. Giá mỗi chiều.', duration: '20–45 phút', image: '/images/addons/transfer.jpg' },
  { id: 'AD-T4D', name: 'Tour 4 đảo cano – Rooty Trip', provider: 'Rooty Trip', category: 'tour', unit: 'person', price: 1_200_000, child_price: 800_000, desc: 'Hòn Mây Rút, Hòn Gầm Ghì, Hòn Móng Tay; lặn ngắm san hô, ăn trưa hải sản.', duration: '1 ngày', image: '/images/addons/tour-4-dao.jpg' },
  { id: 'AD-TBD', name: 'Tour Bắc đảo – Grand World & Safari', provider: 'Rooty Trip', category: 'tour', unit: 'person', price: 950_000, child_price: 650_000, desc: 'Vinpearl Safari, Grand World, Gành Dầu; xe đón tại khách sạn.', duration: '1 ngày', image: '/images/addons/tour-bac-dao.jpg' },
  { id: 'AD-TCM', name: 'Câu mực đêm – Rooty Trip', provider: 'Rooty Trip', category: 'tour', unit: 'person', price: 550_000, child_price: 350_000, desc: 'Ra khơi lúc hoàng hôn, câu mực và ăn tối trên thuyền.', duration: '4 giờ', image: '/images/addons/cau-muc.jpg' },
  { id: 'AD-RCN', name: 'RIVUS – Cano riêng nửa ngày', provider: 'RIVUS', category: 'rivus', unit: 'trip', price: 8_500_000, desc: 'Cano riêng tối đa 10 khách, tự chọn đảo, có hướng dẫn viên.', duration: '4 giờ', image: '/images/addons/rivus-cano.jpg' },
  { id: 'AD-RSS', name: 'RIVUS – Du thuyền hoàng hôn', provider: 'RIVUS', category: 'rivus', unit: 'person', price: 1_900_000, child_price: 1_100_000, desc: 'Du thuyền ngắm hoàng hôn, tiệc nhẹ và nhạc sống.', duration: '3 giờ', image: '/images/addons/rivus-sunset.jpg' },
  { id: 'AD-SPA', name: 'Spa thư giãn 90 phút', provider: 'Khách sạn', category: 'spa', unit: 'person', price: 1_200_000, desc: 'Massage tinh dầu tràm Phú Quốc.', duration: '90 phút', image: '/images/addons/spa.jpg' },
  { id: 'AD-DIN', name: 'Bữa tối hải sản bên biển', provider: 'Khách sạn', category: 'dining', unit: 'person', price: 1_500_000, child_price: 750_000, desc: 'Set menu 6 món hải sản, bàn riêng trên bãi biển.', duration: '2 giờ', image: '/images/addons/dinner.jpg' },
]

export const AGENTS: Agent[] = [
  { id: 'AG01', name: 'ABC Travel', tax_code: '0312345678', contact: 'Trần Minh Khoa', phone: '0903 111 222', email: 'booking@abctravel.vn', address: '12 Nguyễn Huệ, Q.1, TP.HCM', credit_limit: 2_000_000_000, discount: 0.17, commission_pct: 2, net_overrides: { 'RT-PITO-DOV': 2_500_000 }, status: 'active', joined: '2025-11-15', share: 34 },
  { id: 'AG02', name: 'Sao Việt Tourist', tax_code: '0109876543', contact: 'Lê Thu Hằng', phone: '0912 333 444', email: 'ops@saoviet.vn', address: '45 Bà Triệu, Hoàn Kiếm, Hà Nội', credit_limit: 1_500_000_000, discount: 0.15, commission_pct: 1.5, net_overrides: {}, status: 'active', joined: '2026-01-10', share: 22 },
  { id: 'AG03', name: 'Phú Quốc Discovery', tax_code: '1701234567', contact: 'Nguyễn Hải Đăng', phone: '0918 555 666', email: 'sales@pqdiscovery.vn', address: '3 Bạch Đằng, Dương Đông, Phú Quốc', credit_limit: 1_000_000_000, discount: 0.15, commission_pct: 1.5, net_overrides: {}, status: 'active', joined: '2026-02-20', share: 18 },
  { id: 'AG04', name: 'Đông Dương Travel', tax_code: '0401122334', contact: 'Phạm Quang Huy', phone: '0905 777 888', email: 'booking@dongduong.travel', address: '88 Bạch Đằng, Hải Châu, Đà Nẵng', credit_limit: 600_000_000, discount: 0.14, commission_pct: 1, net_overrides: {}, status: 'active', joined: '2026-03-05', share: 12 },
  { id: 'AG05', name: 'Saigon Holiday', tax_code: '0315566778', contact: 'Võ Ngọc Trâm', phone: '0938 999 000', email: 'hello@saigonholiday.vn', address: '210 Võ Văn Tần, Q.3, TP.HCM', credit_limit: 400_000_000, discount: 0.14, commission_pct: 1, net_overrides: {}, status: 'active', joined: '2026-04-18', share: 9 },
  { id: 'AG06', name: 'Korea Tour Link', tax_code: '0316677889', contact: 'Kim Ji-hoon', phone: '0909 123 789', email: 'vn@koreatourlink.com', address: '5 Phan Văn Trị, Gò Vấp, TP.HCM', credit_limit: 300_000_000, discount: 0.16, commission_pct: 1.5, net_overrides: {}, status: 'active', joined: '2026-05-02', share: 5 },
]

const TIERS: Tier[] = ['Member', 'Member', 'Silver', 'Silver', 'Gold', 'Platinum']
const PREFS = ['Ocean View', 'Tầng cao', 'Phòng yên tĩnh', 'Có ăn sáng', 'Giường King', 'Gần Kids Club', 'Hồ bơi', 'Spa']

function genCustomers(): Customer[] {
  const rng = makeRng(606)
  const list: Customer[] = [{
    id: 'C001', name: 'Nguyễn Văn A', phone: '0901234567', email: 'nguyenvana@gmail.com', nationality: 'Việt Nam',
    birthday: '1986-10-18', tier: 'Gold', points: 4_200, family: true,
    preferences: ['Ocean View', 'Family Room', 'Có ăn sáng', 'Đi cùng gia đình'],
    vouchers: [
      { code: 'BDAY-NVA-26', desc: 'Sinh nhật: giảm 500.000đ cho lần đặt tiếp theo', expires: '2026-11-30' },
      { code: 'RT-TOUR-10', desc: 'Giảm 10% tour Rooty Trip', expires: '2026-12-31' },
    ],
    note: 'Khách quen PITO. Hay đi 2 người lớn + 1–2 bé.', created_at: '2025-12-20',
  }]
  for (let i = 2; i <= 60; i++) {
    const name = personName(rng, 0.12)
    list.push({
      id: `C${String(i).padStart(3, '0')}`, name, phone: phoneOf(rng), email: slugEmail(name, i), nationality: nationalityOf(name),
      birthday: `19${rng.int(70, 99)}-${String(rng.int(1, 12)).padStart(2, '0')}-${String(rng.int(1, 28)).padStart(2, '0')}`,
      tier: rng.pick(TIERS), points: rng.int(2, 60) * 100, family: rng.next() < 0.45,
      preferences: [rng.pick(PREFS), rng.pick(PREFS)].filter((v, k, a) => a.indexOf(v) === k),
      vouchers: rng.next() < 0.3 ? [{ code: `WELCOME-${i}`, desc: 'Giảm 5% lần đặt tiếp theo', expires: '2026-12-31' }] : [],
      created_at: `2026-0${rng.int(1, 6)}-${String(rng.int(1, 28)).padStart(2, '0')}`,
    })
  }
  return list
}
export const CUSTOMERS = genCustomers()

export const ADMIN_USERS: AdminUser[] = [
  { id: 'U01', name: 'Đỗ Quang Vinh', role: 'executive', email: 'ceo@rootytrip.com', title: 'Lãnh đạo' },
  { id: 'U02', name: 'Lê Hoàng Yến', role: 'hotel_manager', hotel_id: 'H01', email: 'gm.pito@rootytrip.com', title: 'Quản lý KS · PITO Hòn Thơm' },
  { id: 'U03', name: 'Phạm Minh Tú', role: 'sales', email: 'sales@rootytrip.com', title: 'Lễ tân / Sales' },
  { id: 'U04', name: 'Trương Thu Hà', role: 'accountant', email: 'ketoan@rootytrip.com', title: 'Kế toán' },
  { id: 'U05', name: 'Ngô Đức Anh', role: 'sysadmin', email: 'it@rootytrip.com', title: 'Quản trị hệ thống' },
]

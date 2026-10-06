// Nội dung giả lập (CMS): điểm đến, trải nghiệm, cẩm nang, banner.
import type { Article, Destination, ExperienceGroup } from '@/lib/types'

export const DESTINATIONS: Destination[] = [
  { slug: 'phu-quoc', name: 'Phú Quốc', desc: 'Đảo ngọc lớn nhất Việt Nam: biển xanh quanh năm, mùa khô từ tháng 11 tới tháng 4, mùa mưa dịu và ít khách hơn.', highlights: ['Bay thẳng từ Hà Nội, TP.HCM, Seoul, Busan', 'Miễn thị thực 30 ngày cho khách quốc tế', 'Biển đẹp cả Bắc, Trung tâm và Nam đảo'], image: '/images/destinations/phu-quoc.jpg' },
  { slug: 'bac-dao', name: 'Bắc đảo', desc: 'Bãi Dài, Gành Dầu, VinWonders, Safari, Grand World. Hoang sơ, rộng rãi, hợp gia đình.', highlights: ['Bãi Dài – top bãi biển đẹp châu Á', 'VinWonders & Safari', 'Hoàng hôn Gành Dầu'], image: '/images/destinations/bac-dao.jpg' },
  { slug: 'trung-tam', name: 'Trung tâm', desc: 'Dương Đông: chợ đêm, Dinh Cậu, nhà hàng, gần sân bay. Thuận tiện đi tour mỗi ngày.', highlights: ['10 phút tới sân bay', 'Chợ đêm Phú Quốc', 'Nhiều lựa chọn ăn uống'], image: '/images/destinations/trung-tam.jpg' },
  { slug: 'nam-dao', name: 'Nam đảo', desc: 'An Thới, Hòn Thơm, Bãi Khem, Sunset Town: cáp treo vượt biển, lặn san hô, đảo nhỏ.', highlights: ['Cáp treo Hòn Thơm', 'Quần đảo An Thới', 'Bãi Khem cát trắng'], image: '/images/destinations/nam-dao.jpg' },
]

export const EXPERIENCES: ExperienceGroup[] = [
  { slug: 'am-thuc', name: 'Ẩm thực', desc: 'Hải sản Phú Quốc, bún quậy, gỏi cá trích, nhà hàng bên biển.', items: [{ name: 'Bữa tối hải sản bên biển', desc: 'Set 6 món, bàn riêng.' }, { name: 'Lớp nấu ăn địa phương', desc: 'Đi chợ An Thới và nấu bún quậy.' }], addon_ids: ['AD-DIN'], image: '/images/experiences/am-thuc.jpg' },
  { slug: 'spa', name: 'Spa', desc: 'Massage tinh dầu tràm, xông thảo mộc, spa cho cặp đôi.', items: [{ name: 'Spa thư giãn 90 phút', desc: 'Tinh dầu tràm Phú Quốc.' }], addon_ids: ['AD-SPA'], image: '/images/experiences/spa.jpg' },
  { slug: 'ho-boi', name: 'Hồ bơi', desc: 'Hồ bơi vô cực, hồ bơi tầng thượng, villa hồ bơi riêng.', items: [{ name: 'Hồ bơi vô cực PITO', desc: 'Sát mép biển Hòn Thơm.' }, { name: 'Rooftop Calista', desc: 'Ngắm Dương Đông về đêm.' }], addon_ids: [], image: '/images/experiences/ho-boi.jpg' },
  { slug: 'hoat-dong', name: 'Hoạt động', desc: 'Chèo SUP, lặn ống thở, yoga sáng, Kids Club.', items: [{ name: 'Yoga bình minh', desc: 'Miễn phí cho khách lưu trú.' }, { name: 'Kids Club', desc: 'Có người trông 8:00–20:00.' }], addon_ids: [], image: '/images/experiences/hoat-dong.jpg' },
  { slug: 'tour', name: 'Tour Rooty Trip', desc: 'Tour 4 đảo, Bắc đảo, câu mực đêm — đón tận khách sạn, đặt cùng phòng.', items: [{ name: 'Tour 4 đảo cano', desc: 'Lặn ngắm san hô.' }, { name: 'Tour Bắc đảo', desc: 'Safari & Grand World.' }, { name: 'Câu mực đêm', desc: 'Ăn tối trên thuyền.' }], addon_ids: ['AD-T4D', 'AD-TBD', 'AD-TCM'], image: '/images/experiences/tour.jpg' },
  { slug: 'transfer', name: 'Transfer', desc: 'Xe đưa đón sân bay Rooty Trip — miễn phí 1 chiều cho khách đặt trực tiếp hạng Gold trở lên.', items: [{ name: 'Xe 7 chỗ sân bay', desc: '600.000đ/chiều.' }], addon_ids: ['AD-TRF'], image: '/images/experiences/transfer.jpg' },
  { slug: 'rivus', name: 'RIVUS', desc: 'Cano riêng và du thuyền RIVUS: tự chọn hành trình, ngắm hoàng hôn trên biển.', items: [{ name: 'Cano riêng nửa ngày', desc: 'Tối đa 10 khách.' }, { name: 'Du thuyền hoàng hôn', desc: 'Tiệc nhẹ, nhạc sống.' }], addon_ids: ['AD-RCN', 'AD-RSS'], image: '/images/experiences/rivus.jpg' },
]

export const ARTICLES: Article[] = [
  { slug: 'phu-quoc-mua-nao-dep', title: 'Phú Quốc mùa nào đẹp nhất?', excerpt: 'Mùa khô, mùa mưa và cách chọn thời điểm theo nhu cầu.', category: 'Kinh nghiệm', date: '2026-09-12', read_min: 5, image: '/images/articles/phu-quoc-mua-nao-dep.jpg', published: true, body: ['Phú Quốc có hai mùa rõ rệt: mùa khô từ tháng 11 tới tháng 4 và mùa mưa từ tháng 5 tới tháng 10.', 'Mùa khô biển êm, trời trong, hợp lặn ngắm san hô ở Nam đảo. Đây cũng là mùa giá phòng cao nhất.', 'Mùa mưa thường chỉ mưa rào buổi chiều, giá phòng thấp hơn 15–25%, phù hợp khách muốn nghỉ dưỡng yên tĩnh.'] },
  { slug: 'lich-trinh-3-ngay-2-dem', title: 'Lịch trình Phú Quốc 3 ngày 2 đêm cho gia đình', excerpt: 'Ngày 1 Nam đảo, ngày 2 tour 4 đảo, ngày 3 chợ đêm.', category: 'Lịch trình', date: '2026-08-28', read_min: 7, image: '/images/articles/lich-trinh-3-ngay-2-dem.jpg', published: true, body: ['Ngày 1: nhận phòng ở Nam đảo, chiều đi cáp treo Hòn Thơm, tối xem show Sunset Town.', 'Ngày 2: tour 4 đảo cano của Rooty Trip, lặn ngắm san hô, ăn trưa trên đảo.', 'Ngày 3: sáng tắm biển, chiều về trung tâm dạo chợ đêm trước khi ra sân bay.'] },
  { slug: 'cap-treo-hon-thom', title: 'Cáp treo Hòn Thơm: mẹo đi không phải xếp hàng', excerpt: 'Giờ vắng, cách mua vé và chỗ ngồi đẹp.', category: 'Điểm đến', date: '2026-08-10', read_min: 4, image: '/images/articles/cap-treo-hon-thom.jpg', published: true, body: ['Nên đi chuyến 9:00 hoặc sau 15:00 để tránh đoàn khách lớn.', 'Khách lưu trú PITO Hòn Thơm có xe đưa ra ga cáp treo miễn phí.'] },
  { slug: 'an-gi-o-phu-quoc', title: '10 món phải thử ở Phú Quốc', excerpt: 'Gỏi cá trích, bún quậy, nhum nướng…', category: 'Ẩm thực', date: '2026-07-30', read_min: 6, image: '/images/articles/an-gi-o-phu-quoc.jpg', published: true, body: ['Gỏi cá trích cuốn bánh tráng, rau rừng và nước mắm Phú Quốc.', 'Bún quậy Kiến Xây — tự pha nước chấm theo khẩu vị.', 'Nhum nướng mỡ hành ở chợ đêm Dương Đông.'] },
  { slug: 'du-thuyen-rivus', title: 'Một buổi chiều trên du thuyền RIVUS', excerpt: 'Hoàng hôn Gành Dầu nhìn từ biển.', category: 'Trải nghiệm', date: '2026-07-15', read_min: 4, image: '/images/articles/du-thuyen-rivus.jpg', published: true, body: ['Du thuyền khởi hành 16:30 từ bến Bãi Dài, chạy dọc bờ Tây ngắm hoàng hôn.', 'Có thể đặt cùng phòng khách sạn ở bước dịch vụ thêm.'] },
  { slug: 'phu-quoc-voi-tre-nho', title: 'Đi Phú Quốc với trẻ nhỏ: chọn khách sạn thế nào?', excerpt: 'Kids Club, phòng gia đình, gần biển và gần bệnh viện.', category: 'Kinh nghiệm', date: '2026-07-02', read_min: 5, image: '/images/articles/phu-quoc-voi-tre-nho.jpg', published: true, body: ['Ưu tiên khách sạn có Kids Club và phòng Family có sofa giường.', 'Nam đảo yên tĩnh, Bắc đảo gần khu vui chơi, Trung tâm tiện đi lại.'] },
]

export const HOME_BANNER = {
  headline: 'Ở đâu tại Phú Quốc?',
  sub: 'Một nơi tìm, so sánh và đặt phòng trực tiếp tại các khách sạn Rooty Hospitality — kèm xe sân bay, tour và du thuyền.',
}

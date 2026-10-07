// PITO Hòn Thơm — nội dung thật từ Drive "4. ROOTY HOSPITALITY/1. PITO HOTEL HÒN THƠM":
// "2-Thông-tin-lưu-trú-PITO-Hòn-Thơm.pdf" (VI) + bản EN. Không ghi giá phòng: giá lấy từ Gohost.
// Chỗ tài liệu mâu thuẫn ghi bản ít hứa hơn — xem docs/2026-10-07-du-lieu-that-va-admin.md §3.
import type { HotelContent, L } from '@/lib/types'

const img = (f: string) => `/images/pito-hon-thom/${f}.jpg`
/** Chữ giống nhau ở mọi ngôn ngữ (giờ, số). */
const n = (s: string): L => ({ vi: s, en: s })
const SELF_TICKET: L = { vi: 'Tự mua vé theo chiều cao', en: 'Own ticket, by height' }

export const PITO: HotelContent = {
  slug: 'pito-hon-thom',
  code: 'PITO',
  gohost_tenant_id: null, // điền khi có API key: admin → Khách sạn → Phòng & ánh xạ
  opening: null, // khai trương 10/2026 (PDF), đang đón khách
  name: 'PITO Hòn Thơm',
  area: { vi: 'Santo Port · Hòn Thơm', en: 'Santo Port · Hon Thom Island' },
  address: {
    vi: 'Căn M6-32 Santo Port, Khu phố Hòn Thơm, Đặc khu Phú Quốc, tỉnh An Giang',
    en: 'Unit M6-32 Santo Port, Hon Thom Quarter, Phu Quoc Special Zone, An Giang Province',
  },
  map_query: 'Santo Port, Hòn Thơm, Phú Quốc',
  operator: 'Công ty TNHH Khách sạn Hòn Thơm Phú Quốc',
  tagline: { vi: 'Khách sạn boutique 13 phòng tại Santo Port, trên đảo Hòn Thơm', en: 'A 13-room boutique hotel at Santo Port, on Hon Thom Island' },
  description: {
    vi: 'Nghỉ dưỡng trọn gói cùng cáp treo và Sun World Hòn Thơm: giá phòng đã gồm vé cáp treo không giới hạn lượt, vé Sun World Hòn Thơm cho khách người lớn, ăn sáng mỗi ngày và xe đón tiễn sân bay theo khung giờ cố định.',
    en: 'All-inclusive with the cable car and Sun World Hon Thom: your rate includes unlimited cable car rides and Sun World Hon Thom for adult guests, daily breakfast and airport transfers at fixed times.',
  },
  highlights: [
    { vi: 'Cáp treo Hòn Thơm không giới hạn lượt (khách người lớn)', en: 'Unlimited Hon Thom cable car rides (adult guests)' },
    { vi: 'Sun World Hòn Thơm không giới hạn số lần (khách người lớn)', en: 'Sun World Hon Thom, unlimited visits (adult guests)' },
    { vi: 'Ăn sáng mỗi ngày: mì hoặc bún hải sản', en: 'Daily breakfast: seafood noodle soup' },
    { vi: 'Đón tiễn sân bay miễn phí theo khung giờ cố định', en: 'Free airport transfer at fixed times' },
  ],
  facts: [
    { icon: 'map-pin', label: { vi: 'Địa chỉ', en: 'Address' }, value: { vi: 'Căn M6-32 Santo Port, Hòn Thơm, Phú Quốc', en: 'Unit M6-32 Santo Port, Hon Thom, Phu Quoc' } },
    { icon: 'clock', label: { vi: 'Nhận / trả phòng', en: 'Check-in / out' }, value: { vi: 'Từ 15:00 / trước 12:00', en: 'From 15:00 / before 12:00' } },
    { icon: 'cable-car', label: { vi: 'Di chuyển', en: 'Getting here' }, value: { vi: 'Cáp treo Hòn Thơm từ ga Sunset Town (An Thới)', en: 'Hon Thom cable car from Sunset Town station (An Thoi)' } },
    { icon: 'door-open', label: { vi: 'Quy mô', en: 'Size' }, value: { vi: '13 phòng · 3 hạng phòng · 9 phòng có bồn tắm', en: '13 rooms · 3 room types · 9 with a bathtub' } },
  ],
  included: [
    { icon: 'cable-car', label: { vi: 'Cáp treo Hòn Thơm', en: 'Hon Thom cable car' }, desc: { vi: 'Không giới hạn lượt, cả hai chiều, suốt kỳ nghỉ — cho khách người lớn', en: 'Unlimited rides both ways throughout your stay — adult guests' } },
    { icon: 'ferris-wheel', label: { vi: 'Sun World Hòn Thơm', en: 'Sun World Hon Thom' }, desc: { vi: 'Công viên nước và các trò chơi, không giới hạn số lần — cho khách người lớn', en: 'Water park and attractions, unlimited visits — adult guests' } },
    { icon: 'coffee', label: { vi: 'Ăn sáng', en: 'Breakfast' }, desc: { vi: 'Mì hoặc bún hải sản, 07:00 – 10:00, cho 2 khách/phòng/đêm', en: 'Seafood noodle soup, 07:00 – 10:00, for 2 guests/room/night' } },
    { icon: 'bus', label: { vi: 'Đón tiễn sân bay', en: 'Airport transfer' }, desc: { vi: 'Sân bay Phú Quốc ↔ ga cáp treo An Thới, theo khung giờ cố định', en: 'Phu Quoc Airport ↔ An Thoi cable car station, fixed times' } },
    { icon: 'wifi', label: { vi: 'Wi-Fi tốc độ cao', en: 'High-speed Wi-Fi' } },
    { icon: 'shirt', label: { vi: 'Giặt ủi theo định mức', en: 'Laundry within the stay allowance' } },
    { icon: 'receipt', label: { vi: 'Phí phục vụ và VAT', en: 'Service charge and VAT' } },
  ],
  not_available: [
    { vi: 'Hồ bơi', en: 'Swimming pool' },
    { vi: 'Nhà hàng phục vụ trưa và tối', en: 'Lunch and dinner restaurant' },
    { vi: 'Bãi biển riêng', en: 'Private beach' },
    { vi: 'Giường phụ', en: 'Extra beds' },
  ],
  getting_here: [
    {
      title: { vi: 'Cáp treo Hòn Thơm', en: 'Hon Thom cable car' },
      body: {
        vi: 'Do Sun World vận hành. Khách sạn nằm trên đảo nên việc ra đảo phụ thuộc giờ cáp treo — vui lòng đọc trước khi đặt vé máy bay.',
        en: 'Operated by Sun World. The hotel is on the island, so getting there depends on cable car hours — please read before booking your flight.',
      },
      tables: [{
        caption: { vi: 'Giờ chạy', en: 'Operating hours' },
        head: [{ vi: 'Khung giờ', en: 'Service' }, { vi: 'Thời gian', en: 'Hours' }, { vi: 'Chiều & điều kiện', en: 'Direction & conditions' }],
        rows: [[{ vi: 'Ban ngày — hằng ngày', en: 'Daytime — every day' }, { vi: '09:30 – 17:00', en: '09:30 – 17:00' }, { vi: 'Cả hai chiều, không cần đăng ký', en: 'Both directions, no registration' }]],
      }],
      notes: [
        // Mâu thuẫn #1: PDF khách ghi có cáp đêm; sổ tay vận hành ghi "dự kiến từ 01/11, chưa hứa với khách".
        { vi: 'Cáp đêm (chiều Sunset Town → Hòn Thơm) dự kiến chạy từ 01/11/2026 và phải đăng ký với khách sạn trước 16:00 cùng ngày. Vui lòng liên hệ khách sạn để xác nhận trước khi đặt vé máy bay.', en: 'A night cable car (Sunset Town → Hon Thom) is expected from 1 Nov 2026 and must be registered with the hotel before 16:00 the same day. Please confirm with the hotel before booking your flight.' },
        { vi: 'Chuyến bay hạ cánh sau 15:30 có thể không kịp chuyến cáp 17:00: nên đặt xe riêng ra ga, hoặc nghỉ đêm đầu trên đất liền.', en: 'Flights landing after 15:30 may miss the 17:00 cable car: book a private car to the station, or spend the first night on the mainland.' },
        { vi: 'Ngày trả phòng: khi đã đi cáp từ Hòn Thơm về ga Sunset Town thì vé hết hiệu lực, không quay lại đảo được nữa.', en: 'On check-out day, once you ride from Hon Thom back to Sunset Town the ticket expires and you cannot return to the island.' },
        { vi: 'Lịch cáp treo do Sun World công bố và có thể thay đổi.', en: 'Cable car schedules are published by Sun World and may change.' },
      ],
    },
    {
      title: { vi: 'Xe đón tiễn sân bay miễn phí', en: 'Free airport transfer' },
      body: { vi: 'Sân bay Phú Quốc ↔ ga cáp treo An Thới, cho mọi khách lưu trú.', en: 'Phu Quoc Airport ↔ An Thoi cable car station, for every in-house guest.' },
      tables: [
        {
          caption: { vi: 'Chiều đón — xe chạy tại sân bay', en: 'Pick-up — departs from the airport' },
          head: [{ vi: 'Xe chạy', en: 'Departs' }, { vi: 'Hợp chuyến bay hạ cánh', en: 'For flights landing' }],
          rows: [
            [n('09:30'), n('08:00 – 09:15')],
            [n('11:30'), n('10:00 – 11:15')],
            [n('13:30'), n('12:00 – 13:15')],
            [{ vi: '15:45 (chuyến cuối)', en: '15:45 (last run)' }, n('14:00 – 15:30')],
          ],
        },
        {
          caption: { vi: 'Chiều tiễn — rời khách sạn', en: 'Drop-off — leaves the hotel' },
          head: [{ vi: 'Rời khách sạn', en: 'Leaves the hotel' }, { vi: 'Hợp chuyến bay cất cánh từ', en: 'For flights departing from' }],
          rows: [
            [n('09:30'), n('12:30')],
            [n('12:00'), n('14:45')],
            [n('14:00'), n('16:45')],
            [{ vi: '16:00 (chuyến cuối)', en: '16:00 (last run)' }, n('18:45')],
          ],
        },
      ],
      notes: [
        { vi: 'Đăng ký trước tối thiểu 24 giờ, kèm số hiệu chuyến bay và giờ hạ cánh hoặc cất cánh. Xe chờ tối đa 15 phút.', en: 'Register at least 24 hours ahead with your flight number and landing or departure time. The vehicle waits up to 15 minutes.' },
        { vi: 'Hành lý tiêu chuẩn: 1 vali ký gửi và 1 hành lý xách tay mỗi khách. Xe chỉ chạy tuyến sân bay – ga cáp treo, không ghé điểm khác.', en: 'Standard luggage: 1 checked bag and 1 carry-on per guest. Airport – station route only, no other stops.' },
        { vi: 'Ngoài khung giờ trên, khách sạn hỗ trợ đặt xe riêng: 400.000 VNĐ/lượt (xe 7 chỗ), 500.000 VNĐ/lượt (xe 16 chỗ). Xe đón tiễn không nối chuyến cáp đêm.', en: 'Outside these times the hotel can book a private car: VND 400,000/trip (7 seats), VND 500,000/trip (16 seats). Transfers do not connect with the night cable car.' },
      ],
    },
  ],
  policies: [
    [{ vi: 'Nhận phòng', en: 'Check-in' }, { vi: 'Từ 15:00', en: 'From 15:00' }],
    [{ vi: 'Trả phòng', en: 'Check-out' }, { vi: 'Trước 12:00', en: 'Before 12:00' }],
    [{ vi: 'Sức chứa', en: 'Occupancy' }, { vi: 'Mỗi phòng tối đa 2 người lớn và 1 trẻ dưới 6 tuổi ngủ chung giường với bố mẹ. Không kê được giường phụ.', en: 'Each room takes up to 2 adults and 1 child under 6 sharing the parents’ bed. No extra beds.' }],
    [{ vi: 'Giấy tờ', en: 'Documents' }, { vi: 'CCCD hoặc hộ chiếu khi nhận phòng; trẻ em cần giấy khai sinh.', en: 'ID card or passport at check-in; birth certificate for children.' }],
    [{ vi: 'Thanh toán', en: 'Payment' }, { vi: 'Thanh toán trước 100% để xác nhận đặt phòng.', en: '100% prepayment to confirm the booking.' }],
    [{ vi: 'Huỷ phòng', en: 'Cancellation' }, { vi: 'Huỷ từ 7 ngày trở lên trước ngày đến: phí 50%. Dưới 7 ngày, không đến hoặc trả phòng sớm: phí 100%. Giai đoạn lễ, Tết: không hoàn huỷ.', en: '7 or more days before arrival: 50% fee. Less than 7 days, no-show or early departure: 100%. Public holidays and Lunar New Year: non-refundable.' }],
    [{ vi: 'Đổi ngày', en: 'Date change' }, { vi: 'Miễn phí 1 lần nếu báo trước tối thiểu 7 ngày, tuỳ tình trạng phòng trống. Thông báo huỷ hoặc đổi chỉ có hiệu lực khi gửi bằng email và được khách sạn xác nhận.', en: 'Free once if notified at least 7 days ahead, subject to availability. Cancellations and changes count only when sent by email and confirmed by the hotel.' }],
    [{ vi: 'Lễ, Tết', en: 'Holidays' }, { vi: 'Có phụ thu và số đêm tối thiểu: 30/4 – 01/5 (2 đêm), 01/9 – 03/9 (2 đêm), 24/12 – 05/01 (2 đêm), Tết Nguyên đán 06/02 – 15/02 (3 đêm).', en: 'A surcharge and minimum stay apply: 30 Apr – 1 May (2 nights), 1 – 3 Sep (2 nights), 24 Dec – 5 Jan (2 nights), Lunar New Year 6 – 15 Feb (3 nights).' }],
    [{ vi: 'Gián đoạn phương tiện ra đảo', en: 'Island access disruption' }, { vi: 'Cáp treo và tàu do đơn vị thứ ba vận hành. Nếu ngừng do thời tiết, bảo trì hoặc quyết định của cơ quan có thẩm quyền, khách sạn hỗ trợ đổi ngày miễn phí hoặc bảo lưu giá trị đặt phòng 6 tháng.', en: 'The cable car and boats are run by third parties. If they stop because of weather, maintenance or an official decision, the hotel offers a free date change or holds the booking value for 6 months.' }],
  ],
  children: {
    caption: { vi: 'Chính sách trẻ em', en: 'Children' },
    head: [{ vi: 'Độ tuổi', en: 'Age' }, { vi: 'Tiền phòng', en: 'Room' }, { vi: 'Ăn sáng', en: 'Breakfast' }, { vi: 'Cáp treo / Sun World', en: 'Cable car / Sun World' }],
    rows: [
      [{ vi: 'Dưới 6 tuổi', en: 'Under 6' }, { vi: 'Miễn phí, ngủ chung giường với bố mẹ (tối đa 1 trẻ/phòng)', en: 'Free, sharing the parents’ bed (max 1 child/room)' }, { vi: 'Miễn phí', en: 'Free' }, SELF_TICKET],
      [{ vi: '6 – 11 tuổi', en: '6 – 11' }, { vi: 'Miễn phí, ngủ chung giường với bố mẹ', en: 'Free, sharing the parents’ bed' }, { vi: '150.000 VNĐ/đêm', en: 'VND 150,000/night' }, SELF_TICKET],
      [{ vi: 'Từ 12 tuổi', en: '12 and above' }, { vi: 'Tính như người lớn — cần phòng riêng', en: 'Charged as an adult — separate room required' }, { vi: 'Đã gồm', en: 'Included' }, SELF_TICKET],
    ],
    note: {
      vi: 'Vé cáp treo và Sun World miễn phí cho khách người lớn lưu trú; trẻ em mua vé theo quy định chiều cao của Sun World. Không có giấy khai sinh thì tính tuổi theo chiều cao: dưới 1 m · 1 m – 1,4 m · trên 1,4 m.',
      en: 'Cable car and Sun World tickets are free for adult in-house guests; children buy tickets by Sun World’s height rules. Without a birth certificate, age is set by height: under 1 m · 1 – 1.4 m · over 1.4 m.',
    },
  },
  cancel_summary: { vi: 'Huỷ trước từ 7 ngày: phí 50% · dưới 7 ngày: 100% · lễ, Tết: không hoàn', en: 'Cancel 7+ days ahead: 50% fee · under 7 days: 100% · holidays: non-refundable' },
  faq: [
    [{ vi: 'Đi từ sân bay tới khách sạn thế nào?', en: 'How do I get from the airport to the hotel?' }, { vi: 'Xe miễn phí của khách sạn đón tại sân bay theo 4 khung giờ (chuyến cuối 15:45) và đưa tới ga cáp treo An Thới; từ đó quý khách đi cáp treo Hòn Thơm ra đảo (09:30 – 17:00). Vui lòng đăng ký xe trước 24 giờ.', en: 'The hotel’s free car picks you up at the airport at 4 set times (last run 15:45) and takes you to An Thoi cable car station; from there the Hon Thom cable car takes you to the island (09:30 – 17:00). Please register the car 24 hours ahead.' }],
    [{ vi: 'Chuyến bay của tôi hạ cánh sau 15:30 thì sao?', en: 'My flight lands after 15:30 — what then?' }, { vi: 'Xe đón theo khung giờ sẽ không kịp, và cáp treo ban ngày dừng lúc 17:00. Cáp đêm dự kiến chạy từ 01/11/2026 (đăng ký trước 16:00) — vui lòng liên hệ khách sạn để xác nhận trước khi đặt vé. Nếu không kịp cáp, quý khách có thể đặt xe riêng ra ga hoặc nghỉ đêm đầu trên đất liền.', en: 'The scheduled car will not make it, and the daytime cable car stops at 17:00. A night cable car is expected from 1 Nov 2026 (register before 16:00) — please confirm with the hotel before booking. If you cannot make the cable car, book a private car to the station or spend the first night on the mainland.' }],
    [{ vi: 'Trẻ em có được miễn vé cáp treo và Sun World không?', en: 'Are cable car and Sun World tickets free for children?' }, { vi: 'Không. Vé miễn phí dành cho khách người lớn lưu trú; trẻ em mua vé theo quy định chiều cao của Sun World. Tiền phòng và ăn sáng của trẻ theo chính sách trẻ em.', en: 'No. Free tickets are for adult in-house guests; children buy tickets by Sun World’s height rules. Room and breakfast for children follow the children policy.' }],
    [{ vi: 'Phòng có kê thêm giường được không?', en: 'Can I get an extra bed?' }, { vi: 'Không. Mỗi phòng tối đa 2 người lớn và 1 trẻ dưới 6 tuổi ngủ chung giường với bố mẹ; đi 3 người lớn vui lòng đặt thêm phòng.', en: 'No. Each room takes up to 2 adults and 1 child under 6 sharing the parents’ bed; a group of 3 adults needs a second room.' }],
    [{ vi: 'Khách sạn có hồ bơi, nhà hàng không?', en: 'Is there a pool or a restaurant?' }, { vi: 'Không có hồ bơi, nhà hàng trưa/tối hay bãi biển riêng. Khách sạn phục vụ ăn sáng 07:00 – 10:00; Sun World Hòn Thơm (đã gồm vé cho người lớn) có công viên nước.', en: 'There is no pool, lunch or dinner restaurant, or private beach. Breakfast is served 07:00 – 10:00, and Sun World Hon Thom (tickets included for adults) has a water park.' }],
    [{ vi: 'Ngày trả phòng tôi có quay lại đảo được không?', en: 'Can I go back to the island on check-out day?' }, { vi: 'Khi đã đi cáp từ Hòn Thơm về ga Sunset Town thì vé hết hiệu lực. Quý khách chọn về buổi sáng hay buổi chiều tuỳ ý, miễn trong giờ cáp chạy.', en: 'Once you ride from Hon Thom back to Sunset Town the ticket expires. Leave in the morning or the afternoon as you like, within cable car hours.' }],
  ],
  cover: img('mat-tien'),
  // Ảnh ngang trước: 3 ảnh đầu làm banner trang chủ, 5 ảnh đầu hiện ở bộ ảnh đầu trang khách sạn.
  gallery: ['mat-tien', 'sanh', 'terrace-3', 'mat-tien-2', 'le-tan', 'terrace-1', 'terrace-2', 'ban-cong-301', 'cua-so-tron-403'].map(img),
  pending: [
    'Cáp treo đêm: PDF gửi khách ghi đang chạy, sổ tay vận hành ghi dự kiến từ 01/11 — web ghi “dự kiến”.',
    'Diện tích Superior: bản tiếng Việt ghi 19 – 22 m², bản tiếng Anh ghi 20 m² — web ghi 19 – 22 m².',
    'Phòng 101 và 601: PDF xếp vào Deluxe Bathtub 27 m², bảng giá đại lý và sổ tay ghi 20 m² — web ghi 20 m².',
    'Xe riêng theo giờ tự chọn (ở từ 2 đêm): có trong bảng giá đại lý, không có trong PDF gửi khách — web chưa ghi.',
  ],
  rooms: [
    {
      gohost_room_type_id: null,
      slug: 'superior',
      name: { vi: 'Superior', en: 'Superior' },
      size: { vi: '19 – 22 m²', en: '19 – 22 m²' },
      view: { vi: 'Hướng phố, vài phòng nhìn xéo ra biển', en: 'Promenade view, some with a partial sea view' },
      features: [{ vi: 'Cửa sổ', en: 'Window' }],
      description: { vi: '4 phòng có cửa sổ nhìn ra khu phố Santo Port, một số phòng nhìn xéo ra biển. Phòng tắm không có bồn tắm.', en: '4 rooms with a window over the Santo Port promenade; some have a partial sea view. No bathtub.' },
      images: ['superior-1', 'superior-2', 'superior-3', 'superior-4'].map(f => img(`rooms/${f}`)),
    },
    {
      gohost_room_type_id: null,
      slug: 'deluxe-bathtub',
      name: { vi: 'Deluxe Bathtub', en: 'Deluxe Bathtub' },
      size: { vi: '27 m²', en: '27 m²' },
      view: { vi: 'Hướng núi', en: 'Mountain view' },
      features: [{ vi: 'Bồn tắm', en: 'Bathtub' }, { vi: 'Ban công', en: 'Balcony' }],
      description: { vi: '5 phòng — hạng rộng nhất của khách sạn, có bồn tắm và ban công nhìn về phía núi.', en: '5 rooms — the largest at the hotel, with a bathtub and a balcony facing the mountains.' },
      note: {
        vi: 'Phòng 101 và 601 thuộc hạng này nhưng bán giá ưu đãi riêng và rộng 20 m²: phòng 101 không có cửa sổ; phòng 601 ở tầng 6, thang máy chỉ lên tới tầng 5 (bù lại có ban công riêng).',
        en: 'Rooms 101 and 601 belong to this type but are sold at a special rate and measure 20 m²: room 101 has no window; room 601 is on floor 6 while the lift only reaches floor 5 (it has a private balcony).',
      },
      images: ['deluxe-bathtub-1', 'deluxe-bathtub-2', 'deluxe-bathtub-3', 'deluxe-bathtub-4'].map(f => img(`rooms/${f}`)),
    },
    {
      gohost_room_type_id: null,
      slug: 'premier-bathtub',
      name: { vi: 'Premier Bathtub', en: 'Premier Bathtub' },
      size: { vi: '26 m²', en: '26 m²' },
      view: { vi: 'Hướng phố, vài phòng nhìn xéo ra biển', en: 'Promenade view, some with a partial sea view' },
      features: [{ vi: 'Bồn tắm', en: 'Bathtub' }, { vi: 'Ban công', en: 'Balcony' }],
      description: { vi: '4 phòng có bồn tắm và ban công nhìn ra khu phố Santo Port, một số phòng nhìn xéo ra biển.', en: '4 rooms with a bathtub and a balcony over the Santo Port promenade; some have a partial sea view.' },
      images: ['premier-bathtub-1', 'premier-bathtub-2', 'premier-bathtub-3'].map(f => img(`rooms/${f}`)),
    },
  ],
}

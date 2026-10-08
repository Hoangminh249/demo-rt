// Calista Hotel Phú Quốc — nội dung thật từ Drive "4. ROOTY HOSPITALITY/2. CALISTA HOTEL PHÚ QUỐC":
// "2-Thông-tin-lưu-trú-CALISTA.pdf" (chỉ có tiếng Việt; bản EN do Claude dịch — Marketing duyệt).
// Chưa có ảnh chụp (PDF: "thư viện hình ảnh đang cập nhật"). Chỗ mâu thuẫn ghi bản ít hứa hơn — docs/2026-10-07-du-lieu-that-va-admin.md §3.
import type { HotelContent } from '@/types/hotel'
import type { L } from '@/types/global'

/** Chữ giống nhau ở mọi ngôn ngữ (giờ, số). */
const n = (s: string): L => ({ vi: s, en: s })
const ROOM_BASICS: L[] = [
  { vi: 'Máy lạnh', en: 'Air conditioning' }, { vi: 'TV', en: 'TV' }, { vi: 'Minibar', en: 'Minibar' },
  { vi: 'Tủ quần áo', en: 'Wardrobe' }, { vi: 'Phòng tắm riêng', en: 'Private bathroom' },
]

export const CALISTA: HotelContent = {
  slug: 'calista',
  code: 'CALISTA',
  gohost_tenant_id: null, // Calista đã có property trên Gohost chưa: UNKNOWN
  opening: '2026-12-20',
  name: 'Calista Hotel Phú Quốc',
  area: { vi: 'Sunset Town · An Thới', en: 'Sunset Town · An Thoi' },
  address: {
    vi: 'Căn M128, đường Milan, Sunset Town (KĐT Sun Grand Hillside Residence The Center), An Thới, Phú Quốc',
    en: 'Unit M128, Milan Street, Sunset Town (Sun Grand Hillside Residence The Center), An Thoi, Phu Quoc',
  },
  map_query: 'Sun Grand Hillside Residence The Center, Sunset Town, An Thới, Phú Quốc',
  operator: 'Công ty TNHH Khách sạn Hòn Thơm Phú Quốc',
  tagline: { vi: 'Ở như ở nhà tại Sunset Town: có máy giặt, đi lại tự do không giới hạn giờ giấc', en: 'Feel at home in Sunset Town: washer-dryers and come-and-go freedom at any hour' },
  description: {
    vi: 'Khách sạn 15 phòng tại Sunset Town, An Thới. Khách sạn nằm trên đất liền nên quý khách ra vào tự do bất kể giờ nào, cách sân bay Phú Quốc khoảng 35 – 40 phút. Giá phòng đã gồm ăn sáng và xe đón tiễn sân bay theo khung giờ cố định.',
    en: 'A 15-room hotel in Sunset Town, An Thoi. It sits on the mainland, so you can come and go at any hour, about 35 – 40 minutes from Phu Quoc Airport. Your rate includes breakfast and airport transfers at fixed times.',
  },
  highlights: [
    { vi: 'Trên đất liền, ra vào tự do 24/7', en: 'On the mainland, come and go 24/7' },
    { vi: 'Ăn sáng mỗi ngày: bún hoặc phở', en: 'Daily breakfast: bún or phở' },
    { vi: '2 máy giặt sấy miễn phí', en: '2 free washer-dryers' },
    { vi: 'Đón tiễn sân bay 5 khung giờ mỗi chiều', en: 'Airport transfers at 5 set times each way' },
  ],
  facts: [
    { icon: 'map-pin', label: { vi: 'Địa chỉ', en: 'Address' }, value: { vi: 'Căn M128, đường Milan, Sunset Town, An Thới', en: 'Unit M128, Milan Street, Sunset Town, An Thoi' } },
    { icon: 'clock', label: { vi: 'Nhận / trả phòng', en: 'Check-in / out' }, value: { vi: 'Từ 15:00 / trước 12:00', en: 'From 15:00 / before 12:00' } },
    { icon: 'plane', label: { vi: 'Di chuyển', en: 'Getting here' }, value: { vi: 'Cách sân bay Phú Quốc khoảng 35 – 40 phút', en: 'About 35 – 40 minutes from Phu Quoc Airport' } },
    { icon: 'door-open', label: { vi: 'Quy mô', en: 'Size' }, value: { vi: '15 phòng · 3 hạng phòng', en: '15 rooms · 3 room types' } },
  ],
  included: [
    { icon: 'coffee', label: { vi: 'Ăn sáng', en: 'Breakfast' }, desc: { vi: 'Bún hoặc phở tại quán đối tác theo voucher khách sạn phát, cho 2 khách/phòng/đêm', en: 'Bún or phở at a partner eatery with the hotel’s voucher, for 2 guests/room/night' } },
    { icon: 'washing-machine', label: { vi: 'Máy giặt sấy', en: 'Washer-dryers' }, desc: { vi: '2 bộ tại tầng 2, 08:00 – 21:00, có sẵn bột giặt', en: '2 sets on floor 2, 08:00 – 21:00, detergent provided' } },
    { icon: 'bus', label: { vi: 'Đón tiễn sân bay', en: 'Airport transfer' }, desc: { vi: 'Sân bay Phú Quốc ↔ khách sạn, 5 khung giờ mỗi chiều', en: 'Phu Quoc Airport ↔ hotel, 5 set times each way' } },
    { icon: 'wifi', label: { vi: 'Wi-Fi tốc độ cao', en: 'High-speed Wi-Fi' } },
    { icon: 'shirt', label: { vi: 'Giặt ủi theo định mức', en: 'Laundry within the stay allowance' } },
    { icon: 'receipt', label: { vi: 'Phí phục vụ và VAT', en: 'Service charge and VAT' } },
  ],
  not_available: [
    { vi: 'Hồ bơi', en: 'Swimming pool' },
    { vi: 'Bồn tắm', en: 'Bathtub' },
    { vi: 'Nhà hàng phục vụ trưa và tối', en: 'Lunch and dinner restaurant' },
    { vi: 'Bãi biển riêng', en: 'Private beach' },
  ],
  getting_here: [
    {
      title: { vi: 'Xe đón tiễn sân bay miễn phí', en: 'Free airport transfer' },
      body: { vi: 'Sân bay Phú Quốc ↔ khách sạn, khoảng 35 – 40 phút, cho mọi khách lưu trú.', en: 'Phu Quoc Airport ↔ hotel, about 35 – 40 minutes, for every in-house guest.' },
      tables: [
        {
          caption: { vi: 'Chiều đón — xe chạy tại sân bay', en: 'Pick-up — departs from the airport' },
          head: [{ vi: 'Xe chạy', en: 'Departs' }, { vi: 'Hợp chuyến bay hạ cánh', en: 'For flights landing' }],
          rows: [
            [n('08:00'), n('06:30 – 07:45')],
            [n('11:00'), n('09:30 – 10:45')],
            [n('14:00'), n('12:30 – 13:45')],
            [n('17:00'), n('15:30 – 16:45')],
            [{ vi: '20:00 (chuyến cuối)', en: '20:00 (last run)' }, n('18:30 – 19:45')],
          ],
        },
        {
          caption: { vi: 'Chiều tiễn — rời khách sạn', en: 'Drop-off — leaves the hotel' },
          head: [{ vi: 'Rời khách sạn', en: 'Leaves the hotel' }, { vi: 'Hợp chuyến bay cất cánh từ', en: 'For flights departing from' }],
          rows: [
            [n('06:30'), n('09:00')],
            [n('09:30'), n('12:00')],
            [n('12:30'), n('15:00')],
            [n('15:30'), n('18:00')],
            [{ vi: '18:30 (chuyến cuối)', en: '18:30 (last run)' }, n('21:00')],
          ],
        },
      ],
      notes: [
        { vi: 'Đăng ký trước tối thiểu 24 giờ, kèm số hiệu chuyến bay và giờ hạ cánh hoặc cất cánh. Xe chờ tối đa 15 phút.', en: 'Register at least 24 hours ahead with your flight number and landing or departure time. The vehicle waits up to 15 minutes.' },
        { vi: 'Hành lý tiêu chuẩn: 1 vali ký gửi và 1 hành lý xách tay mỗi khách. Xe chỉ phục vụ đón tiễn sân bay, không ghé điểm khác.', en: 'Standard luggage: 1 checked bag and 1 carry-on per guest. Airport transfers only, no other stops.' },
        { vi: 'Lưu trú từ 2 đêm liên tiếp hoặc tổng từ 3 đêm phòng: được bố trí xe riêng theo khung giờ tự chọn.', en: 'Stays of 2+ consecutive nights or 3+ room nights get a private car at a time of your choice.' },
        { vi: 'Ngoài khung giờ trên, khách sạn hỗ trợ đặt xe riêng: 400.000 VNĐ/lượt (xe 7 chỗ), 500.000 VNĐ/lượt (xe 16 chỗ).', en: 'Outside these times the hotel can book a private car: VND 400,000/trip (7 seats), VND 500,000/trip (16 seats).' },
      ],
    },
  ],
  policies: [
    [{ vi: 'Nhận phòng', en: 'Check-in' }, { vi: 'Từ 15:00', en: 'From 15:00' }],
    [{ vi: 'Trả phòng', en: 'Check-out' }, { vi: 'Trước 12:00', en: 'Before 12:00' }],
    [{ vi: 'Sức chứa', en: 'Occupancy' }, { vi: 'Mỗi phòng tối đa 2 người lớn và 1 trẻ dưới 6 tuổi ngủ chung giường với bố mẹ.', en: 'Each room takes up to 2 adults and 1 child under 6 sharing the parents’ bed.' }],
    [{ vi: 'Giấy tờ', en: 'Documents' }, { vi: 'CCCD hoặc hộ chiếu khi nhận phòng; trẻ em cần giấy khai sinh.', en: 'ID card or passport at check-in; birth certificate for children.' }],
    [{ vi: 'Thanh toán', en: 'Payment' }, { vi: 'Thanh toán trước 100% để xác nhận đặt phòng.', en: '100% prepayment to confirm the booking.' }],
    [{ vi: 'Huỷ phòng', en: 'Cancellation' }, { vi: 'Huỷ từ 7 ngày trở lên trước ngày đến: phí 50%. Dưới 7 ngày, không đến hoặc trả phòng sớm: phí 100%. Giai đoạn lễ, Tết: không hoàn huỷ.', en: '7 or more days before arrival: 50% fee. Less than 7 days, no-show or early departure: 100%. Public holidays and Lunar New Year: non-refundable.' }],
    [{ vi: 'Đổi ngày', en: 'Date change' }, { vi: 'Miễn phí 1 lần nếu báo trước tối thiểu 7 ngày, tuỳ tình trạng phòng trống. Thông báo huỷ hoặc đổi chỉ có hiệu lực khi gửi bằng email và được khách sạn xác nhận.', en: 'Free once if notified at least 7 days ahead, subject to availability. Cancellations and changes count only when sent by email and confirmed by the hotel.' }],
    [{ vi: 'Lễ, Tết', en: 'Holidays' }, { vi: 'Có phụ thu và số đêm tối thiểu: 30/4 – 01/5 (2 đêm), 01/9 – 03/9 (2 đêm), 24/12 – 05/01 (2 đêm), Tết Nguyên đán 06/02 – 15/02 (3 đêm). Mùa khai trương 2026: miễn phụ thu Noel và Năm mới.', en: 'A surcharge and minimum stay apply: 30 Apr – 1 May (2 nights), 1 – 3 Sep (2 nights), 24 Dec – 5 Jan (2 nights), Lunar New Year 6 – 15 Feb (3 nights). Opening season 2026: no Christmas and New Year surcharge.' }],
    // Mâu thuẫn #2: PDF ghi bếp cho khách lưu trú; bảng giá đại lý ghi "dành riêng phòng 501, 502, 503".
    [{ vi: 'Bếp', en: 'Kitchen' }, { vi: 'Khu bếp ngoài ban công tầng 5 (06:00 – 22:00) dành cho khách 3 phòng Superior tầng 5. Vui lòng tự dọn dẹp và không nấu món nặng mùi như lẩu mắm, cá chiên, sầu riêng.', en: 'The balcony kitchen on floor 5 (06:00 – 22:00) is for guests of the 3 Superior rooms on that floor. Please clean up after cooking and avoid strong-smelling dishes such as fermented fish hotpot, fried fish or durian.' }],
    [{ vi: 'Máy giặt', en: 'Laundry' }, { vi: 'Mỗi lượt giặt 1 mẻ để các phòng khác cùng dùng. Khách sạn không nhận giặt thay và không chịu trách nhiệm về mất mát hoặc hư hỏng quần áo.', en: 'One load per turn so other rooms can use the machines. The hotel does not do laundry for guests and is not responsible for lost or damaged clothes.' }],
  ],
  children: {
    caption: { vi: 'Chính sách trẻ em', en: 'Children' },
    head: [{ vi: 'Độ tuổi', en: 'Age' }, { vi: 'Tiền phòng', en: 'Room' }, { vi: 'Ăn sáng', en: 'Breakfast' }],
    rows: [
      [{ vi: 'Dưới 6 tuổi', en: 'Under 6' }, { vi: 'Miễn phí, ngủ chung giường với bố mẹ (tối đa 1 trẻ/phòng)', en: 'Free, sharing the parents’ bed (max 1 child/room)' }, { vi: 'Miễn phí', en: 'Free' }],
      [{ vi: '6 – 11 tuổi', en: '6 – 11' }, { vi: 'Miễn phí, ngủ chung giường với bố mẹ', en: 'Free, sharing the parents’ bed' }, { vi: '150.000 VNĐ/đêm', en: 'VND 150,000/night' }],
      [{ vi: 'Từ 12 tuổi', en: '12 and above' }, { vi: 'Tính như người lớn — cần phòng riêng', en: 'Charged as an adult — separate room required' }, { vi: 'Đã gồm', en: 'Included' }],
    ],
    note: {
      vi: 'Không xuất trình được giấy khai sinh thì tính tuổi theo chiều cao: dưới 1 m · 1 m – 1,4 m · trên 1,4 m.',
      en: 'Without a birth certificate, age is set by height: under 1 m · 1 – 1.4 m · over 1.4 m.',
    },
  },
  cancel_summary: { vi: 'Huỷ trước từ 7 ngày: phí 50% · dưới 7 ngày: 100% · lễ, Tết: không hoàn', en: 'Cancel 7+ days ahead: 50% fee · under 7 days: 100% · holidays: non-refundable' },
  faq: [
    [{ vi: 'Khi nào khách sạn mở cửa?', en: 'When does the hotel open?' }, { vi: 'Khách sạn khai trương ngày 20/12/2026.', en: 'The hotel opens on 20 December 2026.' }],
    [{ vi: 'Đi từ sân bay tới khách sạn mất bao lâu?', en: 'How long from the airport?' }, { vi: 'Khoảng 35 – 40 phút. Xe đón miễn phí chạy 5 khung giờ mỗi chiều; vui lòng đăng ký trước 24 giờ.', en: 'About 35 – 40 minutes. The free transfer runs at 5 set times each way; please register 24 hours ahead.' }],
    [{ vi: 'Khách sạn có giờ giới nghiêm không?', en: 'Is there a curfew?' }, { vi: 'Không. Khách sạn nằm trên đất liền tại Sunset Town, quý khách ra vào tự do bất kể giờ nào.', en: 'No. The hotel is on the mainland in Sunset Town, so you can come and go at any hour.' }],
    [{ vi: 'Tôi có tự nấu ăn được không?', en: 'Can I cook?' }, { vi: 'Khu bếp ngoài ban công tầng 5 dành cho khách 3 phòng Superior ở tầng 5.', en: 'The balcony kitchen on floor 5 is for guests of the 3 Superior rooms on that floor.' }],
    [{ vi: 'Khách sạn có hồ bơi, bồn tắm không?', en: 'Is there a pool or a bathtub?' }, { vi: 'Không có hồ bơi, bồn tắm, nhà hàng trưa/tối hay bãi biển riêng.', en: 'There is no pool, bathtub, lunch or dinner restaurant, or private beach.' }],
  ],
  cover: null,
  gallery: [],
  hero: [],
  en_review: true,
  pending: [
    'Bếp tầng 5: PDF ghi dành cho khách lưu trú, bảng giá đại lý ghi chỉ phòng 501, 502, 503 — web ghi chỉ 3 phòng tầng 5.',
    'Diện tích: PDF ghi Superior 17 – 19,3 m², Deluxe 19,6 – 21 m²; bảng giá đại lý ghi 20 m², 22 m² — web theo PDF.',
    'Giá bán lẻ: PDF và bảng giá đại lý lệch 200.000 đ mỗi hạng — web không ghi giá, lấy từ Gohost.',
  ],
  rooms: [
    {
      gohost_room_type_id: null,
      slug: 'superior',
      name: { vi: 'Superior', en: 'Superior' },
      size: { vi: '17 – 19,3 m²', en: '17 – 19.3 m²' },
      view: { vi: 'Hướng phố', en: 'City view' },
      features: ROOM_BASICS,
      description: { vi: '6 phòng hướng phố. Riêng 3 phòng ở tầng 5 có ban công và dùng khu bếp ngoài ban công tầng 5.', en: '6 rooms with a city view. The 3 rooms on floor 5 have a balcony and use the balcony kitchen on that floor.' },
      images: [],
    },
    {
      gohost_room_type_id: null,
      slug: 'deluxe',
      name: { vi: 'Deluxe', en: 'Deluxe' },
      size: { vi: '19,6 – 21 m²', en: '19.6 – 21 m²' },
      beds: { vi: '2 giường đơn', en: '2 single beds' },
      features: ROOM_BASICS,
      description: { vi: '6 phòng rộng hơn hạng Superior, bố trí 2 giường đơn.', en: '6 rooms, larger than Superior, with 2 single beds.' },
      images: [],
    },
    {
      gohost_room_type_id: null,
      slug: 'suite',
      name: { vi: 'Suite', en: 'Suite' },
      size: n('27 m²'),
      features: ROOM_BASICS,
      description: { vi: '3 phòng — hạng lớn nhất của khách sạn, không gian rộng rãi.', en: '3 rooms — the largest at the hotel, with plenty of space.' },
      images: [],
    },
  ],
}

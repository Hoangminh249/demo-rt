// Trang tĩnh: liên hệ + 3 trang chính sách (menu "Hỗ trợ" trên header).
// Mức phí huỷ / đổi ngày từng khách sạn KHÔNG chép ở đây — trang huỷ đọc thẳng `policies` của file khách sạn (repo.cancelPolicies).
// draft: true = Rooty soạn nháp 08/10/2026 theo chính sách khách sạn + review §4.6, chờ pháp chế duyệt. Chỗ chưa có nguồn ghi "chờ … xác nhận".
import type { PageContent, PageSlug } from '@/lib/types'

const CONTACT: PageContent = {
  slug: 'lien-he',
  eyebrow: { vi: 'Hỗ trợ', en: 'Support' },
  title: { vi: 'Liên hệ', en: 'Contact us' },
  lead: {
    vi: 'Đặt phòng mới, đổi ngày, huỷ phòng hay cần hoá đơn — chọn kênh tiện nhất, đội ngũ đặt phòng của khách sạn sẽ trả lời quý khách.',
    en: 'New booking, date change, cancellation or an invoice — pick the channel that suits you and the hotel’s reservations team will get back to you.',
  },
  updated: '2026-10-08',
  draft: false,
  sections: [],
}

const CANCEL: PageContent = {
  slug: 'chinh-sach-huy',
  eyebrow: { vi: 'Chính sách', en: 'Policy' },
  title: { vi: 'Chính sách huỷ và hoàn tiền', en: 'Cancellation & refund policy' },
  lead: {
    vi: 'Phí huỷ, cách đổi ngày và cách gửi yêu cầu cho các đặt phòng trực tiếp với khách sạn của Rooty.',
    en: 'Cancellation fees, date changes and how to send a request for bookings made directly with Rooty’s hotels.',
  },
  updated: '2026-10-08',
  draft: false,
  sections: [
    {
      id: 'pham-vi',
      title: { vi: 'Phạm vi áp dụng', en: 'Scope' },
      body: [
        { vi: 'Áp dụng cho đặt phòng trực tiếp tại PITO Hòn Thơm và Calista Phú Quốc qua website, Zalo, hotline hoặc email của Rooty Hospitality.', en: 'Applies to bookings made directly for PITO Hon Thom and Calista Phu Quoc via Rooty Hospitality’s website, Zalo, hotline or email.' },
        { vi: 'Đặt phòng qua đại lý hoặc trang đặt phòng trực tuyến (OTA) theo chính sách của nơi quý khách đã đặt.', en: 'Bookings made through an agent or an online travel agency (OTA) follow the policy of where you booked.' },
      ],
    },
    {
      id: 'muc-phi',
      title: { vi: 'Phí huỷ và đổi ngày theo khách sạn', en: 'Cancellation and date-change fees by hotel' },
      body: [{ vi: 'Phí huỷ tính theo số ngày từ lúc khách sạn nhận được yêu cầu tới ngày nhận phòng.', en: 'The fee depends on the number of days between the hotel receiving your request and the check-in date.' }],
    },
    {
      id: 'gui-yeu-cau',
      title: { vi: 'Cách gửi yêu cầu huỷ hoặc đổi ngày', en: 'How to cancel or change dates' },
      body: [{ vi: 'Yêu cầu huỷ hoặc đổi ngày chỉ có hiệu lực khi gửi bằng email và được khách sạn xác nhận lại bằng email.', en: 'A cancellation or date change only counts when sent by email and confirmed by the hotel by email.' }],
      list: [
        { vi: 'Gửi email tới sales@rootyhospitality.com, ghi mã đặt phòng, họ tên người đặt và ngày ở.', en: 'Email sales@rootyhospitality.com with your booking code, the booker’s name and your dates.' },
        { vi: 'Có thể nhắn Zalo (+84) 915 919 328 để được hướng dẫn nhanh, nhưng vẫn cần gửi email để giữ mốc thời gian.', en: 'You can message Zalo (+84) 915 919 328 for quick help, but still send the email to fix the time of your request.' },
        { vi: 'Khách sạn trả lời kèm phí áp dụng và số tiền hoàn (nếu có).', en: 'The hotel replies with the fee that applies and the refund amount, if any.' },
      ],
    },
    {
      id: 'hoan-tien',
      title: { vi: 'Hoàn tiền', en: 'Refunds' },
      body: [
        { vi: 'Số tiền hoàn bằng số đã thanh toán trừ phí huỷ, chuyển về đúng phương thức quý khách đã dùng (tài khoản ngân hàng hoặc thẻ).', en: 'The refund is the amount paid minus the cancellation fee, returned to the method you paid with (bank account or card).' },
        { vi: 'Thời gian hoàn tiền được ghi trong email xác nhận huỷ của khách sạn (chờ kế toán xác nhận mốc chuẩn).', en: 'The refund time is stated in the hotel’s cancellation email (standard timing pending confirmation by accounting).' },
      ],
    },
  ],
}

const PRIVACY: PageContent = {
  slug: 'chinh-sach-bao-mat',
  eyebrow: { vi: 'Chính sách', en: 'Policy' },
  title: { vi: 'Chính sách bảo mật', en: 'Privacy policy' },
  lead: {
    vi: 'Rooty thu những dữ liệu nào khi quý khách đặt phòng, dùng để làm gì, chia sẻ với ai và quý khách có những quyền gì.',
    en: 'What data Rooty collects when you book, what it is used for, who it is shared with and what rights you have.',
  },
  updated: '2026-10-08',
  draft: true,
  sections: [
    {
      id: 'ben-xu-ly',
      title: { vi: 'Ai chịu trách nhiệm dữ liệu', en: 'Who is responsible for your data' },
      body: [{ vi: 'Công ty Cổ phần Rooty Trip Phú Quốc (MSDN 1702144879) đứng tên website rootyhospitality.com và chịu trách nhiệm xử lý dữ liệu đặt phòng trên website.', en: 'Rooty Trip Phu Quoc Joint Stock Company (business no. 1702144879) owns rootyhospitality.com and is responsible for booking data handled on the website.' }],
    },
    {
      id: 'du-lieu',
      title: { vi: 'Dữ liệu chúng tôi thu', en: 'Data we collect' },
      body: [{ vi: 'Chỉ những gì cần cho đặt phòng và kỳ nghỉ:', en: 'Only what the booking and your stay need:' }],
      list: [
        { vi: 'Họ tên, số điện thoại, email, quốc gia của người đặt.', en: 'The booker’s name, phone number, email and country.' },
        { vi: 'Tên khách nhận phòng, số người, độ tuổi trẻ em (để áp dụng chính sách trẻ em).', en: 'The guest’s name, party size and children’s ages (to apply the children policy).' },
        { vi: 'Giờ đến dự kiến, yêu cầu lưu trú và lời nhắn quý khách tự viết.', en: 'Expected arrival time, stay requests and any message you write.' },
        { vi: 'Website không thu CCCD, hộ chiếu hay ảnh giấy tờ — quý khách xuất trình tại quầy lễ tân khi nhận phòng.', en: 'The website does not collect ID cards, passports or document photos — you show them at reception on arrival.' },
        { vi: 'Số thẻ và thông tin thanh toán do ngân hàng / cổng thanh toán xử lý; Rooty không lưu số thẻ.', en: 'Card numbers and payment details are handled by the bank / payment gateway; Rooty does not store card numbers.' },
      ],
    },
    {
      id: 'muc-dich',
      title: { vi: 'Dùng để làm gì', en: 'How we use it' },
      body: [],
      list: [
        { vi: 'Giữ phòng, xác nhận đặt phòng và gửi thông tin kỳ nghỉ.', en: 'Holding the room, confirming the booking and sending stay information.' },
        { vi: 'Liên hệ khi cần đổi, huỷ hoặc hỗ trợ trong kỳ nghỉ.', en: 'Contacting you about changes, cancellations or help during your stay.' },
        { vi: 'Gửi ưu đãi — chỉ khi quý khách đánh dấu đồng ý nhận, và có thể huỷ nhận bất cứ lúc nào.', en: 'Sending offers — only if you tick the box to receive them, and you can opt out at any time.' },
      ],
    },
    {
      id: 'chia-se',
      title: { vi: 'Chia sẻ với ai', en: 'Who we share it with' },
      body: [{ vi: 'Rooty không bán dữ liệu của quý khách. Dữ liệu chỉ được chia sẻ với bên cần để phục vụ đặt phòng:', en: 'Rooty does not sell your data. It is shared only with parties needed to serve your booking:' }],
      list: [
        { vi: 'Khách sạn và đơn vị vận hành khách sạn (Công ty TNHH Khách sạn Hòn Thơm Phú Quốc).', en: 'The hotel and its operator (Hon Thom Phu Quoc Hotel Co., Ltd.).' },
        { vi: 'Hệ thống quản lý khách sạn và ngân hàng / cổng thanh toán xử lý giao dịch.', en: 'The hotel management system and the bank / payment gateway processing the transaction.' },
        { vi: 'Cơ quan nhà nước khi pháp luật yêu cầu.', en: 'Public authorities when required by law.' },
      ],
    },
    {
      id: 'luu-tru',
      title: { vi: 'Lưu trữ và chuyển dữ liệu ra nước ngoài', en: 'Storage and transfer abroad' },
      body: [
        { vi: 'Một số hệ thống Rooty dùng có máy chủ đặt ngoài Việt Nam (Singapore); việc chuyển dữ liệu này được thực hiện theo quy định về bảo vệ dữ liệu cá nhân.', en: 'Some systems Rooty uses have servers outside Vietnam (Singapore); such transfers follow personal data protection rules.' },
        { vi: 'Thời hạn lưu trữ: chờ pháp chế xác nhận.', en: 'Retention period: pending legal confirmation.' },
      ],
    },
    {
      id: 'quyen',
      title: { vi: 'Quyền của quý khách', en: 'Your rights' },
      body: [{ vi: 'Theo Nghị định 13/2023/NĐ-CP và Luật Bảo vệ dữ liệu cá nhân, quý khách có quyền được biết, đồng ý hoặc rút lại đồng ý, xem, sửa, xoá, hạn chế xử lý dữ liệu của mình. Gửi yêu cầu tới sales@rootyhospitality.com.', en: 'Under Decree 13/2023/ND-CP and the Personal Data Protection Law, you may be informed, give or withdraw consent, and view, correct, delete or restrict the processing of your data. Send requests to sales@rootyhospitality.com.' }],
    },
    {
      id: 'cookie',
      title: { vi: 'Cookie', en: 'Cookies' },
      body: [{ vi: 'Website chỉ dùng cookie cần thiết, ví dụ ghi nhớ ngôn ngữ quý khách chọn.', en: 'The website only uses necessary cookies, such as remembering your language.' }],
    },
  ],
}

const TERMS: PageContent = {
  slug: 'dieu-khoan-dat-phong',
  eyebrow: { vi: 'Chính sách', en: 'Policy' },
  title: { vi: 'Điều khoản đặt phòng', en: 'Booking terms' },
  lead: {
    vi: 'Những điều cần biết trước khi đặt phòng trực tiếp: giá, thanh toán, nhận phòng, khách đi cùng và trách nhiệm của các bên.',
    en: 'What to know before booking directly: prices, payment, check-in, who can stay and each party’s responsibilities.',
  },
  updated: '2026-10-08',
  draft: true,
  sections: [
    {
      id: 'cac-ben',
      title: { vi: 'Các bên', en: 'The parties' },
      body: [{ vi: 'Website rootyhospitality.com do Công ty Cổ phần Rooty Trip Phú Quốc đứng tên. Khách sạn PITO Hòn Thơm và Calista Phú Quốc do Công ty TNHH Khách sạn Hòn Thơm Phú Quốc vận hành.', en: 'rootyhospitality.com is owned by Rooty Trip Phu Quoc Joint Stock Company. PITO Hon Thom and Calista Phu Quoc are operated by Hon Thom Phu Quoc Hotel Co., Ltd.' }],
    },
    {
      id: 'gia',
      title: { vi: 'Giá và xác nhận', en: 'Prices and confirmation' },
      list: [
        { vi: 'Giá tính theo từng đêm, bằng VND, theo giá hiển thị lúc đặt.', en: 'Prices are per night, in VND, as shown when you book.' },
        { vi: 'Đặt phòng chỉ có hiệu lực khi quý khách nhận được email xác nhận có mã đặt phòng.', en: 'A booking is only valid once you receive a confirmation email with a booking code.' },
      ],
      body: [],
    },
    {
      id: 'thanh-toan',
      title: { vi: 'Thanh toán', en: 'Payment' },
      body: [{ vi: 'Quý khách chọn thanh toán đủ 100% hoặc đặt cọc theo tỉ lệ hiển thị khi đặt; phần còn lại thanh toán theo hướng dẫn trong email xác nhận. Tỉ lệ cọc và hạn thanh toán phần còn lại: chờ kế toán chốt.', en: 'You can pay 100% or a deposit at the rate shown when booking; the balance is paid as instructed in the confirmation email. Deposit rate and balance due date: pending confirmation by accounting.' }],
      list: [
        { vi: 'Chuyển khoản qua mã QR (Vietcombank), ghi đúng nội dung là mã đặt phòng.', en: 'Bank transfer by QR code (Vietcombank), using the booking code as the transfer note.' },
        { vi: 'Thẻ ATM nội địa hoặc thẻ quốc tế qua cổng thanh toán OnePay.', en: 'Domestic ATM or international card via the OnePay gateway.' },
      ],
    },
    {
      id: 'nhan-phong',
      title: { vi: 'Nhận phòng, sức chứa và trẻ em', en: 'Check-in, occupancy and children' },
      list: [
        { vi: 'Nhận phòng từ 15:00, trả phòng trước 12:00.', en: 'Check-in from 15:00, check-out before 12:00.' },
        { vi: 'Mỗi phòng tối đa 2 người lớn và 1 trẻ dưới 6 tuổi ngủ chung giường với bố mẹ.', en: 'Each room takes up to 2 adults and 1 child under 6 sharing the parents’ bed.' },
        { vi: 'Trẻ 6 – 11 tuổi phụ thu ăn sáng 150.000 VNĐ/đêm; từ 12 tuổi tính như người lớn.', en: 'Children 6 – 11 pay VND 150,000/night for breakfast; 12 and over count as adults.' },
        { vi: 'Xuất trình CCCD hoặc hộ chiếu khi nhận phòng; trẻ em cần giấy khai sinh.', en: 'Show an ID card or passport at check-in; children need a birth certificate.' },
      ],
      body: [],
    },
    {
      id: 'le-tet',
      title: { vi: 'Lễ, Tết', en: 'Public holidays' },
      body: [{ vi: 'Các dịp lễ, Tết có phụ thu và số đêm tối thiểu; chi tiết từng khách sạn ghi trong mục Chính sách của trang khách sạn.', en: 'Public holidays carry a surcharge and a minimum stay; each hotel’s details are in the Policies section of its page.' }],
    },
    {
      id: 'huy-doi',
      title: { vi: 'Huỷ và đổi ngày', en: 'Cancellations and date changes' },
      body: [{ vi: 'Phí huỷ, cách đổi ngày và hoàn tiền theo Chính sách huỷ và hoàn tiền.', en: 'Cancellation fees, date changes and refunds follow the Cancellation & refund policy.' }],
      link: { href: '/chinh-sach-huy', label: { vi: 'Xem chính sách huỷ và hoàn tiền', en: 'See the cancellation & refund policy' } },
    },
    {
      id: 'trach-nhiem',
      title: { vi: 'Trách nhiệm', en: 'Responsibilities' },
      list: [
        { vi: 'Quý khách cung cấp thông tin đúng và tuân thủ nội quy khách sạn.', en: 'You provide accurate information and follow the hotel rules.' },
        { vi: 'Yêu cầu lưu trú (phòng yên tĩnh, tầng cao, nhận phòng sớm…) được đáp ứng tuỳ tình trạng phòng, không được đảm bảo.', en: 'Stay requests (quiet room, high floor, early check-in…) depend on availability and are not guaranteed.' },
        { vi: 'Cáp treo, tàu và dịch vụ của bên thứ ba vận hành theo quy định của đơn vị đó.', en: 'Cable cars, boats and third-party services run under their operators’ rules.' },
      ],
      body: [],
    },
    {
      id: 'luat',
      title: { vi: 'Luật áp dụng', en: 'Governing law' },
      body: [{ vi: 'Điều khoản này theo pháp luật Việt Nam.', en: 'These terms are governed by Vietnamese law.' }],
    },
  ],
}

export const PAGES: Record<PageSlug, PageContent> = { 'lien-he': CONTACT, 'chinh-sach-huy': CANCEL, 'chinh-sach-bao-mat': PRIVACY, 'dieu-khoan-dat-phong': TERMS }

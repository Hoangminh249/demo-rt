# Tính năng ↔ Gohost API

Nguồn: `gohost-api.md` + Postman collection (07/10/2026). Chưa gọi thử API thật.

## Ký hiệu endpoint

| Mã | Endpoint |
|---|---|
| A | `GET /properties` — khách sạn + hạng phòng + gói giá (kèm `default_rates` T2→CN) |
| B | `GET /properties/search` — KS còn phòng theo ngày, giá TB/đêm |
| C | `GET /properties/{tenant}/room_types` — mọi hạng phòng + tồn (kể cả hết) |
| D | `GET /properties/{tenant}/room_types/search` — hạng phòng còn trống, lọc số khách, giá từng đêm |
| E | `GET /properties/{tenant}/services` — dịch vụ của KS |
| F | `GET /properties/{tenant}/booking-sources` — nguồn booking (direct) |
| G | `GET /properties/{tenant}/payment-methods` — phương thức thanh toán |
| H | `GET /reference/countries · /cities · /cities/{code}/wards` — danh mục địa chỉ |
| I | `GET /properties/{tenant}/bookings` — danh sách booking (theo ngày check-in, ≤30 ngày, ≤50/trang) |
| J | `POST /properties/{tenant}/bookings` — tạo booking |
| K | `POST /bookings/{id}/confirm` — xác nhận booking chờ |
| L | `POST /bookings/{id}/payments` — thêm thanh toán |
| M | `POST /bookings/{id}/cancel` — huỷ booking |
| N | `GET /bookings/{id}` — chi tiết booking (phòng, khách, thanh toán, bữa sáng) |
| O | `POST /bookings/{id}/update` — check-in online: khách, ảnh giấy tờ, dịch vụ, hoá đơn, thanh toán, check-in |

Nhãn: ✅ API làm trọn · 🟡 API làm một phần, Rooty bù · ❌ API không có

## 1. Website — trang chủ & tìm kiếm

| Tính năng | API | Mức | Ghi chú |
|---|---|---|---|
| Danh sách khách sạn, KS nổi bật | A | 🟡 | Tên/hạng phòng từ A; ảnh, mô tả, hạng sao từ CMS Rooty. Cache cả ngày |
| Ô tìm điểm đến / tên KS | A | 🟡 | Khu vực (Bắc đảo, Nam đảo…) do Rooty gắn thêm |
| Tìm KS còn phòng theo ngày | B | ✅ | Tối đa 30 đêm |
| Giá "từ …đ/đêm" trên thẻ KS | B | ✅ | `avg_daily_rate` |
| Lọc theo số người lớn / trẻ em | D | ✅ | Gọi D cho từng KS → tốn quota, cần cache |
| Lọc theo tiện ích (hồ bơi, gần biển…) | — | ❌ | Dữ liệu tiện ích ở CMS Rooty |
| Lịch giá cả tháng | A hoặc C/D | 🟡 | A chỉ có giá mặc định T2→CN; giá thật theo ngày phải gọi D nhiều lần |

## 2. Trang khách sạn & trang phòng

| Tính năng | API | Mức | Ghi chú |
|---|---|---|---|
| Danh sách hạng phòng, sức chứa, số phòng | A / C | ✅ | |
| Phòng còn trống + giá theo ngày đã chọn | D | ✅ | `days_breakdown`, `estimated_total_price` |
| Nhãn "Có ăn sáng" | D | ✅ | `has_breakfast` |
| Nhãn "Chỉ còn X phòng" | D | ✅ | `quantity` |
| Hiện cả phòng đã hết để gợi ý đổi ngày | C | ✅ | |
| Ảnh, mô tả, tiện ích, nhà hàng, gallery | — | ❌ | CMS Rooty |
| Chính sách huỷ, nhận/trả phòng, trẻ em | — | ❌ | CMS Rooty — phải khớp tay với gói giá trên Gohost |
| Gói giá mùa vụ / phái sinh | — | ❌ | API chỉ trả gói giá gốc (direct rate plan) |

## 3. Luồng đặt phòng trên website

| Bước | API | Mức | Ghi chú |
|---|---|---|---|
| Kiểm tra lại phòng & giá ngay trước khi đặt | D | ✅ | Bắt buộc gọi lại ở server, không tin giá từ trình duyệt |
| Form khách: quốc gia, tỉnh, phường | H | ✅ | Cache vĩnh viễn |
| Tạo booking + giữ phòng 16 phút | J | ✅ | `auto_cancel: true`, `payment_collect: "online"`, `source_name` từ F |
| Thanh toán online (VNPay, thẻ…) | — | ❌ | Rooty tự tích hợp cổng thanh toán |
| Ghi nhận đã thanh toán | L (hoặc K) | ✅ | `method` lấy đúng `name` từ G |
| Thanh toán thất bại / quá 16 phút | M | ✅ | Hoặc để auto-cancel tự huỷ |
| Trang xác nhận đặt phòng | N | ✅ | Format response chưa có mẫu — phải test |
| Thêm dịch vụ của KS (ăn tối, spa…) | E → O | 🟡 | Create không nhận dịch vụ; thêm sau qua O (`services`) |
| Thêm xe sân bay, tour Rooty Trip, RIVUS | — | ❌ | Đặt bên TourWell |
| Mã giảm giá / ưu đãi | J | 🟡 | Rooty tự tính, gửi `room_discount` hoặc giá đã giảm trong `days_breakdown` |
| Đặt phòng theo giờ | J | ✅ | `checkin_date = checkout_date` + giờ đến/đi |

## 4. Sau khi đặt — My Booking

| Tính năng | API | Mức | Ghi chú |
|---|---|---|---|
| Tra cứu booking | N | 🟡 | Rooty tự xác thực khách (mã + email/SĐT) |
| Thanh toán phần còn lại | L | ✅ | |
| Huỷ booking | M | 🟡 | Tính tiền hoàn theo chính sách là việc của Rooty |
| Đổi ngày / đổi phòng | — | ❌ | Phải huỷ đặt lại, hoặc lễ tân sửa trong Gohost |
| Tải voucher / xác nhận PDF | N | 🟡 | Mẫu voucher do Rooty làm |

## 5. Check-in online

| Tính năng | API | Mức | Ghi chú |
|---|---|---|---|
| Lấy danh sách phòng & khách của booking | N | ✅ | Lấy `booking_room` id để dùng cho O |
| Khai thông tin từng khách | O (`guests`) | ✅ | `add` hoặc `replace` |
| Chụp CCCD / hộ chiếu | O (`identity_image`) | ✅ | JPEG/PNG ≤5MB, ≤3 ảnh/khách |
| Yêu cầu hoá đơn VAT | O (`invoice`) | ✅ | Cần có khách chính, không thì lỗi 422 |
| Mua thêm dịch vụ | E → O (`services`) | ✅ | Chỉ thêm, không xoá |
| Thanh toán khi check-in | O (`payments`) | ✅ | |
| Bấm check-in | O (`status: checked_in`) | ✅ | Không check-in trước ngày nhận phòng |
| Check-out | — | ❌ | Lễ tân làm trong Gohost |

## 6. Sales nội bộ bán combo có phòng

| Tính năng | API | Mức | Ghi chú |
|---|---|---|---|
| Tìm phòng cho khách | B / D | ✅ | |
| Đặt phòng với giá thoả thuận | J | ✅ | `days_breakdown`, `room_discount` |
| Ghi nguồn & hoa hồng | J | 🟡 | `source_name`, `source_commission` (% hay số tiền: chưa rõ) |
| Ghi tiền cọc | J (`payments`) / L | ✅ | |
| Gộp với tour/xe trong một đơn combo | — | ❌ | Đơn combo nằm ở TourWell, phòng ở Gohost; Rooty giữ liên kết hai mã |

## 7. Agent Portal (đại lý)

| Tính năng | API | Mức | Ghi chú |
|---|---|---|---|
| Đại lý đăng ký, duyệt, đăng nhập | — | ❌ | Rooty tự làm |
| Tìm phòng & xem tồn | B / D | ✅ | |
| Giá đại lý (net rate) | — | ❌ | Rooty giữ bảng giá net, gửi qua `days_breakdown` khi đặt |
| Đặt phòng ghi công nợ | J + G | ✅ | Payment method `debt` |
| Danh sách booking của từng đại lý | I | 🟡 | API không lọc theo đại lý → Rooty lưu mapping booking ↔ đại lý |
| Hạn mức & đối soát công nợ | — | ❌ | Rooty tự làm |
| Voucher | N | 🟡 | Mẫu do Rooty làm |
| Huỷ booking | M | ✅ | |

## 8. Đồng bộ dữ liệu về hệ thống Rooty / TourWell

| Tính năng | API | Mức | Ghi chú |
|---|---|---|---|
| Kéo booking mọi nguồn (web, OTA, lễ tân) | I + N | 🟡 | ≤30 ngày/lần, ≤50/trang, không có webhook → quét định kỳ |
| Phát hiện booking bị huỷ / no-show / sửa | I | 🟡 | Phải quét lại cả khoảng ngày; trễ vài phút–vài chục phút |
| Hồ sơ khách xuyên khách sạn | I / N | 🟡 | Rooty ghép khách theo SĐT/email |
| Đẩy về TourWell | — | ❌ | Rooty tự làm lớp tích hợp |

## 9. Dashboard & báo cáo

| Chỉ số | API | Mức | Ghi chú |
|---|---|---|---|
| Tổng booking, room nights, doanh thu | I / N | 🟡 | Tính từ dữ liệu đã kéo về |
| Tỷ trọng Direct / Agent / OTA | I / N | 🟡 | Dựa trên nguồn booking + mapping của Rooty |
| Tỷ lệ huỷ | I | 🟡 | |
| Occupancy | A + I | 🟡 | Tổng phòng từ A × số đêm; chưa trừ phòng bảo trì → gần đúng |
| ADR | I / N | 🟡 | Doanh thu ÷ room nights |
| Khách quay lại | I / N | 🟡 | Từ CRM của Rooty |

## 10. AI tư vấn đặt phòng

| Tính năng | API | Mức | Ghi chú |
|---|---|---|---|
| Hiểu câu hỏi, gợi ý KS / phòng | B + D + A | 🟡 | Phần AI do Rooty làm; tiện ích, khu vực lấy từ CMS |
| Báo giá & phòng còn | D | ✅ | Tốn quota → cache |
| Đặt phòng từ khung chat | J | ✅ | Đi qua luồng đặt phòng như website |

## 11. Không làm qua API — vẫn làm trong Gohost

Sửa giá · mở/đóng bán · chỉnh tồn phòng · kết nối OTA · xếp phòng cụ thể · check-out · đổi ngày/đổi phòng.

## Ràng buộc áp lên mọi tính năng

60 lượt gọi / 5 phút / API key. Các tính năng dùng **B, D, I** (tìm phòng, AI, đồng bộ) tốn quota nhiều nhất → cần cache phía Rooty và xin Gohost nâng giới hạn trước khi chạy thật.

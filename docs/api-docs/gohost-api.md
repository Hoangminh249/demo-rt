# Gohost PMS Public API

Nguồn: OpenAPI 3.1 nhúng trong https://platform.gohost.vn/docs/api (Stoplight Elements), đọc ngày 05/10/2026.
Toàn bộ nội dung file này **CONFIRMED từ spec**; đã gọi thử bằng key chỉ-đọc ngày 07/10/2026 — xem mục **Gọi thật** ngay dưới (thắng spec khi khác).

## Gọi thật (07/10/2026, key scope properties:read + bookings:read)

CONFIRMED bằng response thật. Chỉ ghi cấu trúc, không ghi dữ liệu khách.

- `GET /properties`: `room_types` là **mảng** (spec ghi object). Key đọc được **2 property đều là PITO**: `PIT` "Pito Hotel" và `PIO` "CÔNG TY TNHH KHÁCH SẠN HÒN THƠM PHÚ QUỐC - PITO HOTEL", cùng 4 hạng (Deluxe cao cấp view biển 4 · Tiêu chuẩn view nội khu 4 · Grand Deluxe Bồn Tắm 4 · Cozy sân thượng, view núi 1 = 13 phòng), mỗi hạng 1 gói "Standard" (`per_room`, giá 7 ngày như nhau). Chưa có Calista.
- `GET /bookings`: `{ success, data[], pagination{ current_page, last_page, per_page, total, … } }`. Mỗi booking: `id` = **mã booking 8 ký tự** (dạng `PIT00199`; không có field `code`), `status`, `payment_status` (`not_pay`…), `amount`, `checkin_date`, `checkout_date`, `rooms_count`, `source_name` (vd `agoda`), `segment`, `payment_collect`, `booked_at`, `customer{ name, phone, email, country, identity, … }`, `booking_rooms[{ room_type (chuỗi), room_unit, nights, has_breakfast, occupancy, days_breakdown }]`, `booking_source{ name, color }`, `payments[]`.
- `GET /bookings/{id}?booking_id={id}`: cùng cấu trúc, thêm `booking_rooms[].guests[]` (tên field của từng khách: chưa thấy vì danh sách rỗng).
- **Booking không tồn tại → HTTP 422** `{ success: false, message: "Không tìm thấy đơn đặt phòng.", errors: { booking_id: [...] } }`.
- Code đọc booking qua danh sách field cho phép (`src/lib/gohost.ts`); không đọc `customer.identity`, giấy tờ, ngày sinh.

## Tổng quan

| Mục | Giá trị |
|---|---|
| Base URL | `https://platform.gohost.vn/pms/api/public/v1` — **chỉ Production, không có sandbox** |
| Auth | `Authorization: Bearer {api_key}:{api_secret}` (tạo ở Admin > Settings > Integrations > Public API Keys) |
| Scope | `properties:read`, `bookings:read`, `bookings:write` |
| Rate limit | **60 request / 5 phút / API key** (~0,2 req/s). "Custom limits available for enterprise partners" |
| Response | `{ "success": true, "data": ... }` |
| Mã lỗi (mô tả) | `AUTH_001..004`, `SCOPE_001`, `RATE_001` — nhưng spec chỉ khai báo HTTP 200 và 422 |
| Hỗ trợ | support@gohost.vn |

## Endpoint (18)

| Method | Path | Ghi chú |
|---|---|---|
| GET | `/properties` | Mọi property của tổ chức, kèm room types (quantity, room_kind, is_virtual, sức chứa) + rate plans (default_rate, min/max_rate, sell_mode, min_stay, max_stay…) |
| GET | `/properties/search?checkin_date&checkout_date` | Property còn phòng: quantity, avg_daily_rate — **tìm trên tất cả khách sạn trong 1 lần gọi** |
| GET | `/properties/{tenant_id}/room_types?checkin_date&checkout_date[&room_type_id]` | Mọi room type, kể cả quantity = 0 |
| GET | `/properties/{tenant_id}/room_types/search?...&occupancy_adults&occupancy_children&occupancy_infant` | Room type còn phòng + rate plan: `has_breakfast`, `days_breakdown`, `estimated_total_price` |
| GET | `/properties/{tenant_id}/services[?category]` | Dịch vụ, id dạng `SV` + 8 hex, giá/đơn vị |
| GET | `/properties/{tenant_id}/booking-sources` | **Chỉ segment direct**, trả `name`, `color` — **không có id** |
| GET | `/properties/{tenant_id}/payment-methods` | `name` |
| GET | `/reference/countries[?lang=vi|en]`, `/reference/cities`, `/reference/cities/{cityCode}/wards` | Danh mục địa chỉ (tỉnh/phường chỉ VN) |
| GET | `/properties/{tenant_id}/bookings?start_date&end_date[&status&per_page&page]` | Lọc theo **ngày check-in** trong khoảng; status: new, confirmed, in_progress, finished, no_show… |
| POST | `/properties/{tenant_id}/bookings` | Tạo booking — tạo thẳng trạng thái **confirmed** |
| POST | `/properties/{tenant_id}/bookings/{booking_id}/confirm` | Xác nhận booking "pending" (+ payments) |
| POST | `/properties/{tenant_id}/bookings/{booking_id}/payments` | Thêm thanh toán, không đổi trạng thái |
| POST | `/properties/{tenant_id}/bookings/{booking_id}/cancel` | Huỷ booking + mọi phòng; payment chưa trả bị huỷ |
| GET | `/properties/{tenant_id}/bookings/{booking_id}` | Chi tiết: phòng, khách, bữa ăn, `payment_collect`, `source_reservation_code`, `identity_image_urls` |
| POST | `/properties/{tenant_id}/bookings/{booking_id}/update` | **multipart/form-data** — online check-in: khách (add/replace), ảnh CCCD/hộ chiếu (≤3), dịch vụ (chỉ add), hoá đơn VAT, payments (add/replace), `status: checked_in` |

### Body tạo booking (rút gọn)
- Bắt buộc: `checkin_date`, `checkout_date`, `source_name` (chuỗi), `customer.name` (≤50 ký tự), `booking_rooms[].room_type_id`.
- Tuỳ chọn: `currency`, `arrival_hour`, `departure_hour`, `source_commission` (integer — % hay số tiền: UNKNOWN), `notes`, `payment_collect` (`property|ota|online|""`), occupancy, **`auto_cancel`** (thời hạn: UNKNOWN), `rate_plan_id`, **`default_rate`, `room_discount`, `days_breakdown[{day, price}]`** (giá do client gửi), `payments[]`.
- Customer: phone, email, birthday, gender, company, address, city, country, identity, id_type (identity_card/passport/other), ward…

## Hạn chế ảnh hưởng thiết kế

1. **Rate limit rất thấp** — 60 req/5 phút cho *mọi* lời gọi của một key (web search + tạo booking + đồng bộ + dashboard).
2. **Không webhook**, không filter `updated_since` → muốn bắt booking OTA/lễ tân mới hoặc bị sửa/huỷ phải **quét lại theo khoảng ngày check-in**.
3. **Không idempotency key** → retry tạo booking có thể tạo trùng.
4. **Không có trường external ID** cho khách/booking → bảng ánh xạ (Gohost booking code ↔ mã Rooty) phải nằm phía Rooty.
5. **Không có bước giữ phòng (hold)**; chỉ có `auto_cancel`. Booking qua API có trừ tồn trên OTA ngay không: UNKNOWN.
6. **Giá do client gửi** → bắt buộc tính lại giá ở server, không để giá đi từ trình duyệt.
7. **Không có**: ảnh, mô tả, tiện ích, **chính sách huỷ**, thuế/phí, **giá đại lý / net rate**, khái niệm đại lý có id, báo cáo (occupancy, ADR), quản lý giá/tồn (chỉ đọc), đổi ngày / đổi phòng, check-out.
8. Response của create/confirm/cancel/payments/update **không có schema**; không có example; không có 401/403/404/429/5xx trong spec.
9. Spec có mâu thuẫn: create tạo `confirmed` nhưng `/confirm` dành cho `pending`; `payment_collect` enum khác nhau giữa request và response; `booking_id` lặp ở path và body; `birthday` lúc `date` lúc `date-time`; `paid_at` ví dụ không theo ISO 8601.
10. **Dữ liệu cá nhân nhạy cảm** (CCCD, ảnh giấy tờ, `identity_image_urls`) → Nghị định 13/2023; URL ảnh có ký/hết hạn không: UNKNOWN.
11. Spec có dấu hiệu sinh tự động từ code Laravel (lộ tên class nội bộ) → hợp đồng API có thể đổi theo code; **không có changelog/versioning policy**.

## Hệ quả kiến trúc (INFERRED)

- **Không gắn website/app thẳng vào Gohost.** Cần backend của Rooty ở giữa: giữ secret, cache tìm phòng, rate limiter dùng chung, tính lại giá, điều phối thanh toán, bảng ánh xạ ID, đồng bộ về TourWell/kho dữ liệu.
- Gohost hợp vai **nguồn sự thật cho phòng, giá, tồn, OTA**. Nội dung (ảnh, mô tả, chính sách), giá đại lý, CRM, báo cáo gộp **phải do Rooty sở hữu** ở nơi khác.

## Bổ sung từ Postman collection Gohost gửi (07/10/2026)

File: `docs/resource/GoHost-PMS-Public-API.postman_collection.json` — cùng 15 request / 18 endpoint như spec, nhưng mô tả chi tiết hơn. Điểm MỚI hoặc LÀM RÕ (CONFIRMED theo mô tả, chưa gọi thử):

- **`auto_cancel`**: mặc định `true`; nếu không gửi payment, booking **tự huỷ sau 16 phút** nếu vẫn "unconfirmed". → Đây chính là cơ chế giữ phòng cho luồng thanh toán online.
  - Mâu thuẫn còn nguyên: mô tả create nói booking tạo ra ở trạng thái `confirmed`, nhưng auto-cancel lại áp dụng cho booking "unconfirmed". Booking không kèm payment thực tế ở trạng thái gì: **UNKNOWN — phải test**.
- **Giới hạn khoảng ngày 30 ngày** cho: search properties, room types, list bookings. `per_page` tối đa 50.
- Status booking đầy đủ: `new | confirmed | in_progress | finished | no_show | cancelled | merged` (merged = gộp vào đơn đoàn).
- Add payment vào booking đã `merged` → tự chuyển sang **booking master**; response trả về booking master (id khác id gửi lên).
- Tồn phòng tính từ: booking confirmed + checked-in, lịch bảo trì, phòng out-of-order. Không nhắc booking `new` → có giữ tồn trong 16 phút chờ thanh toán không: **UNKNOWN**. Có kiểm tra tồn khi tạo booking và từ chối nếu trùng.
- Giá: chỉ **direct rate plans** (không trả rate plan derived/seasonal); `days_breakdown` ưu tiên dữ liệu restrictions rồi mới tới `default_rates`; `default_rates` = mảng 7 giá theo thứ (T2 → CN).
- **Đặt phòng theo giờ**: `checkin_date = checkout_date` + `arrival_hour`, `departure_hour`.
- Phương thức thanh toán: cash, bank_transfer, **debt** (công nợ — dùng được cho đại lý), atm_transfer, credit_card, apple_pay, pos, wechat_pay…; khi tạo booking/payment phải dùng đúng `name` từ `/payment-methods`.
- `customer.country` dùng ISO 3166-1 alpha-2 (`VN`); city/ward lưu **tên** chứ không lưu mã.
- Cache phía Gohost: booking-sources, payment-methods, services 10 phút; reference vĩnh viễn → nên cache phía mình tương ứng, không tốn rate limit.
- Online check-in: không check-in trước ngày nhận phòng; ảnh giấy tờ JPEG/PNG ≤ 5MB, ≤ 3 ảnh; hoá đơn VAT lưu vào khách chính.

Lỗi / thiếu trong collection:
- **Không có response mẫu nào** (`response: []`) → vẫn chưa biết format trả về của create/confirm/cancel/payments.
- Không có file environment, không có test script, không có request mẫu cho lỗi (401/422/429).
- Body mẫu có `discount_reason` và `rate_plan_id` nhưng phần mô tả field không liệt kê.
- Search room type: URL dùng `occupancy_adults/children/infant`, mô tả lại ghi `occ_adults/occ_children/occ_infant`.
- Get booking detail vẫn khai `booking_id` cả ở path lẫn query.
- Vẫn **không có**: webhook, filter `updated_since`, idempotency key, external ID, sandbox, giá đại lý, chính sách huỷ, báo cáo.

## Câu hỏi cần hỏi Gohost
1. Có booking engine / widget đặt phòng + thanh toán sẵn không? Chi phí, khả năng tuỳ biến, SEO?
2. Rate limit cho đối tác booking engine được nâng tới bao nhiêu? Có sandbox không?
3. `auto_cancel` hết hạn sau bao lâu? Booking qua API có trừ tồn trên OTA/channel manager ngay không?
4. Có webhook hoặc filter `updated_since` trên lộ trình không?
5. Chính sách huỷ, thuế/phí, giá đại lý, báo cáo occupancy/ADR có lấy được qua API không?
6. Có hỗ trợ trường external reference cho booking/khách không?
7. Quyền xuất toàn bộ dữ liệu khi ngừng dùng dịch vụ?

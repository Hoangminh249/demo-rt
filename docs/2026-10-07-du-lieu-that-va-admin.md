# Dữ liệu thật cho pre-production + Admin chỉ-xem

Ngày 07/10/2026. Nguồn: thư mục Drive "4. ROOTY HOSPITALITY" (đọc toàn bộ, kể cả ảnh), `docs/api-docs/`, spec OpenAPI Gohost (platform.gohost.vn/docs/api, đọc 07/10), footer rootytrip.com.
Nhãn: **CONFIRMED** (đọc thấy) · **INFERRED** (suy luận) · **UNKNOWN** (chưa kiểm).

## 1. Đã chốt

| # | Quyết định | Vì sao |
|---|---|---|
| 1 | Nội dung KS + ánh xạ ID Gohost nằm trong `src/content/*.ts` (sửa bằng commit). Admin **chỉ xem**, không database | 2 KS, ít thay đổi; tránh thêm hệ thống. Đổi sang CMS sau chỉ thay `src/api/hotel.ts`, `src/api/site.ts` |
| 2 | Calista hiện khung "Ảnh đang cập nhật" | Chưa có ảnh chụp thật; phối cảnh 3D có thể khác thực tế |
| 3 | Admin: vẽ wireframe 2–3 phương án, chọn rồi mới dựng | Quy trình thiết kế |
| 4 | Tài liệu mâu thuẫn → lên web bản **ít hứa hơn**, gửi KS xác nhận (mục 3) | Tránh khiếu nại vì hứa sai |
| 5 | Chỉ dùng GET của Gohost. Không booking, thanh toán, ghi dữ liệu | Yêu cầu đợt này; Gohost không có sandbox |
| 6 | Nút "Đặt phòng" → "Liên hệ đặt phòng" (Zalo/hotline/email của KS) | Đúng quy trình đặt phòng trong tài liệu KS: gửi yêu cầu qua email/Zalo |

## 2. Kho dữ liệu

| Tệp (Drive) | Nội dung | Lên web? |
|---|---|---|
| PITO · `2-Thông-tin-lưu-trú-PITO-Hòn-Thơm.pdf` (+ bản EN, RU) | Bản gửi khách 4 trang: tổng quan, hạng phòng + giá niêm yết, đi lại (cáp treo, xe), quy định, trẻ em, huỷ, liên hệ | **Có** (VI, EN). Không lấy số tiền giá phòng. RU để dành |
| PITO · `HÌNH ẢNH/` | 98 ảnh thật: mặt tiền (2), sảnh/lễ tân (8), 13 thư mục phòng (4–9 ảnh/phòng), terrace (3), logo PITO, ảnh bảng giờ xe | **Có**: 24 ảnh (danh sách + ID trong `scripts/fetch-photos.ts`) |
| PITO · `1-Bảng-giá-đại-lý-PITO-Hòn-Thơm.xlsx` | Giá đại lý, biên lợi nhuận đại lý, phụ thu, MST, tài khoản ngân hàng, số phòng theo hạng | **Không** (nội bộ) |
| PITO · `3-SỐ TAY VẬN HÀNH PITO` → sotay-pito.netlify.app | 18 tình huống lễ tân, ghi "Tài liệu nội bộ — không gửi khách hàng hoặc đại lý" | **Không**. Chỉ dùng kiểm sự thật |
| Calista · `2-Thông-tin-lưu-trú-CALISTA.pdf` | Bản gửi khách (chỉ VI): 15 phòng, Sunset Town, khai trương 20/12/2026, thư viện ảnh "đang cập nhật" | **Có** (VI; bản EN do Claude dịch — **Marketing duyệt**) |
| Calista · `1-Bảng-giá-đại-lý-CALISTA.xlsx` | Giá đại lý, ưu đãi khai trương, xe điện nội khu | **Không** (nội bộ) |
| Calista · `1.GEMS-BẢN VẼ LAYOUT_M128…pdf`, `2.GEMS-BẢN VẼ PHỐI CẢNH…pdf` | Bản vẽ định hướng thiết kế (có tên chủ đầu tư), phối cảnh 3D phòng mẫu | **Không** |

Thông tin chung (CONFIRMED, PDF): cả hai KS do **Công ty TNHH Khách sạn Hòn Thơm Phú Quốc** vận hành; đặt phòng qua **Zalo/hotline (+84) 915 919 328**, **sales@rootyhospitality.com**. Số 0886 068 886, 0339 06 2222, sales@rootytrip.com là kênh **tour** của Rooty Trip (CONFIRMED, footer rootytrip.com) — bỏ khỏi web khách sạn.

## 3. Mâu thuẫn cần KS xác nhận

| # | Điểm | Nguồn A | Nguồn B | Web đang ghi |
|---|---|---|---|---|
| 1 | Cáp treo đêm PITO | PDF khách: T2–T6 21:30, T7 21:00, đăng ký trước 16:00 | Sổ tay: "HIỆN KHÔNG CÓ CÁP ĐÊM… dự kiến từ 01/11, chưa hứa với khách" | Cáp 09:30–17:00; cáp đêm dự kiến từ 01/11/2026, liên hệ KS xác nhận |
| 2 | Bếp Calista | PDF: bếp ngoài ban công tầng 5 cho khách lưu trú | Bảng đại lý: "DÀNH RIÊNG cho khách phòng 501, 502, 503" | Tiện ích của 3 phòng Superior tầng 5 |
| 3 | Diện tích Calista | PDF: Superior 17–19,3 m², Deluxe 19,6–21 m² | Bảng đại lý: 20 m², 22 m² | Theo PDF |
| 4 | Giá bán lẻ Calista | PDF: 1,2 / 1,3 / 1,6 triệu (thấp điểm) | Bảng đại lý: 1,0 / 1,1 / 1,4 triệu | Không ghi giá trong nội dung — giá lấy từ Gohost |
| 5 | Diện tích Superior PITO | PDF VI: 19–22 m² | PDF EN: 20 m² | 19–22 m² |
| 6 | Xe riêng giờ tự chọn (ở ≥2 đêm hoặc ≥3 đêm phòng) | PDF Calista, bảng đại lý PITO | PDF khách PITO không nhắc | Chỉ ghi cho Calista |
| 7 | Phòng 101 và 601 PITO | PDF: thuộc Deluxe Bathtub (27 m²) | Bảng đại lý + sổ tay: 20 m² | Ghi 20 m² + lưu ý bắt buộc (101 không cửa sổ; 601 tầng 6, thang máy tới tầng 5) |

## 4. Gohost — GET nào dùng

Tên field theo spec OpenAPI (CONFIRMED khi đọc spec, **chưa gọi thử**).

| Endpoint | Dùng ở | Cache |
|---|---|---|
| `GET /properties` | "Giá từ" (min `default_rates`), số phòng (`quantity`), sức chứa (`occ_adults/children/infants`), ánh xạ ID | 1 giờ |
| `GET /properties/{t}/room_types?checkin_date&checkout_date` | Khối "Chọn phòng": còn bao nhiêu phòng, gói giá (`title`, `has_breakfast`, `days_breakdown`, `estimated_total_price`); admin "Giá & phòng trống" | 3 phút theo (KS, ngày) |
| `GET /properties/{t}/bookings`, `/bookings/{id}` | Admin Booking (chỉ xem; bỏ `identity`, `identity_image_urls`) | Không cache |
| `/room_types/search`, `/properties/search`, `/services`, `/payment-methods`, `/booking-sources`, `/reference/*` | Chưa dùng | — |
| Mọi POST (tạo, xác nhận, thanh toán, huỷ, check-in) | **Không** | — |

Khoá chỉ-đọc hai lớp: key Gohost chỉ cấp scope `properties:read` + `bookings:read`; code chỉ có hàm `get()`.

## 5. Câu hỏi

**Khách sạn (Hòn Thơm Phú Quốc):** 7 mâu thuẫn ở mục 3 · Hạng sao (nếu có)? · Giờ hỗ trợ của hotline (+84) 915 919 328? · Ảnh chụp Calista khi nào có? · PITO có xe riêng theo giờ tự chọn như Calista không?

**Gohost:** Calista đã có property chưa? · Phòng 101/601 là hạng phòng riêng hay gói giá? · `days_breakdown` có gồm phụ thu lễ Tết không (kiểm đêm 24/12)? · Giá có đổi theo số khách không? · Tên gói giá có bản tiếng Anh không? · Response lỗi (401/429) trông thế nào? · Danh sách booking trả field gì (spec để trống)?

**Lãnh đạo / Marketing:** Logo Rooty Hospitality? · Pháp nhân đứng tên website (đang ghi Công ty CP Rooty Trip Phú Quốc)? · Trang pháp lý (bảo mật, điều khoản, huỷ/hoàn) trước go-live? · Duyệt bản EN của Calista và phần hỏi đáp soạn từ PDF.

# Luồng đặt phòng minh hoạ + trang chi tiết phòng + 4 trang tĩnh (08/10/2026)

Hành trình mục tiêu: xem KS → danh sách phòng → **chi tiết phòng** → **đặt phòng (cọc hoặc trả đủ)** → email. Đợt này dựng giao diện đến bước "thành công"; phần ghi (booking, thanh toán, email) **chưa có thật**.

## Đã có

| Route | Việc | Dữ liệu |
|---|---|---|
| `/hotel/[slug]/[room]` | Ảnh, thông số, gói giá, thẻ đặt phòng (ngày, khách, giá từng đêm, tổng), trước khi đặt, phòng khác | GET Gohost thật qua `/api/hotels/{slug}/rooms` |
| `/dat-phong` | Thông tin khách & yêu cầu lưu trú | sessionStorage (`src/components/booking/draft.ts`) |
| `/dat-phong/thanh-toan` | Cọc 30% / trả đủ · QR Vietcombank / thẻ OnePay | **Mock**: QR vẽ giả, số TK minh hoạ |
| `/dat-phong/xac-nhan` | Thành công: mã đặt phòng, thanh toán, việc tiếp theo | sessionStorage |
| `/lien-he`, `/chinh-sach-huy`, `/dieu-khoan-dat-phong`, `/chinh-sach-bao-mat` | Menu "Hỗ trợ" trên header | `src/content/pages.ts`; phí huỷ đọc từ file KS |

- Lựa chọn (KS, phòng, gói, ngày, khách) nằm trên URL. Thông tin cá nhân **không** lên URL.
- Mỗi bước tính lại giá từ Gohost, không tin số của bước trước.
- Trang thanh toán và trang thành công có dòng "Bản minh hoạ — chưa nhận đặt phòng/thanh toán thật" để khách thật không tưởng đã đặt xong.

## Mặc định đã chọn — cần người xác nhận

| Mục | Đang để | Ai chốt |
|---|---|---|
| Tỉ lệ cọc | 30% (`DEPOSIT_RATE`, `src/lib/booking.ts`), hạn trả phần còn lại chưa có | Kế toán. Nội dung KS hiện ghi "trả trước 100%" |
| Thời gian hoàn tiền | "ghi trong email xác nhận huỷ" | Kế toán |
| Chính sách bảo mật, Điều khoản | Bản nháp, có nhãn "chờ pháp chế duyệt" | Pháp chế (thời hạn lưu dữ liệu còn trống) |
| Giờ làm việc | Không ghi (chưa có nguồn) | KS |
| Kênh liên hệ | `SITE`: (+84) 915 919 328, sales@rootyhospitality.com. **Không** dùng 0886 068 886 / @rootytrip.com như Figma | — |
| Đón sân bay miễn phí (Figma) | Bỏ, vì chưa xác nhận (mâu thuẫn #6) | KS |

## Để chạy thật (chưa làm)

1. Gohost cấp **property test** và nâng rate limit (CLAUDE.md, câu hỏi mở).
2. Server: tạo booking `POST /bookings` ở trạng thái HELD, ghi mã `RH-…` vào `notes`. Dữ liệu từ `GuestDraft` (field đã đặt theo Gohost; tuổi trẻ em ghi vào `notes`).
3. Thanh toán:
   - **VietQR:** QR động theo số tiền + nội dung = mã đặt phòng, đối soát qua webhook ngân hàng / VCB.
   - **OnePay:** redirect, IPN có checksum, kiểm số tiền, chống replay. Quá 15 phút chưa trả thì huỷ booking HELD.
4. Email xác nhận + link tra cứu có chữ ký. Thông báo nhóm KS.
5. Bỏ nhãn "minh hoạ", bỏ QR giả (`MockQr` trong `src/components/booking/payment.tsx`).

## Ghi chú Gohost

- Ngày 09–11/10/2026 mọi hạng phòng PITO hết phòng (dữ liệu thật). Thử luồng với 20–22/10.
- Gohost khai sức chứa 2 NL + 0 TE, nên chọn trẻ em là báo "không đủ chỗ". Đây là lỗi cấu hình đã ghi ở CLAUDE.md; web không tự bù.

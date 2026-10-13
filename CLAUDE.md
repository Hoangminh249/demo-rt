@AGENTS.md

# Rooty Hospitality — rootyhospitality.com

Bạn là **Tech Lead + Product Strategist** của CÔNG TY CỔ PHẦN ROOTY TRIP PHÚ QUỐC. Trả lời **tiếng Việt**, thẳng, có quan điểm; nhiều phương án thì chọn một và nói vì sao.

## Dự án là gì (chốt 13/10/2026)

Website đặt phòng trực tiếp cho các khách sạn của Rooty (PITO Hòn Thơm, Calista — mỗi KS một trang `/hotel/[slug]`). **Web hoạt động độc lập**: giá, phòng trống, booking, thanh toán đều nằm trong Postgres của web. Gohost hay TourWell dừng thì web vẫn bán được.

| Hệ thống | Vai trò | Web dùng thế nào |
|---|---|---|
| **Web Rooty** (repo này, Postgres) | Nơi gốc của: nội dung KS, giá theo ngày, tồn phòng **bán trên web**, gói giá, khuyến mãi, booking web, thanh toán, email | Admin `/admin` sửa mọi thứ |
| **Gohost** (PMS mua ngoài) | Bán OTA (Agoda, Booking.com…), channel manager của khách sạn | **Tuỳ chọn.** Chỉ GET: đối chiếu ID hạng phòng (admin → Cài đặt → Kết nối Gohost), `yarn db:import-gohost` nhập giá ban đầu. Web không đọc phòng trống từ Gohost |
| **TourWell** (phần mềm của cả công ty) | Ghi nhận mọi đơn hàng / giao dịch cho **kế toán** — toàn công ty dùng, không riêng hospitality | **Mỗi booking web đã thanh toán phải ghi sang TourWell.** Chưa có code; API tạo đơn: UNKNOWN (docs `docs-api.tourwell.vn`, rate limit 60 req/phút — `docs/boi-canh.md`) |

Không tự xây: channel manager, CRM, kế toán, agent portal, loyalty. Web và OTA chia phòng **bằng tay** (allotment web trong DB; email báo team "đóng phòng trên Gohost") — rủi ro overbooking, xem `docs/2026-10-12-booking-engine-db-phase0.md` §3.

## Luồng chính

- **Khách:** trang KS → chọn ngày/khách (bấm **Áp dụng** mới tải giá) → "Đặt ngay" → `/dat-phong` (bắt đăng nhập) → giữ phòng 15' → `/dat-phong/thanh-toan` → cổng → webhook → `/dat-phong/xac-nhan` → email xác nhận. Khách xem/huỷ đơn ở `/don-cua-toi`.
- **Đăng nhập:** Auth.js (`src/auth.ts`) — **email + mã 6 số** (chính) hoặc Google (khi có OAuth). Một modal dùng chung web + admin (`src/components/auth/login.tsx`). Role `User.role`: CUSTOMER · STAFF · ADMIN (đổi bằng SQL). `ADMIN_USER`/`ADMIN_PASSWORD` là cửa dự phòng, luôn ADMIN.
- **Admin `/admin`** (vào thẳng `/admin/orders`): Đặt phòng web (xem, nhận/trả phòng, thu tiền quầy, huỷ, hoàn tiền, gửi lại email) · Khách sạn (lịch giá & tồn, hạng phòng, gói giá, nội dung, ảnh, chính sách huỷ, cài đặt) · Thêm KS · Khuyến mãi · Tiện ích · Người dùng. ADMIN mọi thứ; STAFF chỉ Đặt phòng web. Mọi lệnh ghi qua zod + transaction + AuditLog; kiểm quyền ở layout + từng route (`src/lib/admin-actor.ts`, `src/app/api/admin/_lib.ts`).

## Thanh toán — bản đồ để làm tiếp

Đã chốt (anh Minh 12/10/2026): **trả đủ, không đặt cọc**; chỉ 2 hình thức **chuyển khoản ngân hàng** và **OnePay**; xác nhận xong → email cho khách + email team KS (`Hotel.notifyEmail`). Hiện **cả hai đi qua cổng giả lập** (`PAYMENT_PROVIDER=mock`), cổng thật chưa tích hợp.

| Việc | Ở đâu |
|---|---|
| Interface cổng + giả lập ký HMAC | `src/lib/payment.ts` — `PaymentProvider { checkoutUrl, parseWebhook }`, `MOCKS`, `REAL = {}` (thêm cổng thật vào đây) |
| Phương thức hợp lệ, zod request | `src/lib/booking-requests.ts` (`PAY_METHODS = ['bank', 'onepay']`) |
| Giữ phòng / tạo payment / xác nhận / hết hạn / huỷ | `src/lib/booking-engine.ts` — `createHold`, `startPayment`, **`handleWebhook` = nơi DUY NHẤT xác nhận booking** (idempotent theo event, số tiền phải khớp), `expireDue`, `cancelBooking` |
| Bọc phía server (chủ booking, email sau commit) | `src/api/booking.ts` |
| Route | `POST /api/bookings/[code]/pay` → URL cổng · `POST /api/payments/[provider]/webhook` · `/api/cron/expire-holds` (Bearer `CRON_SECRET`) |
| Cổng giả lập (xoá khi có cổng thật) | `src/app/[locale]/(site)/thanh-toan-gia-lap/page.tsx`, `src/app/api/payments/mock/simulate/route.ts` |
| UI | `src/components/booking/live-payment.tsx` (chọn phương thức), `live-result.tsx` (trang kết quả hỏi lại mỗi 2 giây) |
| Email | `src/lib/email.ts` (Nodemailer SMTP, mỗi (booking, mẫu) gửi một lần), mẫu ở `src/emails/` |
| Bảng | `Booking` (status, paymentStatus, holdExpiresAt…), `Payment` (provider, providerRef unique, rawPayload), `PaymentWebhookEvent` (chống trùng), `Refund` (xử lý tay), `EmailLog` |

Chưa có / cần hỏi: chuyển khoản ngân hàng xác nhận bằng gì (VietQR + đối soát sao kê? admin bấm tay?) — admin hiện **không** xác nhận tay được booking PENDING_PAYMENT · đẩy đơn sang TourWell lúc nào (sau webhook CONFIRMED?) và bằng API nào · OnePay: cần merchant + secret, URL IPN.

## Code

- **yarn**, không npm. `yarn build` là bước kiểm type; `yarn test` kiểm logic thuần; `yarn check:quote`, `yarn check:booking` (DB thật, chặn khi không phải localhost).
- **`src/api/`**: mỗi file một object (`hotelApi`, `catalogApi`, `inventoryApi`, `bookingApi`, `bookingAdminApi`, `pricingApi`, `catalogAdminApi`, `adminApi`, `gohostApi`, `siteApi`), chỉ server. Kiểu dùng lại ở `src/types/`; kiểu response `/api/admin/*` ở `src/types/admin.ts`.
- Component **không import `src/content`, `src/lib/gohost`, `src/api` hay `src/lib/booking-engine`** — trang server đọc qua `src/api`; component client gọi hook trong `src/hooks` (TanStack Query, axios `src/lib/http.ts`). Giá luôn tính lại ở server.
- Nút gọi API phải có trạng thái chờ: `Button loading` (`src/components/ui/button.tsx`, admin) · `Spin` / `LinkSpin` (`src/components/site/spin.tsx`, web). Ô ngày/khách sửa trên bản nháp, có nút Áp dụng (`StayForm` trong `src/components/site/stay-fields.tsx`).
- `src/content/*.ts`: nội dung gốc 2 KS — nguồn `prisma/seed.ts` và bản dự phòng lúc `next build` (`db()` chặn truy vấn khi build); `SITE`/`PAGES` (liên hệ, 4 trang tĩnh) chưa có trong DB nên vẫn đọc từ đây.
- Không dùng `createNextIntlPlugin` (bẫy `@swc/core` trên máy này) — xem `next.config.ts`.

**DB:** Render Postgres `crm_pl30` (Singapore, dùng chung với CRM/B2B) — web ở schema riêng **`hospitality`** (`DATABASE_URL` có `&schema=hospitality`), không đụng schema khác. Máy dev trỏ thẳng DB này. Dựng/migrate: `docs/db-setup.md`. Deploy Render: `README.md`.

## Tài liệu

```
README.md                                  chạy, biến môi trường, deploy Render, kiến trúc mã
docs/boi-canh.md                           công ty, hệ thống, chiến lược 2026–2036 (PDF thắng khi khác)
docs/2026-10-12-booking-engine-db-phase0.md quyết định web tự chủ: schema, chia tồn web/OTA, từng phase đã làm
docs/db-setup.md                           Postgres: tạo, migrate, seed, role, sao lưu
docs/2026-10-07-du-lieu-that-va-admin.md   dữ liệu thật từ Drive + 7 mâu thuẫn chờ KS xác nhận
docs/api-docs/gohost-api.md                Gohost Public API (chỉ đọc)
docs/resource/                             PDF chiến lược, PDF đề xuất v4, Postman Gohost
```

## Câu hỏi mở — hỏi, đừng đoán

- Tích hợp TourWell: endpoint tạo đơn/khách, thời điểm đẩy, mã đối soát.
- Cổng thật: ngân hàng (VietQR/đối soát) và OnePay — thông tin merchant.
- Chia tồn phòng giữa web và OTA (doc 12/10 §3) — chờ anh Minh chốt.
- KS xác nhận: ánh xạ hạng phòng PITO ↔ Gohost, 7 mâu thuẫn dữ liệu. Calista chưa có ảnh chụp, khai trương 20/12/2026.
- `/hotel/{slug}` khác `/{slug}` trong chiến lược (D1) — chờ lãnh đạo duyệt. Đổi nguyên tắc 3 PDF ("tồn phòng chỉ ở Gohost") — **cần CEO biết**.

## Nguyên tắc

1. **Đọc trước khi nói.** Kết luận gắn nhãn **CONFIRMED** · **INFERRED** · **UNKNOWN**.
2. Không tự nghĩ ra tính năng Gohost/TourWell — chỉ dùng `docs/` hoặc docs chính thức.
3. Không đổi nguyên tắc chiến lược đã chốt (`docs/boi-canh.md` §"Đổi được vs không đổi được"); thấy nên đổi → đề xuất kèm lý do.
4. Ít hệ thống, ít nơi nhập liệu. Muốn tự xây phải trả lời: *vì sao không dùng thứ đã có?*
5. Phân tích mới ghi vào `docs/YYYY-MM-DD-<chu-de>.md`.

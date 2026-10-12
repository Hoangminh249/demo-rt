# Rooty Hospitality — rootyhospitality.com

Website chung cho các khách sạn của Rooty (giao diện theo **rootytrip.com**), có đặt phòng trực tuyến và trang quản trị.
Gohost vẫn bán OTA (Agoda, Booking.com…); web tự quản giá theo ngày, số phòng bán web, sản phẩm, booking, thanh toán — Gohost dừng thì web vẫn chạy.

## Hai chế độ (`DATA_SOURCE`)

| | `db` (Postgres của Rooty) | `gohost` / bỏ trống (bản cũ) |
|---|---|---|
| Nội dung khách sạn | Postgres — admin sửa | File `src/content/*.ts` |
| Giá, phòng trống | Lịch giá + tồn web trong Postgres (admin sửa) | GET Gohost |
| Đặt phòng | **Thật**: đăng nhập → giữ phòng 15' → trả đủ (chuyển khoản ngân hàng / OnePay — hiện qua cổng giả lập) → webhook → email | Bản minh hoạ chạy ở trình duyệt |
| Admin | Sửa sản phẩm, lịch giá, booking web | Chỉ xem (Gohost) |

## Trang

| Trang | Nội dung |
|---|---|
| `/`, `/hotel/[slug]` | Trang chủ, trang khách sạn (lịch chọn ngày có giá từng đêm; thẻ phòng hiện tổng cả kỳ ở + "Chi tiết giá" từng đêm) · tiếng Anh: `/en/…` |
| `/dat-phong` → `/thanh-toan?code=` → `/xac-nhan?code=` | Đặt phòng: đăng nhập (modal), mã KM + báo giá server, giữ phòng, trả đủ qua ngân hàng / OnePay (không đặt cọc), cổng, kết quả (hỏi lại mỗi 2 giây) |
| `/don-cua-toi`, `/don-cua-toi/[mã]` | Đơn của tôi (Sắp tới · Đã ở · Đã huỷ) và chi tiết đơn: tiến trình, giá từng đêm đã chốt, thanh toán, khách tự huỷ (phí theo chính sách lúc đặt, tiền hoàn chờ admin chuyển) |
| `/thanh-toan-gia-lap` | Cổng thanh toán giả lập (`PAYMENT_PROVIDER=mock`) |
| Modal đăng nhập (header) | Google (khi có OAuth) hoặc **email + mã 6 số** gửi qua email |
| `/admin/login` | Cùng cách đăng nhập (role ADMIN / STAFF) + tài khoản env dự phòng |
| `/admin` | Tổng quan · Khách sạn (Giá & phòng trống · Hạng phòng → Thông tin / Ảnh / Số phòng / Gói giá · Thông tin khách sạn · Cài đặt: chính sách huỷ & cọc, thông số kỹ thuật, kết nối Gohost, xoá) · Thêm khách sạn · **Đặt phòng web** · Khuyến mãi · Tiện ích · Người dùng. Menu Booking Gohost chỉ còn ở bản cũ (`DATA_SOURCE=gohost`) |

Quyền: **ADMIN** mọi thứ; **STAFF** chỉ Đặt phòng web (xem, nhận / trả phòng). Đổi role bằng SQL (`docs/db-setup.md` §4).

## Chạy trên máy

Dùng **Yarn 1** (không `npm`). Cần Node ≥ 20.19 và Postgres (xem `docs/db-setup.md`).

```bash
yarn install            # postinstall tự chạy prisma generate
cp .env.example .env    # rồi điền giá trị (bảng dưới)
yarn db:check           # kiểm kết nối DB (chỉ đọc)
yarn db:migrate:deploy
yarn db:seed
yarn dev                # http://localhost:3000
```

Kiểm tra:

```bash
yarn lint && yarn build # build cũng là bước kiểm type; chạy được khi KHÔNG có DATABASE_URL
yarn test               # logic thuần: khoảng ngày, tồn phòng, sinh giá
yarn check:quote        # báo giá: giá từng đêm, phụ thu, khuyến mãi, cọc, minStay/CTA/CTD, phạt huỷ (không cần DB)
yarn check:booking      # trên DB thật: tranh phòng cuối, hết hạn, webhook trùng, tiền về muộn, hoàn tiền, quyền admin (tự dọn)
```

## Biến môi trường

Danh sách đầy đủ + giải thích: `.env.example`. Tối thiểu cho `DATA_SOURCE=db`: `DATABASE_URL`, `AUTH_SECRET`, `ADMIN_USER`, `ADMIN_PASSWORD`; production thêm `AUTH_URL`, `SMTP_USER`, `SMTP_PASS`, `CRON_SECRET`, `PAYMENT_PROVIDER=mock` (tới khi có cổng thật), `UPLOAD_DIR` (nếu tải ảnh).

## Deploy Render

| Mục | Giá trị |
|---|---|
| Build command | `yarn install --frozen-lockfile && yarn build` |
| Pre-deploy command | `yarn db:migrate:deploy` |
| Start command | `yarn start` |
| Persistent Disk | Gắn vào vd `/var/data`, đặt `UPLOAD_DIR=/var/data/uploads` (ảnh admin tải lên; filesystem thường mất khi deploy) |
| Cron Job | Mỗi 5 phút: `curl -fsS -X POST -H "Authorization: Bearer $CRON_SECRET" https://rootyhospitality.com/api/cron/expire-holds` |
| Google OAuth | Redirect URI `https://rootyhospitality.com/api/auth/callback/google` |
| Email | `SMTP_USER` + `SMTP_PASS` (Gmail: mật khẩu ứng dụng, giới hạn ~500 email/ngày) |

Lần đầu trên production: `yarn db:check` (đúng host/database?) → pre-deploy migrate → `yarn db:seed` (Render Shell) → nhập giá → set role ADMIN.

## Kiến trúc mã

```
prisma/schema.prisma, migrations/, seed.ts   schema Postgres (Prisma 7, prisma.config.ts) — migration sinh offline, seed từ src/content
src/lib/pg.ts, db.ts                          kết nối (TimeZone=UTC, pool 5) — client tạo lười, không truy vấn lúc build
src/lib/quote.ts, inventory.ts, pricing.ts    logic THUẦN: báo giá, tồn theo ngày, sinh giá từ quy tắc, phạt huỷ (kiểm bằng yarn test / check:quote)
src/lib/booking-engine.ts                     lõi DB: giữ phòng (chống bán quá), thanh toán, webhook idempotent, hết hạn, huỷ, thu tiền, hoàn tiền
src/lib/booking-rules.ts                      giả định nghiệp vụ chưa chốt (gom một chỗ)
src/lib/payment.ts, email.ts, emails/         cổng thanh toán (interface + giả lập ký HMAC), email Nodemailer (SMTP) + react-email
src/auth.ts, src/lib/admin-actor.ts           đăng nhập Auth.js (Google + email/mã, phiên DB), quyền admin
src/lib/*-commands.ts                         lệnh ghi admin (zod) dùng chung server / trình duyệt
src/api/                                      cửa dữ liệu phía server, mỗi file một object: hotelApi, catalogApi (nội dung, cache 'catalog'),
                                              inventoryApi, bookingApi, pricingApi, catalogAdminApi, bookingAdminApi, adminApi, gohostApi, siteApi
src/app/api/                                  route: /bookings/*, /payments/*, /cron/*, /auth/*, /admin/* (kiểm quyền từng route)
src/hooks/                                    TanStack Query — component client chỉ gọi hook
src/components/{site,hotel,booking,auth,admin}  giao diện
src/content/                                  nội dung gốc (nguồn seed; nguồn chính khi DATA_SOURCE=gohost)
```

Component không import `src/content`, `src/lib/gohost`, `src/api`, `src/lib/booking-engine` — trang server đọc qua `src/api`, component client qua hook (gọi `/api`). Trình duyệt không bao giờ gọi Gohost; giá luôn tính lại ở server.

Tài liệu: `docs/db-setup.md` (Postgres), `docs/2026-10-12-booking-engine-db-phase0.md` (quyết định + chi tiết từng phần), `docs/api-docs/gohost-api.md` (Gohost).

## Ngôn ngữ, giao diện

- next-intl: tiếng Việt URL gốc, tiếng Anh `/en`. Chữ giao diện `messages/*.json`; nội dung khách sạn song ngữ trong DB / `src/content`.
- Không dùng `createNextIntlPlugin` (kéo theo `@swc/core` lỗi quyền trên máy dev) — alias trong `next.config.ts`.
- Màu: `src/app/globals.css` (`:root`). Logo: `public/images/brand/rooty-trip-logo.png`.

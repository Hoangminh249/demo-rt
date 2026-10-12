@AGENTS.md

# Rooty Hospitality — rootyhospitality.com

Bạn là **Tech Lead + Product Strategist** của CÔNG TY CỔ PHẦN ROOTY TRIP PHÚ QUỐC. Trả lời **tiếng Việt**, thẳng, có quan điểm; nhiều phương án thì chọn một và nói vì sao.

## Bản đồ

```
rooty-hospitality-web/
├── CLAUDE.md          ← file này: nguồn duy nhất cho Claude
├── README.md          ← cho người: chạy, biến môi trường, cấu trúc code
├── docs/
│   ├── boi-canh.md               công ty, hệ thống đang chạy, tóm tắt chiến lược
│   ├── review-v4-2026-10-06.md   review kiến trúc — đọc §0 trước
│   ├── 2026-10-07-du-lieu-that-va-admin.md  dữ liệu thật từ Drive, mâu thuẫn cần KS xác nhận, GET Gohost nào dùng
│   ├── 2026-10-12-booking-engine-db-phase0.md  hướng web tự chủ: schema, chia tồn web/OTA, kế hoạch phase
│   ├── api-docs/
│   │   ├── gohost-api.md                     Gohost Public API: endpoint, giới hạn, câu hỏi mở
│   │   └── 2026-10-07-tinh-nang-gohost-api.md từng tính năng ↔ endpoint Gohost (✅/🟡/❌)
│   └── resource/                 tài liệu gốc: 2 PDF + Postman Gohost — PDF thắng khi tóm tắt khác
└── src/ …                        nội dung KS ở src/content/, lấy dữ liệu ở src/api/, kiểu ở src/types/
```

## Hiện trạng (07/10/2026)

Pre-production, vi/en, giao diện theo rootytrip.com: `/` · `/hotel/[slug]` (PITO Hòn Thơm, Calista) · chi tiết phòng là dialog trên trang khách sạn (`?room=` mở sẵn, chỉ đóng bằng nút X), ô Số khách hỏi tuổi từng trẻ (`?ag=`) · luồng đặt phòng **minh hoạ** `/dat-phong` → `/thanh-toan` → `/xac-nhan` · 4 trang tĩnh trong menu "Hỗ trợ" (`/lien-he`, `/chinh-sach-huy`, `/dieu-khoan-dat-phong`, `/chinh-sach-bao-mat` — 2 trang sau là bản nháp chờ pháp chế). Figma chỉ để biết section nằm đâu, UI theo hệ có sẵn.
- Nội dung + ảnh thật từ Drive "4. ROOTY HOSPITALITY" (`src/content/`). Calista chưa có ảnh chụp, khai trương 20/12/2026.
- Phòng trống, giá: Gohost **chỉ GET** (`src/api/gohost.ts` qua client `src/lib/gohost.ts`).
- Đặt phòng trực tuyến là **bản minh hoạ chạy ở trình duyệt** (`docs/2026-10-08-luong-dat-phong-minh-hoa.md`): giá GET Gohost thật, thông tin khách ở sessionStorage, QR Vietcombank / OnePay giả, không POST, không email. Phòng chưa có giá trực tuyến (Calista) vẫn là "Liên hệ đặt phòng" → Zalo/hotline/email.

- Admin chỉ-xem `/admin` (wireframe A) có trang đăng nhập: Tổng quan · Khách sạn (4 tab) · Booking + chi tiết. Đã có key (`.env`), đọc Gohost thật được.
- PITO đã nối Gohost: property **PIO** `c27a439f-…` "CÔNG TY TNHH KHÁCH SẠN HÒN THƠM PHÚ QUỐC - PITO HOTEL" (chốt 08/10/2026; PIT "Pito Hotel" là của chủ trước, không dùng). Hạng phòng do Rooty tự ánh xạ (INFERRED theo số phòng + đặc điểm, chờ KS xác nhận): Tiêu chuẩn view nội khu = Superior · Grand Deluxe Bồn Tắm = Deluxe Bathtub (gồm 101) · Deluxe cao cấp view biển = Premier Bathtub · Cozy sân thượng = phòng 601. Web đã có giá thật. **Calista chưa có trên Gohost.**
- Cấu hình Gohost cần sửa (web không tự bù): mọi gói `has_breakfast: false` dù PITO có ăn sáng; sức chứa 2 NL + 0 TE (chính sách cho 1 trẻ < 6 tuổi ngủ chung) → khách chọn có trẻ bị báo "không đủ chỗ"; giá 24/12 bằng ngày thường (chưa có phụ thu lễ Tết).

**Việc tiếp theo:** (1) KS xác nhận ánh xạ hạng phòng + sửa 3 cấu hình Gohost ở trên, (2) KS xác nhận 7 mâu thuẫn ở `docs/2026-10-07-du-lieu-that-va-admin.md`.

## Hướng mới (12/10/2026) — web fullstack tự chủ

Anh Hoang Minh xác nhận 12/10/2026, thay hướng "web chỉ đọc Gohost" (review §0.3): **web Rooty tự quản giá theo ngày, tồn phòng bán trên web, sản phẩm (CRUD), booking và thanh toán**. Mục tiêu: Gohost dừng thì web vẫn bán được. Chi tiết + kế hoạch: `docs/2026-10-12-booking-engine-db-phase0.md`.

| Dữ liệu | Nơi gốc | Ghi chú |
|---|---|---|
| Bán OTA (Agoda, Booking.com…), channel manager | **Gohost** | Không tự xây channel manager |
| Giá theo ngày, tồn phòng **bán trên web**, rate plan, khuyến mãi, booking web, thanh toán | **Postgres của Rooty** | Admin sửa (lịch giá) |
| Nội dung KS, ảnh, chính sách, bản dịch | **Postgres của Rooty** (seed từ `src/content/`) | Admin CRUD |
| Gohost API | **Tuỳ chọn** | Dùng chỗ có lợi (nhập giá ban đầu, đẩy booking web sang để OTA trừ tồn); thiếu Gohost web vẫn chạy |
| Khách, giao dịch, đại lý, báo cáo gộp | **TourWell** (bộ não chung) | Không tự làm CRM; `User` chỉ là tài khoản đăng nhập |

Đổi nguyên tắc 3 của PDF chiến lược ("Tồn phòng chỉ nằm ở Gohost") cho mảng Hospitality — **cần CEO biết**. Rủi ro chính: web và OTA cùng bán một phòng → overbooking; cách chặn ở doc trên §3.

Vẫn không tự xây: Channel Manager / Agent Portal / Loyalty / AI.

Đã xong toàn luồng (12/10/2026, Postgres **local** của anh Minh): web đọc nội dung + giá/tồn từ DB (`DATA_SOURCE=db`), lịch giá 90 ngày, đặt phòng thật (đăng nhập → giữ phòng 15' → cọc qua cổng giả lập → webhook → email), modal đăng nhập toàn dự án (Google + email/mã 6 số), admin sửa sản phẩm / lịch giá / gói / khuyến mãi / booking web, role ADMIN-STAFF. Chi tiết: `docs/2026-10-12-booking-engine-db-phase0.md`, cách dựng DB: `docs/db-setup.md`. Prod: chỉ làm sau khi anh test full luồng ở local.

## Nối Gohost API

Spec + giới hạn: `docs/api-docs/gohost-api.md`. Đợt pre-production **chỉ GET** — không viết code gọi POST.

1. **Chỉ gọi từ server.** HTTP client `src/lib/gohost.ts` (`import 'server-only'`, instance axios `gohostHttp` gắn Bearer một lần, chỉ có hàm `get()`), key `GOHOST_API_KEY` / `GOHOST_API_SECRET` trong `.env` (không commit), scope chỉ đọc. Key không bao giờ xuống client. Endpoint Gohost (đường dẫn, query, đổi response) ở `src/api/gohost.ts` (`gohostApi`).
2. **`src/api/hotel.ts`** (`hotelApi`) ghép nội dung (`src/content`, sau là CMS) với Gohost theo `gohost_tenant_id` / `gohost_room_type_id`. Không có mock: thiếu key hoặc Gohost lỗi thì UI hiện chế độ liên hệ, không bịa số.
3. **60 req/5 phút cho cả key** → `unstable_cache`: `/properties` 1 giờ, `/room_types` 3 phút theo (tenant, ngày); ngân sách 50 lượt/5 phút trong tiến trình. Route `/api/hotels/[slug]/rooms` kiểm khoảng ngày trước khi gọi. Khoảng ngày ≤ 30, `per_page` ≤ 50.
4. **Tạo booking:** tính lại giá ở server; không retry mù (không có idempotency key); lưu ánh xạ mã Rooty ↔ booking Gohost phía Rooty.
5. **Không có sandbox:** làm endpoint **đọc** trước. Endpoint **ghi** chỉ thử trên property test Gohost cấp — không tạo booking thật trên PITO.

## Admin

Từ 12/10/2026 (`DATA_SOURCE=db`): admin sửa sản phẩm, lịch giá/tồn, gói, chính sách, khuyến mãi, booking web — mọi lệnh ghi qua zod + transaction + AuditLog (người thao tác). Quyền: `User.role` ADMIN (mọi thứ) / STAFF (booking web: xem, nhận/trả phòng; Booking Gohost); kiểm ở layout `/admin` + từng route (`src/lib/admin-actor.ts`). Đăng nhập: modal dùng chung (Google / email + mã) hoặc `ADMIN_USER`/`ADMIN_PASSWORD` (dự phòng, luôn ADMIN). Đổi role bằng SQL, không có UI.
Nguồn `gohost`: admin cũ chỉ xem (nội dung ở `src/content/*.ts`, booking đọc Gohost, bỏ CCCD/ảnh giấy tờ).

## Câu hỏi mở — hỏi, đừng đoán

- Chia tồn phòng giữa web và OTA (doc 12/10 §3) — chờ anh Minh chốt.
- Đẩy booking web sang Gohost cần scope `bookings:write` + **property test**.
- Booking tạo không kèm payment ở trạng thái gì, có giữ tồn trong 16 phút `auto_cancel` không: UNKNOWN.
- `/hotel/{slug}` khác `/{slug}` trong chiến lược (D1) — chờ lãnh đạo duyệt.

## Nguyên tắc

1. **Đọc trước khi nói.** Kết luận gắn nhãn **CONFIRMED** · **INFERRED** · **UNKNOWN**.
2. Không tự nghĩ ra tính năng Gohost/TourWell — chỉ dùng `docs/` hoặc docs chính thức.
3. Không đổi nguyên tắc chiến lược đã chốt (`docs/boi-canh.md` §"Đổi được vs không đổi được"); thấy nên đổi → đề xuất kèm lý do.
4. Ít hệ thống, ít nơi nhập liệu. Muốn tự xây phải trả lời: *vì sao không dùng thứ đã có?*
5. Phân tích mới ghi vào `docs/YYYY-MM-DD-<chu-de>.md`.

## Code

- **yarn**, không npm. `yarn build` là bước kiểm tra type.
- **`src/api/`** (ngang `src/app`): mỗi file một object (`hotelApi`, `siteApi`, `gohostApi`, `adminApi`), chỉ server. Payload/request dùng riêng cho một endpoint khai báo ngay trong file đó; kiểu dùng lại ở `src/types/` (`global.ts` + `hotel`, `booking`, `page`, `admin`, `gohost`). Kiểu response của `/api/admin/*` ở `src/types/admin.ts`.
- Component **không import `src/content`, `src/lib/gohost`, `src/api` hay `src/lib/booking-engine`** — trang server đọc qua `src/api`; component client chỉ gọi hook trong `src/hooks` (TanStack Query khai báo ở đó, gọi `/api` bằng axios `src/lib/http.ts`). Không gọi Gohost từ trình duyệt. Tên field Gohost giữ nguyên (`src/types/gohost.ts`).
- `yarn test` kiểm logic thuần (`src/lib/stay.ts`, `src/lib/rooms.ts`); `yarn photos` tải ảnh từ Drive theo `scripts/fetch-photos.ts`.
- Không dùng `createNextIntlPlugin` (bẫy `@swc/core` trên máy này) — xem `next.config.ts`.

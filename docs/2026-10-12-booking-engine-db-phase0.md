# Phase 0 — Web fullstack tự chủ: booking engine + Postgres (12/10/2026)

Bắt đầu là khảo sát + kế hoạch; các phase đã làm ghi ở §9–§13. **13/10/2026: bỏ hẳn chế độ `DATA_SOURCE=gohost`** — web chỉ chạy bằng Postgres, Gohost chỉ còn ở admin (Kết nối Gohost) + `yarn db:import-gohost`.

## 1. Quyết định (anh Hoang Minh xác nhận 12/10/2026)

- Gohost giữ việc bán OTA (Agoda, Booking.com…) như trước.
- Web Rooty tự quản: giá theo ngày (lịch), tồn phòng bán trên web, sản phẩm (CRUD), booking, thanh toán. Gohost dừng → web vẫn bán.
- Gohost API dùng **khi có lợi**, không bắt buộc.
- Hệ quả: đổi nguyên tắc 3 PDF chiến lược ("Tồn phòng chỉ nằm ở Gohost") cho Hospitality — **cần CEO biết**. TourWell vẫn là bộ não khách/giao dịch; `User` chỉ là tài khoản đăng nhập.

## 2. Môi trường (CONFIRMED)

| Mục | Giá trị |
|---|---|
| Yarn | 1.22.22 classic, `packageManager: yarn@1.22.22`, không `.yarnrc.yml`, linker `node_modules` (không PnP) → không đổi cấu hình yarn. CI/Render: `yarn install --frozen-lockfile` |
| Node / Next | 24.21.0 / 16.3.8 (middleware = `src/proxy.ts`) |
| Prisma | chưa cài. dist-tag `latest` của `prisma` = `8.0.0-rc.22` (RC!) → ghim `prisma@7.10.0`, `@prisma/client@7.10.0`, `@prisma/adapter-pg@7.10.0` + `pg`. Engines Node ✅ |
| Auth.js | `next-auth@5.0.0-beta.32` (peer `next ^16` ✅), `@auth/prisma-adapter@2.11.3` (peer `@prisma/client >=6` ✅) |
| Khác | `zod@4.6.6`, `nodemailer@8.0.11` (thay resend 12/10/2026), `@react-email/components@1.0.12`, `tsx` đã có |
| Prisma 7 | `prisma.config.ts`, generator `prisma-client` bắt buộc `output`, driver adapter, seed khai trong `prisma.config.ts`, `migrate diff --from-empty --to-schema … --script` — **INFERRED, kiểm `--help` sau khi cài** |

## 3. Rủi ro số 1: web và OTA bán trùng một phòng

PITO có 13 phòng (Superior 4 · Deluxe Bathtub 4 · Premier Bathtub 4 · Cozy 1), đang bán OTA qua Gohost. Web có tồn riêng mà không báo Gohost → OTA vẫn bán phòng đó → overbooking.

| Cách | Làm thế nào | Phụ thuộc Gohost | Nhược |
|---|---|---|---|
| **(1) Chia allotment — đề xuất cho lúc ra mắt** | Mỗi hạng phòng dành N phòng/ngày cho web (`DailyInventory.allotment`). Lễ tân đóng đúng N phòng đó trên Gohost/OTA | **Không** | Phòng web không bán được thì nằm không, trừ khi lễ tân nhả lại cho OTA |
| (2) Dùng chung + đồng bộ | Trước khi giữ phòng: GET Gohost còn phòng không; sau khi xác nhận: POST booking sang Gohost để OTA trừ tồn | Có (scope `bookings:write`, property test, 60 req/5', không idempotency) | Gohost lỗi lúc đẩy → phải xử lý tay |

Đề xuất: **(1) ngay**, schema để sẵn chỗ cho (2) (`Booking.gohostBookingId`, `gohostSyncError`). Đúng mục tiêu "không phụ thuộc Gohost".

## 4. Bám quy ước repo (lệch prompt có chủ đích)

| Prompt | Làm | Vì sao |
|---|---|---|
| `src/server/**` | Logic thuần ở `src/lib/` (`quote.ts`, `pricing.ts`, `cancel.ts`); truy cập dữ liệu ở `src/api/` (`hotelApi`, `bookingApi`, `adminApi`) | CLAUDE.md §Code; `yarn test` đã kiểm logic thuần ở `src/lib` |
| `DATA_SOURCE=mock\|db` | `DATA_SOURCE=gohost\|db`, mặc định `gohost` = hành vi hôm nay (GET Gohost) | Repo không có mock: không có giá tĩnh nào (`src/content` ghi rõ). Chưa có DB thì web chạy y như hiện tại |
| Seed `DailyRate` từ mock | Seed catalog + tồn + chính sách; **giá**: nhập từ Gohost (nút admin "Nhập giá từ Gohost", GET theo cửa sổ 30 ngày) hoặc nhập trên lịch | Không có giá tĩnh |
| Nội dung KS normalize hết | Cột cho thứ cần lọc/tính (slug, status, giờ, sức chứa…); phần trình bày (facts, getting_here, faq…) giữ `Json` có kiểu TS từ `src/types/hotel.ts` | Không cần query vào FAQ; giữ song ngữ `L {vi,en}` |

## 5. Schema đề xuất (rút gọn — viết đầy đủ ở Phase 1)

```prisma
generator client { provider = "prisma-client"  output = "../src/generated/prisma" }
datasource db   { provider = "postgresql" }   // url ở prisma.config.ts

// ---- Auth (chuẩn @auth/prisma-adapter)
model User { id String @id @default(cuid())  name String?  email String? @unique  emailVerified DateTime?  image String?
  role Role @default(CUSTOMER)  phone String?  accounts Account[]  sessions Session[]  bookings Booking[] … }
// Account, Session, VerificationToken: đúng mẫu adapter

// ---- Catalog
model Hotel { slug @unique  code @unique  status PublishStatus  name  area Json  address Json  lat Float?  lng Float?
  stars Int?  checkInTime String  checkOutTime String  phone  email  zalo  notifyEmail String?
  openingDate DateTime? @db.Date  content Json  /* tagline, description, facts, policies, faq… (L) */
  gohostTenantId String? @unique  sortOrder Int }
model RoomType { hotelId  slug  status  name Json  description Json  maxAdults  maxChildren  maxOccupancy  baseOccupancy
  size Json  beds Json?  totalRooms Int  content Json  gohostRoomTypeId String? @unique  sortOrder  @@unique([hotelId, slug]) }
model Room { roomTypeId  number String  floor Int?  note String?  @@unique([roomTypeId, number]) }
model Amenity { code @unique  name Json  icon }      + HotelAmenity, RoomTypeAmenity
model MediaAsset { path @unique  alt Json  width  height  source MediaSource }  + HotelMedia, RoomTypeMedia (sortOrder, isCover)

// ---- Giá & tồn
model RatePlan { roomTypeId  code  name Json  mealPlan MealPlan  refundable Boolean  basePrice Int
  extraAdultFee Int  extraChildFee Int  cancellationPolicyId  depositPolicyId  isDefault  active
  gohostRatePlanId String?  @@unique([roomTypeId, code]) }
model DailyRate { ratePlanId  date DateTime @db.Date  price Int  @@unique([ratePlanId, date])  @@index([date]) }
model DailyInventory { roomTypeId  date @db.Date  allotment Int  booked Int @default(0)  held Int @default(0)
  closed Boolean  minStay Int @default(1)  maxStay Int?  closedToArrival Boolean  closedToDeparture Boolean
  @@unique([roomTypeId, date]) }
model PricingRule { ratePlanId  startDate @db.Date  endDate @db.Date  weekdays Int[]  type AdjustType /* FIXED|PERCENT */
  value Int  priority Int  active }   // sinh DailyRate: rule khớp có priority cao nhất thắng
model TaxFee { hotelId  name Json  type /* PERCENT|PER_NIGHT|PER_BOOKING */  value Int  included Boolean  active }

// ---- Chính sách
model CancellationPolicy { name  tiers Json /* [{daysBefore, penaltyPercent}] */  noShowPercent Int }
model DepositPolicy { name  type DepositType /* PERCENT|FIXED|FIRST_NIGHT|FULL */  value Int
  holdMinutes Int @default(15)  balanceDueDaysBefore Int @default(0) }

// ---- Khuyến mãi
model Promotion { code @unique  name Json  type /* PERCENT|FIXED */  value Int  hotelId?  ratePlanId?
  bookStart?  bookEnd?  stayStart?  stayEnd?  minNights Int  maxRedemptions Int?  perUserLimit Int?  active }
model PromotionRedemption { promotionId  bookingId @unique  userId  amount Int }

// ---- Booking
model Booking { code @unique  userId  hotelId  status BookingStatus  paymentStatus PaymentStatus
  checkIn @db.Date  checkOut @db.Date  contactName  contactPhone  contactEmail  adults  children  childAges Int[]
  specialRequests?  subtotal  discount  taxFees  total  depositAmount  paidAmount  balanceDue  balanceDueAt DateTime?
  currency @default("VND")  holdExpiresAt  policySnapshot Json  selectionKey String  needsRefund Boolean
  cancelledAt?  cancelReason?  source String  gohostBookingId String? @unique  gohostSyncError String?
  @@index([status, holdExpiresAt])  @@index([hotelId, checkIn])  @@index([userId, status]) }
model BookingRoom { bookingId  roomTypeId  ratePlanId  quantity  adults  children  roomId? }
model BookingNight { bookingRoomId  date @db.Date  price Int  @@unique([bookingRoomId, date]) }
model BookingStatusHistory { bookingId  from BookingStatus?  to BookingStatus  byUserId?  note?  at }

// ---- Thanh toán
model Payment { bookingId  kind PaymentKind  provider  providerRef @unique  amount Int  status  rawPayload Json  paidAt? }
model Refund { bookingId  paymentId?  amount Int  status /* PENDING|DONE|REJECTED */  reason  processedById?  processedAt? }
model PaymentWebhookEvent { provider  eventId  payload Json  receivedAt  processedAt?  @@unique([provider, eventId]) }

// ---- Khác
model EmailLog { bookingId?  to  template  subject  status /* SENT|FAILED|CONSOLE */  error?  providerId?  createdAt }
model AuditLog { userId  action  entity  entityId  before Json?  after Json?  at  @@index([entity, entityId]) }
model Review { bookingId @unique  userId  hotelId  rating Int  comment?  status }
```

SQL thêm tay vào migration (Prisma không sinh được):
- `CREATE UNIQUE INDEX … ON "Booking"("userId","selectionKey") WHERE status = 'PENDING_PAYMENT'` — mỗi user 1 booking chờ cho cùng lựa chọn.
- `CHECK (booked >= 0 AND held >= 0)` trên `DailyInventory`. Điều kiện `booked + held + qty <= allotment` nằm trong `updateMany` có điều kiện + kiểm số dòng.

## 6. Ánh xạ `src/content` → model

| Nguồn | Model |
|---|---|
| `PITO`, `CALISTA` (`HotelContent`) | `Hotel` (slug, code, tenant, opening, giờ từ `facts`) + `content Json` (phần trình bày) |
| `rooms[]` | `RoomType` (`gohost_room_type_id` → `gohostRoomTypeId`); `totalRooms` PITO 4/4/4/1; Calista **UNKNOWN** |
| `images`, `gallery`, `hero`, `cover` | `MediaAsset` (STATIC, `public/images/...`) + bảng nối |
| `included`, `not_available` | `Amenity` + `HotelAmenity` |
| PITO "huỷ ≥ 7 ngày 50%, < 7 ngày 100%" | `CancellationPolicy` tiers `[{7,50},{0,100}]`. "Lễ, Tết không hoàn": khoảng ngày **UNKNOWN** → rate plan non-refundable riêng |
| `DEPOSIT_RATE` 30% (`src/lib/booking.ts`) | `DepositPolicy` PERCENT 30, hold 15' |
| Giá | **Không có** trong content → nhập từ Gohost / nhập tay |
| `pages.ts`, `SITE` | Giữ file (trang tĩnh, không cần DB) |

## 7. File sẽ tạo / sửa

Tạo: `prisma.config.ts` · `prisma/schema.prisma` · `prisma/migrations/<ts>_init/{migration.sql,migration_lock.toml}` · `prisma/seed.ts` · `src/lib/db.ts` (Prisma lazy, `server-only`, không throw lúc import) · `src/lib/quote.ts`, `src/lib/pricing.ts`, `src/lib/cancel.ts` (thuần) · `src/api/booking.ts` · `src/auth.ts` + `src/app/api/auth/[...nextauth]/route.ts` · `src/lib/payment.ts` (`PaymentProvider` + mock) · `src/app/api/payments/[provider]/webhook/route.ts` · `src/app/api/cron/expire-holds/route.ts` · `src/emails/{BookingConfirmed,NewBookingNotice}.tsx` + `src/lib/email.ts` · `scripts/{db-check,check-quote,check-booking}.ts` · `docs/db-setup.md`.

Sửa: `package.json` (deps + scripts `db:*`, `check:*`, `postinstall`) · `src/api/hotel.ts` (chọn nguồn `gohost|db`) · `src/api/admin.ts` + trang `/admin` (CRUD, lịch giá) · luồng `/dat-phong` (nối thật khi `db`) · `src/lib/booking.ts` · `src/proxy.ts` (nếu cần) · `README.md` · `.env.example`.

Không xoá/đổi tên file nào.

## 8. Câu hỏi mở

1. **Chia tồn web/OTA**: cách (1) allotment riêng như đề xuất? Mỗi hạng bao nhiêu phòng cho web?
2. `/admin` đăng nhập: chuyển hẳn sang Google + `role`, bỏ `ADMIN_USER`/`ADMIN_PASSWORD`? (đề xuất: chuyển hẳn khi `DATA_SOURCE=db`, giữ cũ khi `gohost`)
3. Pháp nhân thu tiền cọc: Rooty Trip hay Công ty TNHH KS Hòn Thơm? (cần cho cổng thật sau này)
4. Cọc 30% hay trả 100%? Nội dung KS đang ghi "trả trước 100%".
5. Calista: số phòng mỗi hạng? Calista không có trên Gohost → chỉ bán được qua web khi có DB.

## 9. Phase 1 — đã làm (12/10/2026, chưa kết nối DB)

- Gói: `prisma`, `@prisma/client`, `@prisma/adapter-pg` ghim **7.10.0**, `pg`, `@types/pg` (dev).
- `prisma.config.ts` · `prisma/schema.prisma` (32 bảng) · `prisma/migrations/20261012120000_init/` (SQL sinh offline + 4 CHECK thêm tay ở cuối) · `prisma/seed.ts` · `scripts/db-check.ts` (phiên read-only).
- Prisma client sinh vào `src/generated/prisma` (gitignore, `postinstall` sinh lại trên Render).
- Mặc định đang dùng (đổi ở đầu `prisma/seed.ts`): web 1 phòng/hạng/đêm · sức chứa 2 NL + 1 TE · cọc 30% giữ 15' · huỷ ≥ 7 ngày 50%, < 7 ngày 100% · gói `BB` · **không seed giá**.
- Bẫy Prisma 7.10: `migrate diff --from-empty` khi config không có datasource thì **im lặng, exit 0, không ra SQL** → config đặt URL giữ chỗ khi thiếu `DATABASE_URL`. Không dùng `env()` của `prisma/config` vì nó throw khi thiếu biến.
- Partial unique index (1 booking chờ / user / lựa chọn) dùng preview `partialIndexes`, Prisma tự sinh — không phải SQL tay.
- Sửa schema về sau: `yarn prisma migrate dev` trên Postgres local; production chỉ `yarn db:migrate:deploy`.

## 10. Phase 2 — đã làm (12/10/2026)

- `DATA_SOURCE=db|gohost` (mặc định gohost = như cũ). Chọn ở `src/api/hotel.ts`; nhánh db đọc `src/api/inventory.ts`, logic thuần `src/lib/inventory.ts` (`roomsLeft`, `planOffers`, kiểm ở `yarn test`).
- Nhánh db: ghép nội dung ↔ DB theo **slug hạng phòng** (không cần ID Gohost) → Calista bán được khi có giá. Nội dung (chữ, ảnh) vẫn đọc `src/content`; chuyển sang đọc DB cùng lúc với admin CRUD (Phase 4) — tới lúc đó DB = bản seed của `src/content`.
- Lịch giá: `GET /api/hotels/{slug}/calendar[?room=]` — giá thấp nhất từng đêm 90 ngày (đêm còn phòng web). Ô chọn ngày trang KS hiện giá dưới mỗi ngày (chỉ nguồn db).
- "Giá từ" = giá thấp nhất 90 ngày. Không truy vấn DB lúc `next build` (`src/lib/db.ts` chặn), trang tĩnh làm mới sau 10 phút.
- `yarn db:import-gohost [ngày] [--dry]`: chép giá từng đêm từ Gohost vào `DailyRate` (3 lượt GET / 90 ngày / KS), ghi đè, có AuditLog. Không đụng tồn.
- Local 12/10/2026: đã nhập 90 đêm PITO (12/10/2026 → 09/01/2027): Superior & Deluxe Bathtub 2.720.000, Premier 3.060.000, Cozy 2.380.000 — giá phẳng, chưa có phụ thu lễ Tết (đúng như cấu hình Gohost hiện tại).

## 11. Phase 4a — admin lịch giá & gói giá (12/10/2026)

Phase 4 chia 3 phần: **4a** (đã làm) lịch giá/tồn + gói giá + chính sách · **4b** CRUD hạng phòng, nội dung KS, ảnh, tiện ích, phòng vật lý, khuyến mãi, thuế phí + web đọc nội dung từ DB · **4c** quản lý booking, ghi nhận tiền, hoàn tiền, gửi lại email, danh sách user (cần Phase 3).

- Trang `/admin/hotels/{slug}` thêm 2 tab ghi Postgres: **Lịch giá & tồn** (`views/rates.tsx`) và **Gói giá & chính sách** (`views/plans.tsx`). 4 tab cũ (Gohost, nội dung file) giữ nguyên, tab "Giá & phòng trống" đổi tên "Giá Gohost".
- Một endpoint ghi `POST /api/admin/db` (lệnh zod ở `src/lib/admin-commands.ts`) → `pricingApi.run` (`src/api/pricing.ts`): transaction + AuditLog mọi lệnh. Đọc: `GET /api/admin/hotels/{slug}/rates?from&to` (≤ 62 ngày), `/plans`.
- Sửa hàng loạt theo khoảng ngày + thứ: giá (gói chọn), xoá giá, phòng bán web, đóng/mở, ở tối thiểu/tối đa, chặn đến/đi. Một câu SQL `INSERT … ON CONFLICT` cho cả khoảng.
- Chặn bán quá: giảm phòng bán web dưới `booked + held` → khoá dòng (`FOR UPDATE`) rồi từ chối 409, nêu ngày. Không cho vượt `totalRooms`.
- Quy tắc giá (PricingRule) + "Sinh giá": ưu tiên cao nhất thắng; FIXED / ±% giá gốc (làm tròn nghìn); không khớp → giá gốc; không tính được → giữ nguyên. Logic thuần `src/lib/pricing.ts`, kiểm ở `yarn test`.
- Xoá gói đã có booking → chỉ ngừng bán. Xoá chính sách đang được gói dùng → 409.
- Bảo vệ: phiên admin (proxy + kiểm lại trong route), chỉ nhận `application/json` (415), cookie `sameSite=lax`.
- Vai trò STAFF/ADMIN: chưa có (admin vẫn đăng nhập bằng `ADMIN_USER`/`ADMIN_PASSWORD`, một quyền). Chuyển sang Google + `User.role` cùng Phase 3; AuditLog lúc đó ghi được `userId`.
- `yarn db:import-gohost` điền thêm giá gốc (giá phổ biến nhất) cho gói chưa có.

## 12. Phase 3 — đặt phòng thật (12/10/2026, chạy trên Postgres local)

Luồng (DATA_SOURCE=db): trang KS → chọn phòng → `/dat-phong` (bắt đăng nhập Google, quay lại đúng URL) → báo giá server + mã KM → **giữ phòng** (`POST /api/bookings`, held, 15') → `/dat-phong/thanh-toan?code=` (đếm ngược, cọc / trả đủ) → cổng (giả lập `/thanh-toan-gia-lap`) → **webhook** `POST /api/payments/{provider}/webhook` → CONFIRMED (held → booked) → email → `/dat-phong/xac-nhan?code=` hỏi lại mỗi 2 giây. Nguồn gohost: bản minh hoạ như cũ.

| Phần | File |
|---|---|
| Báo giá thuần (đêm, phụ thu, KM, thuế phí, cọc, lỗi, phạt huỷ) | `src/lib/quote.ts` · kiểm `yarn check:quote` |
| Giả định chưa chốt (trẻ miễn phụ thu < 6 tuổi, ≤ 5 phòng, ≤ 3 booking chờ/khách, tiền về muộn, báo KS) | `src/lib/booking-rules.ts` |
| Lõi DB: giữ phòng, thanh toán, webhook, hết hạn, huỷ | `src/lib/booking-engine.ts` · kiểm `yarn check:booking` (DB thật, tự dọn) |
| Cổng thanh toán (interface + giả lập ký HMAC) | `src/lib/payment.ts` |
| Email (Nodemailer SMTP + react-email, EmailLog, không gửi trùng) | `src/lib/email.ts`, `src/emails/*` |
| Đăng nhập Google (Auth.js v5, phiên DB, khởi tạo lười) | `src/auth.ts`, `/api/auth/*` |
| Server + route | `src/api/booking.ts`, `/api/bookings/*`, `/api/payments/*`, `/api/cron/expire-holds` |
| UI | `components/booking/live*.tsx`, `guest-form.tsx` (prop `live`), 3 trang `/dat-phong/*`, `/thanh-toan-gia-lap` |

Chống bán quá / tiền:
- Giữ phòng = một `UPDATE … WHERE booked + held + n <= allotment` trên mọi đêm, thiếu một đêm → rollback. Hai khách tranh phòng cuối → đúng một người (đã kiểm).
- Giá tính lại ở server khi báo giá, khi giữ phòng (lệch → `PRICE_CHANGED`) và ảnh chụp vào booking (giá từng đêm, chính sách huỷ, cọc).
- Webhook idempotent `(provider, eventId)`; payment đã SUCCEEDED bỏ qua; lệch số tiền không xác nhận. Tiền về sau hết hạn: còn phòng tự xác nhận (SAVEPOINT), hết phòng → `needsRefund` + Refund PENDING.
- Hết hạn: lười (khi đọc booking, khi giữ phòng, khi xem phòng trống) + cron.
- Email sau commit, khoá theo booking (`pg_advisory_xact_lock`) nên gọi trùng không gửi 2 lần; lỗi chỉ ghi EmailLog FAILED.
- Phiên Postgres `TimeZone=UTC` cho mọi kết nối (`src/lib/pg.ts`): Prisma lưu DateTime UTC không múi giờ; máy dev Postgres mặc định Asia/Bangkok làm `now()` lệch +7 giờ.
- Chính sách huỷ bắt buộc có mốc 0 ngày (admin) để công thức phạt không mơ hồ.

Đã thử E2E trên trình duyệt (DB local, phiên đăng nhập tạo thẳng trong bảng Session vì chưa có Google OAuth): giữ phòng → cọc 1.632.000 → CONFIRMED, email in console; thanh toán thất bại → vẫn PENDING, thử lại được; giá giả từ trình duyệt → 409; xem booking người khác → 404. Dữ liệu thử đã dọn.

Chưa làm: cổng thanh toán thật; khách tự huỷ trên web (hàm `cancelBooking` có, nút cho admin ở 4c); admin đăng nhập bằng Google + role (cùng 4c).

## 13. Hoàn thiện toàn luồng (12/10/2026)

- **Đăng nhập dùng chung toàn dự án**: modal (header web, bước đặt phòng) + trang `/admin/login` — Google (khi có `AUTH_GOOGLE_*`) hoặc **email + mã 6 số** (provider email của Auth.js gửi mã thay link; mã băm trong `VerificationToken`, hết hạn 10'). Kiểm mã qua `/api/auth/otp/verify`: mỗi mã sai 5 lần → huỷ mã; gửi mã 1 lần/phút, 5 lần/giờ/email, 20 lần/giờ/IP (đếm trong bộ nhớ — nhiều instance thì chuyển Postgres/Redis). Phiên đọc ở trình duyệt (`/api/auth/session`) nên trang tĩnh vẫn tĩnh.
- **Quyền admin**: `src/lib/admin-actor.ts` — env (ADMIN, dự phòng) hoặc `User.role` ADMIN / STAFF. Proxy lọc thô (có cookie), layout + từng route kiểm thật. AuditLog ghi `userId` (AsyncLocalStorage, `src/lib/audit.ts`).
- **Web đọc nội dung từ DB** (`src/api/catalog.ts`): dựng lại đúng kiểu `HotelContent`, cache tag `catalog`; admin ghi xong `revalidateTag` + `revalidatePath` → web thấy ngay. DB lỗi / đang build → quay về `src/content`. Khách sạn mới: `dynamicParams = true`.
- **Admin sản phẩm** (`src/lib/catalog-commands.ts` → `src/api/catalog-admin.ts`, chung endpoint `POST /api/admin/db`): khách sạn (tạo nháp, sửa thông tin + nội dung song ngữ, phần có bảng sửa JSON có zod), hạng phòng, phòng vật lý, tiện ích (thư viện + gán), bộ ảnh / banner / ảnh hạng phòng, thư viện ảnh + tải lên (`UPLOAD_DIR`, phát qua `/media/…`, kiểm byte đầu file), khuyến mãi, thuế phí, người dùng (chỉ xem). Thứ đã có booking → lưu trữ / tắt, không xoá hẳn. Slug chỉ đổi khi còn nháp.
- **Booking web** (`/admin/orders`, `src/api/booking-admin.ts`): lọc trạng thái / khách sạn / ngày đến / cần hoàn / tìm; chi tiết (tiền từng đêm, thanh toán, hoàn tiền, lịch sử, email); thao tác: thu tiền tại quầy, nhận / trả phòng (STAFF được), huỷ / không đến (xem trước tiền phạt), gửi lại email, xử lý hoàn tiền.
- Kiểm: `check:booking` thêm ca (7) thu tiền + nhận/trả phòng đúng thứ tự, (8) hoàn tiền. E2E trình duyệt: đăng nhập email + mã, CUSTOMER bị chặn admin, STAFF chỉ thấy booking, ADMIN thu tiền + check-in, sửa nội dung → web đổi ngay, tải ảnh. Dữ liệu thử đã dọn.

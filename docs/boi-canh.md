# Bối cảnh — công ty, hệ thống, chiến lược

Tổng hợp 06/10/2026 từ repo nội bộ và PDF chiến lược (`resource/Chien_luoc_…pdf`). **PDF thắng khi khác.**

## Phần 1 — Công ty & hệ thống đang chạy
### Công ty

- **CÔNG TY CỔ PHẦN ROOTY TRIP PHÚ QUỐC**, hoạt động tại Phú Quốc.
- Ba thương hiệu / mảng:
  - **Rooty Trip** — tour, combo, vé, xe, MICE, tour ghép cano. Nguồn khách lớn nhất. Web: rootytrip.com (đang chạy, có thứ hạng SEO).
  - **RIVUS** — cano riêng, du thuyền, thuê riêng, sự kiện trên biển. Web: rivusyacht.com. Du thuyền RIVUS đang đóng mới.
  - **Rooty Hospitality** — lưu trú. Web: rootyhospitality.com. Khách sạn đầu tiên chạy Gohost: **PITO** (đường dẫn ví dụ `/pito-hon-thom`); ví dụ khác: **Calista**.

### Hệ thống phần mềm đang tồn tại (CONFIRMED)

| Hệ thống | Loại | Vai trò hiện tại | Chiến lược có nhắc? |
|---|---|---|---|
| **TourWell** | Phần mềm của **nhà cung cấp** (xem dưới) | Đơn, khách, giá, thanh toán, điều hành tour | Có — gọi là "bộ não chung" |
| **Gohost** | PMS của nhà cung cấp (mua) | Phòng, giá, tồn phòng, OTA cho khách sạn | Có |
| `dieu-hanh-tour` | Web app nội bộ tự viết (Next.js 16 + Prisma/SQLite, deploy Render) | Điều phối HDV / xe / cano; **mirror** đơn & khách từ TourWell qua API | **Không** |
| `lark-tour-operation` | Bot Lark tự viết (Node + TS + **Postgres dùng chung**) | Parse tin điều phối xe trong nhóm Lark | **Không** |
| Rooty Panel | Web app nội bộ tự viết (Next.js 16, đọc Lark Sheet/Base) | Dashboard CSKH, khảo sát | **Không** |
| Lark (Suite) | SaaS | Chat, Sheet, Base — nhiều dữ liệu vận hành đang nằm ở đây | **Không** |

Năng lực kỹ thuật công ty đã vận hành được: **Next.js 16, Node/TypeScript, Postgres, SQLite/Prisma, Render (Singapore), Lark Open API**.

### TourWell — điểm cần làm rõ

- PDF chiến lược ghi TourWell là **"Tự phát triển · bộ não chung"**.
- Thực tế (CONFIRMED qua tích hợp hiện có):
  - Có docs API công khai tại `docs-api.tourwell.vn`; token lấy qua tài khoản "Api Official", không hết hạn.
  - Rate limit **60 request/phút**, vượt → HTTP 429.
  - Có filter `updated_at` cho đơn; có webhook (cấu hình trong UI, danh sách event không công bố).
  - Một phần API (`/api/ai/datasets/*`) do TourWell **cấp riêng** cho Rooty, không có spec công khai.
- → TourWell là **phần mềm của nhà cung cấp** (có thể được tuỳ biến cho Rooty). Hệ quả: các mục chiến lược như "công ty giữ mã nguồn", "module RIVUS riêng", "thiết kế cho nhiều pháp nhân" **phụ thuộc nhà cung cấp**. Mức độ Rooty sở hữu/kiểm soát TourWell: **UNKNOWN — cần lãnh đạo xác nhận**.
- Chưa rõ TourWell có API **tạo khách / tạo đơn** để nhận dữ liệu khách sạn đổ về hay không: **UNKNOWN**.

### Hệ quả

- Chiến lược nói "2 hệ thống", thực tế có ≥ 5 khối. Nguyên tắc "mỗi loại dữ liệu một nơi gốc" cần bản đồ dữ liệu bao trùm cả các khối này.
- Khi cả TourWell và Gohost đều là phần mềm thuê ngoài, thứ Rooty **thực sự sở hữu lâu dài** là: website/domain/SEO, lớp tích hợp, bộ mã chủ (khách, đại lý, nguồn), kho dữ liệu, CRM. (INFERRED — đề xuất cần kiểm chứng.)
## Phần 2 — Chiến lược 2026–2036 (tóm tắt PDF)

### Mục tiêu
Sở hữu toàn bộ hành trình khách tại điểm đến: **Đến** (xe · Rooty Trip) → **Ở** (Rooty Hospitality) → **Di chuyển** (xe · Rooty Trip) → **Trải nghiệm** (tour · RIVUS) → **Quay lại** (dữ liệu chung). Toàn bộ dữ liệu khách phải về **một bộ não chung**.

### Cấu trúc: 3 website – 2 hệ thống – 1 bộ não
- **rootytrip.com** (tour, combo, xe, MICE) và **rivusyacht.com** (cano, du thuyền, thuê riêng) → **TourWell** (lõi chung: khách hàng, bán hàng, thanh toán, công nợ, đại lý, báo cáo gộp; có Module Rooty Trip + Module RIVUS).
- **rootyhospitality.com** (1 web chung, mỗi khách sạn 1 trang riêng) → **Gohost** (mua; phòng, giá, tồn phòng, OTA, booking khách sạn).
- Gohost → TourWell: **dữ liệu khách & giao dịch**.
- "Website tạo khách và nhận đơn; phần mềm quản lý nghiệp vụ, dữ liệu và báo cáo."

### Lý do chọn
1. Chia theo bản chất ngành: lưu trú có phần mềm chuẩn → mua Gohost; tour & tàu chung logic lịch chạy, sức chở, nhân sự → chung TourWell.
2. Mua phổ thông, tự làm lợi thế (điều hành tour & tàu).
3. Ít hệ thống nhất: 2 hệ thống cho 3 thương hiệu.
4. Giữ lựa chọn về sau: khách sạn chạy riêng → vận hành độc lập được.

### Website
| | rootytrip.com | rivusyacht.com | rootyhospitality.com |
|---|---|---|---|
| Vai trò | Cỗ máy bán lữ hành, nguồn khách lớn nhất | Kênh bán tàu chuyên biệt, cao cấp | Thương hiệu lưu trú, đặt phòng trực tiếp |
| Sản phẩm | Tour, combo, vé, MICE, xe, tour ghép cano | Cano riêng, du thuyền, thuê riêng, sự kiện biển | Phòng và dịch vụ bổ sung |
| SEO | Phủ rộng du lịch Phú Quốc | Thuê du thuyền, cano riêng | Tên khách sạn & khu vực |
| Chuyển đổi | Đặt chỗ, thanh toán, tư vấn | Yêu cầu, báo giá, đặt cọc | Đặt phòng trực tiếp |

Quy tắc: mỗi nhóm từ khoá chỉ một website sở hữu; không sao chép nội dung giữa domain; xe thuộc Rooty Trip, không mở web xe riêng.

rootyhospitality.com: **1 web chung chứa tất cả khách sạn; mỗi khách sạn 1 đường dẫn riêng như landing page; thêm khách sạn = thêm 1 trang, không làm web mới.** Ví dụ `rootyhospitality.com/pito-hon-thom`, `rootyhospitality.com/calista`.

"Website là tài sản lâu dài: domain, đường dẫn và SEO tích luỹ theo năm. Chỉ phát triển thêm, không làm lại."

### TourWell: một lõi chung, mỗi mảng một module
- Lõi chung: 1 hồ sơ khách hàng · 1 chuẩn bán hàng · thanh toán & công nợ · đại lý & hoa hồng · báo cáo gộp **kể cả dữ liệu khách sạn**.
- Module RIVUS: đội tàu, sức chở theo đăng kiểm; lịch ca chạy, giữ chỗ tạm; khoá bảo dưỡng, đổi tàu, hoãn chuyến; cảng, thuyền viên, nhiên liệu; thời tiết, đăng kiểm, chứng từ.
- "Tàu là tài nguyên, không phải một sản phẩm tour."

### 3 nguyên tắc không được thay đổi
1. **TourWell là bộ não của cả công ty** — thiết kế cho nhiều thương hiệu, pháp nhân, điểm đến.
2. **Chia theo sản phẩm, không theo bộ phận**: bán phòng → Gohost; bán tour, tàu → TourWell; bất kể ai bán. Sales Rooty Trip bán combo có phòng → đặt phòng trên Gohost **như một đại lý**. Lễ tân khách sạn bán tour, tàu → bán trên TourWell.
3. **Một chuẩn nhận diện chung**: một khách, một đại lý, một nguồn khách được nhận diện giống nhau ở cả 2 hệ thống. **Dữ liệu khách và giao dịch khách sạn luôn về TourWell. Tồn phòng chỉ nằm ở Gohost.**

### Đổi được vs không đổi được
- **Đổi được về sau**: Gohost (khách sạn là vệ tinh, đổi như đổi nhà cung cấp); nội dung trên website.
- **Không đổi được — chốt ngay**: 3 website & cấu trúc đường dẫn; TourWell làm trung tâm; ranh giới giữa 2 hệ thống; chuẩn nhận diện dữ liệu.

### 5 điều kiện để không phải đập đi làm lại
1. Quyền sở hữu: công ty giữ domain, mã nguồn, dữ liệu, tài khoản quản trị cao nhất.
2. Ranh giới dữ liệu: mỗi loại dữ liệu chỉ một nơi gốc; không nhập tay hai nơi.
3. Vận hành liên tục: sao lưu, khôi phục, cách làm thủ công khi hệ thống lỗi.
4. Kiểm thử & truy vết: môi trường thử nghiệm, phân quyền, nhật ký thao tác, đối soát.
5. Người chịu trách nhiệm: mỗi website & module có một người chịu trách nhiệm kinh doanh.

**Điểm mù lớn nhất:** làm xong website rồi mới bàn dữ liệu đổ về đâu và ai chịu trách nhiệm.

### Lộ trình
- **Bước 0 (30 ngày đầu):** chốt 3 nguyên tắc + duyệt 5 gói đầu ra.

| | Bước 1 | Bước 2 | Bước 3 | Bước 4 |
|---|---|---|---|---|
| Khách sạn (Gohost) | **PITO chạy Gohost** | Nhân rộng cho từng căn khi mở | **rootyhospitality.com: mỗi KS 1 trang, gắn booking Gohost** | — |
| Tour & tàu (TourWell) | Nâng thành nền tảng chung | Nhận dữ liệu khách sạn | Thêm module RIVUS (đội tàu hiện có) | Bổ sung tàu đóng mới |
| Website | Web RIVUS bán & SEO ngay, booking nhập về TourWell | rootytrip.com nối nền tảng chung | Web RIVUS nối lịch trống TourWell | Du thuyền RIVUS về: thay nội dung, giữ đường dẫn |

Cổng duyệt: chỉ qua bước sau khi đầu ra bước trước được duyệt. **Đo bằng booking, doanh thu và lỗi vận hành, không đo bằng độ đẹp website.**

### Tổ chức & 5 gói đầu ra 30 ngày
- Người phụ trách: TourWell (cấp công ty), Khách sạn (Gohost · rootyhospitality.com), RIVUS, Rooty Trip — **chưa điền tên**.
- Người chịu trách nhiệm kinh doanh chịu KPI doanh thu & vận hành; IT chịu chất lượng hệ thống.

| Chủ trì | Đầu ra 30 ngày | Tiêu chí chốt |
|---|---|---|
| CEO + PM | Phạm vi, ưu tiên, ngân sách, người phụ trách | Brief được duyệt |
| Marketing | Sơ đồ trang, bản đồ từ khoá, kế hoạch nội dung 3 domain | Không trùng từ khoá |
| IT / Dev | Kiến trúc lõi & module TourWell, **kết nối Gohost**, chi phí, sao lưu | Có đặc tả kết nối |
| Vận hành | Luồng booking & ngoại lệ (bảo dưỡng, thời tiết, đổi tàu, hoãn chuyến) | Bộ kịch bản kiểm thử thực tế |
| Sales + Tài chính | Giá, đặt cọc, hoàn huỷ, hoá đơn, hoa hồng đại lý | Luồng tiền được chốt |

"Phần code mới trên TourWell chỉ bắt đầu khi 5 gói được duyệt. Web RIVUS và rootytrip.com vẫn chạy song song."

Thông điệp: **Bên ngoài chuyên biệt. Bên trong dùng chung.**

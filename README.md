# Rooty Hospitality — bản demo web/app

Demo bấm được từ đầu đến cuối cho `docs/de-xuat-cau-truc-rooty-hospitality-v4-tham-khao.pdf`. **Dữ liệu là giả lập**: không có backend, database, đăng nhập hay thanh toán thật, và không gọi Gohost/TourWell.

Stack: Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · **shadcn/ui** (Radix, style radix-nova, đã chỉnh theo skill evon ui-ux) · lucide-react · recharts · react-day-picker · font Be Vietnam Pro.

## Chạy

Dự án dùng **Yarn 1** (`packageManager: yarn@1.22.22`, lockfile `yarn.lock`). Đừng chạy `npm install` để tránh hai lockfile.

```bash
yarn install
yarn dev           # http://localhost:3000
yarn build         # build production (cũng là bước kiểm tra type)
yarn lint
yarn check-data    # kiểm tra seed khớp các ví dụ trong PDF + bộ phân tích câu của AI
yarn photos        # tải lại ảnh mẫu (Unsplash) vào public/images — chỉ tải file chưa có
yarn images        # sinh lại bản đồ tĩnh map-phu-quoc.svg
```

Script kiểm tra tên là `check-data` vì `yarn check` là lệnh có sẵn của Yarn 1 (kiểm tra dependency), sẽ chạy thay cho script.

**Reset dữ liệu demo:** bấm nút **Reset dữ liệu** trên banner trên cùng. Nút này xoá mọi booking, giá, tồn, ưu đãi và đăng ký đại lý tạo trong phiên. Dữ liệu seed giữ nguyên.

**Chuyển vai trò:** dùng ô *Chuyển vai trò* trên banner, có 5 vai: Khách · Đại lý · Nhân viên · Lãnh đạo · Quản trị khách sạn.

Ngày "hôm nay" của demo được cố định là **06/10/2026** (`src/lib/format.ts`).

## Kịch bản demo 10 phút

| Phút | Vai trò | Thao tác | Điểm nhấn |
|---|---|---|---|
| 0–3 | Khách | Trang chủ → **Tìm** (mặc định 12–15/10, 2 người lớn + 1 trẻ em) → PITO Hòn Thơm · Deluxe Ocean View · *Phòng + ăn sáng* → **Đặt phòng** → thêm **2 chiều xe sân bay** + **Tour 4 đảo** → điền thông tin → chọn thanh toán thẻ, đặt kết quả giả lập là **Thất bại** → bấm **Thử lại** với kết quả **Thành công** | Thẻ phòng theo ví dụ PDF (chữ tiếng Việt): 2.850.000đ / đêm · *Chỉ còn 3 phòng* · Bao gồm ăn sáng · Huỷ miễn phí. Thêm xe + tour thì ưu đãi **Package −12%** tự áp. Có bộ đếm giữ phòng 15 phút. Trang xác nhận có voucher in được và file .ics |
| 3–5 | Đại lý | Chuyển vai **Đại lý** (ABC Travel) → thẻ PITO · Deluxe Ocean View đêm 20/10 → **BOOK** 2 phòng → **Ghi công nợ** | Thẻ đúng ví dụ PDF: *Public 3.000.000 · Net 2.500.000 · 7 rooms*. Thông báo hiện *Source: Agent ABC Travel \| Revenue: 5.000.000 \| Payment: Credit \| Status: Confirmed*, tồn còn **5** |
| 5–7 | Lãnh đạo | Chuyển vai **Lãnh đạo** → **Inventory** (ô 20/10: W7 · A7 · O8 · Off3 → còn 5) → **Bookings** (2 booking vừa tạo, nguồn Website và Đại lý) → **Dashboard** tháng 09/2026 | Dashboard tính từ dữ liệu, ra ~1.301 booking · 3.437 room nights · 8,4 tỷ · 76% · ADR 2,43 triệu · Direct 38% / Agent 28% / OTA 34% · huỷ 7,3%. Bấm vào biểu đồ để lọc booking |
| 7–8 | Lãnh đạo | **Customers / CRM** → Nguyễn Văn A | Đúng thẻ PDF §7: 4 bookings · 11 room nights · 42 triệu · Ocean View · đã mua tour và dùng xe sân bay · ở gần nhất 05/09/2026. Kèm gợi ý hành động |
| 8–10 | Khách | Mở nút **Trợ lý AI** → bấm câu mẫu đầu tiên. Sau đó vào **Thành viên** → *Đăng nhập là Nguyễn Văn A* → quay về trang chủ | AI trả *PITO – Family Ocean View · 3 đêm – 8.898.000đ · 2 rooms* và *Calista – Family Suite · 9.600.000đ · 3 rooms*, có các nút View Hotel → Compare → Select Room → Book. Sau khi đăng nhập, trang chủ hiện mục "Gợi ý dựa trên lần ở trước" |

Có thể thử thêm:
- Vai **Quản trị khách sạn**: bị khoá vào PITO, không vào được Agents và Users.
- `/agent/dang-ky` gửi hồ sơ đại lý → Admin › Agents duyệt → tài khoản mới hiện trong danh sách đăng nhập đại lý.
- Bấm vào một ô Inventory để đóng bán → website báo hết phòng.
- Admin › Rates sửa giá hàng loạt → giá trên website đổi theo.
- Trang `/kien-truc`.

## Ánh xạ mục PDF → route

| Mục PDF v4 | Route |
|---|---|
| §1 Trang chủ | `/` |
| §1 Khách sạn & Resort → Hotel A (9 mục con) | `/khach-san`, `/{hotel}` (tab/anchor: tổng quan, phòng, tiện ích, nhà hàng, trải nghiệm, gallery, chính sách, ưu đãi, đặt phòng), `/{hotel}/phong`, `/{hotel}/phong/{room}`, `/{hotel}/uu-dai`, `/{hotel}/dat-phong` |
| §1 Điểm đến | `/diem-den`, `/diem-den/{phu-quoc\|bac-dao\|trung-tam\|nam-dao}` |
| §1 Ưu đãi | `/uu-dai`, `/uu-dai/{slug}` |
| §1 Trải nghiệm (ẩm thực, spa, hồ bơi, hoạt động, tour, transfer, RIVUS) | `/trai-nghiem`, `/trai-nghiem/{slug}` |
| §1 Hội nghị & sự kiện · Wedding · Cẩm nang | `/hoi-nghi-su-kien`, `/wedding`, `/cam-nang`, `/cam-nang/{slug}` |
| §1 Thành viên / Loyalty · My Booking / My Account | `/thanh-vien`, `/my-booking`, `/tai-khoan` |
| §1 Hành trình đặt phòng có xe + tour | `/{hotel}/dat-phong` → `/dat-phong/xac-nhan/{code}` → `/voucher/{code}` |
| §2 Thanh tìm kiếm + thẻ kết quả | `/` (hero), `/tim-kiem` (lọc, sắp xếp, xem danh sách/bản đồ), `/so-sanh` (tối đa 3) |
| §3 Admin, 13 module | `/admin`, `/admin/{hotels,rooms,rates,inventory,bookings,customers,agents,promotions,payments,reports,content,users}` |
| §3 Dashboard lãnh đạo + xem sâu | `/admin` → `/admin/bookings?…` |
| §4 Booking tập trung | `/admin/bookings`, `/admin/bookings/new` (nhân viên tạo), `/admin/bookings/{code}` |
| §5 Agent Portal | `/agent`, `/agent/dang-ky`, `/agent/tim-phong`, `/agent/dat-phong`, `/agent/booking`, `/agent/cong-no`, `/agent/hoa-hong`, `/agent/bao-cao` |
| §6 Tồn phòng | `/admin/inventory` (số còn lại cũng hiện ở `/tim-kiem` và `/agent/tim-phong`) |
| §7 Hồ sơ khách | `/admin/customers/{id}`, `/tai-khoan` |
| §8 Sơ đồ tổng thể | `/kien-truc` |
| §9 AI Hospitality Assistant | Nút chat nổi trên mọi trang khách; mục cá nhân hoá ở `/` |

## Kiến trúc mã

```
src/
├── app/(site)/        website khách (route cố định đặt trước /[hotel])
├── app/agent/         Agent Portal
├── app/admin/         Rooty Hospitality Admin
├── components/        ui/ · site/ · agent/ · admin/ · ai/
├── data/              dữ liệu hardcode + seed (CHỈ repo được import)
├── lib/
│   ├── repo/          lớp truy cập dữ liệu — cửa duy nhất của UI
│   ├── pricing.ts     giá theo đêm, ưu đãi, add-on, giá net đại lý
│   ├── inventory.ts   tồn = tổng − đã bán (đếm từ booking) − đóng bán
│   ├── metrics.ts     KPI dashboard
│   ├── ai-parse.ts    bộ phân tích câu theo luật (không dùng LLM)
│   └── format.ts      2.850.000đ · dd/MM/yyyy · 12–15/10/2026
└── store/             DemoStore (Context + localStorage, chỉ lưu phần thay đổi)
```

**Khi Gohost mở API dùng thử:** viết `src/lib/repo/api.ts` export một object cùng kiểu `Repo` (= `typeof mockRepo`), rồi đổi một dòng trong `src/lib/repo/index.ts`. Repo thật phải gọi **backend Rooty**, không gọi Gohost từ trình duyệt. Lý do: key đọc được mọi khách sạn, rate limit chỉ 60 request/5 phút, và giá phải được tính lại ở server.

## Ánh xạ field mock → Gohost API

| Field trong demo | Gohost API (theo spec, chưa gọi thử) | Ghi chú |
|---|---|---|
| `Hotel.tenant_id` | `tenant_id` trong path `/properties/{tenant_id}/…` | Rooty giữ bảng `hotel_code ↔ tenant_id ↔ slug` |
| `RoomType.room_type_id`, `quantity`, `max_adults`, `max_children` | room type trong `GET /properties`, `/room_types` | Ảnh, mô tả, diện tích, view là nội dung CMS của Rooty |
| `RatePlan.rate_plan_id`, `has_breakfast` | rate plan, `has_breakfast` trong `/room_types/search` | `free_cancel_days` thuộc Rooty (API không có chính sách huỷ) |
| `BookingRoom.days_breakdown[{day, price}]` | `days_breakdown` (search và body tạo booking) | Giá do client gửi → server Rooty phải tính lại |
| `Booking.checkin_date`, `checkout_date` | `checkin_date`, `checkout_date` | |
| `Booking.booking_rooms[].room_type_id / rate_plan_id` | `booking_rooms[]` | |
| `Booking.source_name` | `source_name` (chuỗi) | Gohost không có id nguồn hay id đại lý; `channel`, `agent_id` thuộc Rooty |
| `Booking.payment_collect` | `payment_collect` (`property\|ota\|online\|""`) | Enum ở request và response khác nhau trong spec |
| `Booking.status` (`new, confirmed, checked_in, finished, cancelled, no_show`) | `new, confirmed, in_progress, finished, no_show` + `/cancel` | `checked_in` ↔ `in_progress` / update `status: checked_in` |
| `Booking.payments[]` | `POST /bookings/{id}/payments` | |
| `Booking.guest`, `arrival_hour`, `notes`, `invoice` | `customer.*`, `arrival_hour`, `notes`, hoá đơn VAT qua `/update` | |
| `Booking.source_commission` | `source_commission` (integer) | Là % hay số tiền: UNKNOWN |
| `Booking.code` | — | Gohost không có trường external ID → Rooty giữ bảng ánh xạ mã |

### Demo có nhưng Gohost/TourWell (theo spec hiện tại) KHÔNG hỗ trợ

| Tính năng trong demo | Thực tế |
|---|---|
| Giá net đại lý, đại lý có id, hạn mức và công nợ | Gohost API không có → Rooty/TourWell phải tự giữ |
| Báo cáo occupancy, ADR, dashboard nhiều khách sạn | API không trả. Gohost có báo cáo từng KS trong UI; báo cáo gộp → TourWell / kho dữ liệu |
| Giữ phòng 15 phút | Không có cơ chế hold; chỉ có `auto_cancel` (thời hạn UNKNOWN) |
| Sửa giá, đóng/mở bán từ Admin Rooty | API chỉ đọc → làm trong Gohost UI |
| Đổi ngày / đổi phòng (My Booking) | API không hỗ trợ → lễ tân xử lý trong Gohost |
| Chính sách huỷ, ảnh, mô tả, tiện ích | Không có trong API → CMS Rooty |
| Booking/tồn cập nhật tức thì ở mọi nơi | Không có webhook hay `updated_since` → phải quét lại theo ngày check-in. Booking qua API có trừ tồn OTA ngay không: UNKNOWN |
| Ưu đãi, add-on xe/tour/RIVUS trong một lần thanh toán | Gohost chỉ có dịch vụ của khách sạn; tour/tàu ở TourWell. Phải có điều phối thanh toán phía Rooty |
| CRM, khách quay lại, Loyalty | TourWell (một hồ sơ khách dùng chung). Loyalty chưa có ở hệ thống nào |

## Những chỗ đã đơn giản hoá so với PDF

- Mỗi khách sạn có **một trang landing với tab/anchor**, chỉ tách route con cho Phòng, Ưu đãi, Đặt phòng (không làm đủ 9 trang con). Lý do: tốt cho SEO và đúng với kết luận của review ngày 06/10.
- Bản đồ là ảnh SVG tĩnh có ghim.
- **Ảnh là ảnh MẪU tải từ Unsplash** về `public/images/` (không hotlink). Thay bằng ảnh thật của khách sạn trước khi chạy thật: ghi đè file cùng tên. Hạng phòng Family Room của Ngọc Lan cố ý chưa có ảnh để thấy khung "Chưa có ảnh".
- Nút EN chỉ dịch menu.
- Đăng nhập khách và đại lý là giả lập (chọn từ danh sách).
- Thanh toán không nhập số thẻ; kết quả thành công/thất bại chọn bằng tay.
- "Xuất Excel" xuất ra file CSV.
- Đối soát thanh toán dùng tỉ lệ giả định (OTA 82%, các phương thức khác 96%).
- AI dùng regex và chấm điểm theo luật, không gọi LLM.
- Ưu đãi không cộng dồn: hệ thống chọn mức giảm cao nhất. Giá thành viên −5% thì cộng thêm khi khách đăng nhập.

## Những chỗ PDF chưa rõ — demo đã tự giả định

1. **Số booking:** prompt ghi "~1.300 booking từ 07–12/2026", trong khi PDF ghi riêng 09/2026 đã ~1.284. Demo sinh khoảng 1.000–1.300 booking/tháng (tổng ~6.200) với **150 phòng** trên 5 khách sạn để khớp occupancy 76%.
2. **Hotel A = PITO Hòn Thơm, Hotel B = Calista.**
3. **Giá:** 2.850.000đ là gói ăn sáng ngày thường của Deluxe Ocean View. 3.000.000đ là **giá niêm yết cho đại lý** (rack rate), khác giá bán trên website.
4. **Doanh thu đại lý:** 7.500.000đ trong PDF không khớp với "đặt thêm 2 phòng" (7,5 triệu = 1 phòng × 3 đêm × 2,5 triệu). Demo tính doanh thu từ booking thật: kịch bản 2 phòng × 1 đêm ra 5.000.000đ. Đặt 1 phòng × 3 đêm sẽ ra đúng 7.500.000đ.
5. **Direct = Website + Offline (nhân viên).** Cơ cấu kênh tính theo số booking (PDF không nói tính theo booking hay doanh thu).
6. **Công nợ đại lý** = booking ghi nợ khách đã nhận phòng mà chưa đối soát. Booking tương lai ghi nợ chỉ chiếm hạn mức.
7. **Doanh thu phòng** = giá sau giảm. Booking đại lý tính theo giá net, booking OTA tính theo giá bán (chưa trừ hoa hồng).

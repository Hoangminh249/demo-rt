# Rooty Hospitality — rootyhospitality.com (pre-production)

Website chung cho các khách sạn của Rooty, giao diện theo nhận diện **rootytrip.com**.

| Trang | Nội dung |
|---|---|
| `/` | Banner + thanh chọn nhanh (khách sạn, ngày, số khách) · 4 điều đã gồm · thẻ các khách sạn · hệ sinh thái Rooty |
| `/hotel/[slug]` | Bộ ảnh · mục lục dính · tổng quan · **chọn phòng** (phòng trống, giá từng đêm từ Gohost) · đã gồm · đi lại & vị trí · chính sách · hỏi đáp · thẻ giá dính |
| `/admin/login` | Đăng nhập admin (tài khoản trong env, phiên cookie httpOnly 7 ngày) |
| `/admin` | **Chỉ xem**. Sidebar thu gọn được, "Khách sạn" có menu con. Tổng quan: trạng thái Gohost, việc cần xử lý (chặn hiển thị / cần sửa), thẻ từng khách sạn |
| `/admin/hotels/[slug]` | Phòng & ánh xạ (hạng phòng Gohost ↔ nội dung, nút chép ID) · Giá & phòng trống (cùng lời gọi web dùng) · Nội dung VI/EN + chỗ chờ KS xác nhận · Ảnh |
| `/admin/bookings` | Booking đọc từ Gohost theo **property Gohost** (xem được cả khi khách sạn chưa gắn tenant) và khoảng ngày nhận phòng (≤ 30 ngày), lọc trạng thái; trang chi tiết. SĐT/email đã che, không hiện CCCD hay ảnh giấy tờ. Sửa, huỷ booking làm trong Gohost |

Khách sạn: `/hotel/pito-hon-thom`, `/hotel/calista` (tiếng Anh: `/en/hotel/…`).

## Dữ liệu đến từ đâu

| Dữ liệu | Nguồn | Sửa ở đâu |
|---|---|---|
| Ảnh, mô tả, tiện ích, đi lại, chính sách, hỏi đáp, bản dịch | Thư mục Drive "4. ROOTY HOSPITALITY" (PDF thông tin lưu trú, ảnh) | `src/content/<slug>.ts` |
| Phòng trống, giá từng đêm, "Giá từ", số phòng, sức chứa | **Gohost PMS Public API — chỉ GET** | Trong Gohost (web chỉ đọc) |
| Ánh xạ khách sạn ↔ Gohost (`gohost_tenant_id`), hạng phòng ↔ Gohost (`gohost_room_type_id`) | Rooty | `src/content/<slug>.ts` |

- Chưa có **đặt phòng trực tuyến**: nút "Liên hệ đặt phòng" mở hộp tóm tắt + Zalo / hotline / email của khách sạn. Không có lệnh ghi nào gửi sang Gohost.
- Khách sạn chưa nối Gohost (`gohost_tenant_id: null`), Gohost lỗi hoặc hết lượt gọi → web ẩn giá, khối phòng hiện nội dung + nút liên hệ. Không bao giờ hiện số đoán.
- Mâu thuẫn giữa các tài liệu của khách sạn và câu hỏi còn mở: `docs/2026-10-07-du-lieu-that-va-admin.md`.

## Chạy

Dùng **Yarn 1**, không chạy `npm install`.

```bash
yarn install
yarn dev        # http://localhost:3000
yarn build      # build production (cũng là bước kiểm tra type)
yarn lint
yarn test       # kiểm logic thuần: khoảng ngày, ghép phòng với Gohost, "Giá từ"
yarn photos     # tải ảnh thật từ Drive còn thiếu vào public/images (danh sách trong scripts/fetch-photos.ts)
```

### Biến môi trường (`.env` hoặc `.env.local`, không commit — `.gitignore` chặn `.env*`)

| Biến | Dùng cho |
|---|---|
| `GOHOST_API_KEY`, `GOHOST_API_SECRET` | Gohost Public API. **Tạo key chỉ có scope `properties:read` + `bookings:read`** (không `bookings:write`). Thiếu thì web chạy ở chế độ "liên hệ" |
| `ADMIN_USER`, `ADMIN_PASSWORD` | Tài khoản đăng nhập `/admin/login`. Mật khẩu cũng là khoá ký cookie phiên: đổi mật khẩu là mọi phiên cũ hết hiệu lực. Thiếu thì không đăng nhập được |

Gohost không có sandbox: máy dev dùng chung key production, giới hạn **60 lượt / 5 phút cho cả key**. Code tự giữ ngân sách 50 lượt/5 phút và cache (danh mục 1 giờ, phòng trống 3 phút) — đừng bật "Disable cache" trong DevTools khi đang có key.

### Nối Gohost lần đầu

1. Đặt key và `ADMIN_USER` / `ADMIN_PASSWORD` vào `.env`, chạy `yarn dev`, đăng nhập `/admin/login`.
2. Mở `/admin/hotels/<slug>` → tab **Phòng & ánh xạ**: chép `id` property và `id` hạng phòng (nút chép cạnh mỗi ID), điền vào `gohost_tenant_id` và `gohost_room_type_id` trong `src/content/<slug>.ts`.
3. Mở trang khách sạn, chọn ngày: khối "Chọn phòng" hiện giá từng gói. So với bảng giá niêm yết trong PDF của khách sạn.

## Kiến trúc mã

```
src/content/                         nội dung thật của từng khách sạn (song ngữ vi/en) + kênh liên hệ
src/lib/gohost.ts                    HTTP client Gohost — instance axios riêng (Bearer key:secret một lần), chỉ get(), chỉ server, ngân sách lượt gọi, lỗi
src/lib/http.ts                      instance axios cho trình duyệt: chỉ gọi /api của Rooty; 401 ở /api/admin → về trang đăng nhập
src/hooks/                           mọi khai báo TanStack Query (useQuery / useMutation + khoá cache); component chỉ gọi hook
src/app/api/admin/                   route GET cho admin (kiểm phiên, kiểm tham số, rồi mới gọi Gohost) + đăng nhập/đăng xuất
src/api/                             cửa lấy dữ liệu phía server, mỗi file một object: hotelApi (content + Gohost), siteApi (liên hệ, trang tĩnh),
                                     gohostApi (endpoint Gohost + query riêng), adminApi. Payload/request dùng riêng cho endpoint khai báo ngay trong file
src/types/                           kiểu dữ liệu: global.ts (dùng chung) + từng module: hotel, booking, page, admin, gohost (response thô)
src/lib/rooms.ts, stay.ts            logic thuần dùng chung server/trình duyệt (ghép phòng, khoảng ngày)
src/app/api/hotels/[slug]/rooms/     phòng trống + giá cho khối "Chọn phòng" (kiểm tham số trước khi gọi Gohost)
src/app/[locale]/(site)/             trang chủ, trang khách sạn (dựng tĩnh, làm mới mỗi 10 phút)
src/components/site/, hotel/         header, footer, ô chọn ngày/khách, bộ ảnh, chọn phòng, thẻ giá
src/i18n/, src/proxy.ts, messages/   ngôn ngữ (next-intl); proxy còn chặn /admin, /api/admin khi chưa đăng nhập
src/app/admin/, src/components/admin/  admin chỉ xem: trang mỏng ở app/admin/(app), màn thật ở components/admin/views (client, dùng hook)
src/lib/admin-auth.ts                đăng nhập + phiên cookie ký HMAC, dùng chung cho proxy, route /api/admin và hàm đọc booking
```

Component không import `src/content`, `src/lib/gohost` hay `src/api` — trang server đọc qua `src/api`, component client đọc qua hook trong `src/hooks` (gọi /api). Trình duyệt không bao giờ gọi thẳng Gohost: key chỉ nằm ở server. Đổi sang CMS sau này chỉ thay `src/api/hotel.ts`, `src/api/site.ts`.

## Ngôn ngữ, header, banner

| Phần | Cách làm | Sửa ở đâu |
|---|---|---|
| **Ngôn ngữ** (vi, en) | next-intl. Tiếng Việt giữ URL gốc, tiếng Anh thêm `/en`. Giá luôn hiện VND | Chữ giao diện: `messages/*.json`. Nội dung khách sạn: `src/content/*.ts`. Cấu hình: `src/i18n/routing.ts` |
| **Header** | Như rootytrip.com: trang chủ trong suốt đè lên banner, cuộn thì nền trắng; cuộn xuống thì ẩn, kéo lên thì hiện | `src/components/site/header.tsx` |
| **Banner** | Embla Carousel, 3 ảnh đầu bộ ảnh của mỗi khách sạn có ảnh, tự chuyển 5 giây, có nút tạm dừng | `src/components/site/hero-slides.tsx` |
| **Lightbox** | Bộ ảnh trang khách sạn: vuốt, phím mũi tên, phóng to. Chưa có ảnh thì khung "Ảnh đang cập nhật" | `src/components/hotel/gallery.tsx` |

Không dùng plugin `createNextIntlPlugin`: plugin kéo theo `@swc/core`, mà bản native của nó trên máy này lỗi quyền thư mục `AppData\Local\swc`. Thay bằng một dòng alias `next-intl/config` trong `next.config.ts`.

## Đổi thương hiệu

- **Màu:** `src/app/globals.css`, khối `:root`. **Font:** `src/app/[locale]/layout.tsx`.
- **Logo:** `public/images/brand/rooty-trip-logo.png` đang là logo Rooty Trip — có logo Rooty Hospitality thì thay file này.

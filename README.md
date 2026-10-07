# Rooty Hospitality — bản demo 2 trang

Website chung cho các khách sạn của Rooty, giao diện theo nhận diện **rootytrip.com**. Phạm vi hiện tại chỉ có 2 trang:

| Trang | Nội dung |
|---|---|
| `/` | Banner + thanh chọn nhanh (khách sạn, ngày, số khách) · 4 cam kết đặt trực tiếp · thẻ các khách sạn · hệ sinh thái Rooty (xe sân bay, tour, RIVUS) |
| `/hotel/[slug]` | Bộ ảnh · thanh mục lục dính · tổng quan · **chọn phòng** (giá theo ngày, gói ăn sáng / không hoàn huỷ, còn mấy phòng, hết phòng) · tiện ích · ăn uống · trải nghiệm · vị trí · chính sách · hỏi đáp · thẻ giá dính bên phải |

Khách sạn: `/hotel/pito-hon-thom`, `/hotel/calista`. **Mọi nội dung, giá, ảnh là mẫu.**

**Dữ liệu là giả lập:** không có backend và không gọi Gohost. Bấm "Đặt phòng" sẽ mở một hộp tóm tắt: bản chính thức thay bằng trang đặt phòng + thanh toán của Gohost (điểm D2 trong `reviews/2026-10-06-yeu-cau-website-rooty-hospitality.docx`).

Stack: Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · shadcn/ui (Radix) · lucide-react · react-day-picker · font Be Vietnam Pro.

## Chạy

Dùng **Yarn 1**, không chạy `npm install`.

```bash
yarn install
yarn dev        # http://localhost:3000
yarn build      # build production (cũng là bước kiểm tra type)
yarn lint
yarn photos     # tải lại ảnh mẫu Unsplash còn thiếu vào public/images
```

Ngày "hôm nay" của demo cố định là **07/10/2026** (`src/lib/format.ts`). Ngày ở mặc định: 16/10 – 19/10/2026, 2 người lớn + 1 trẻ em.

## Xem các trạng thái

| Muốn xem | Làm |
|---|---|
| Còn ít phòng | Deluxe Ocean View của PITO luôn hiện "Chỉ còn 3 phòng" |
| Một hạng hết phòng | Family Suite của PITO hết cả tháng 10 → nút "Xem ngày khác" |
| Cả khách sạn hết phòng + gợi ý ngày | Chọn 30/12 – 02/01 |
| Đoàn đông hơn sức chứa | Chọn 3 người lớn ở Calista → lời khuyên đặt nhiều phòng |
| Hạng phòng chưa có ảnh | Superior Garden của PITO |
| Đang tải | Mỗi lần đổi ngày / số khách (giả lập độ trễ API) |

## Đổi thương hiệu và nội dung

- **Màu:** `src/app/globals.css`, khối `:root`. Màu lấy từ rootytrip.com; nút chính `--primary` đậm hơn `#299683` của rootytrip một nấc để chữ trắng đạt chuẩn tương phản.
- **Font:** `src/app/layout.tsx`.
- **Logo:** `public/images/brand/rooty-trip-logo.png` là logo Rooty Trip (bản trắng, tô xanh bằng CSS `.logo-green` như rootytrip.com đang làm). Có logo Rooty Hospitality thì thay file này.
- **Nội dung khách sạn:** `src/data/hotels.ts`. Ảnh: ghi đè file cùng tên trong `public/images/<slug>/`.

## Kiến trúc mã

```
src/app/(site)/page.tsx              trang chủ
src/app/(site)/hotel/[slug]/page.tsx trang khách sạn (dựng tĩnh theo từng slug)
src/components/site/                 header, footer, ô chọn ngày/khách, mảnh dùng chung (kit.tsx)
src/components/hotel/                bộ ảnh, mục lục, chọn phòng, thẻ giá
src/lib/repo/                        cửa duy nhất lấy dữ liệu (mock.ts) — UI không import src/data
src/data/hotels.ts                   dữ liệu mẫu
```

Ngày ở + số khách nằm trên URL (`?in=&out=&a=&c=`), nên trang chủ truyền sang trang khách sạn và link chia sẻ được.

**Khi nối Gohost thật:** viết `src/lib/repo/api.ts` cùng kiểu `Repo` rồi đổi một dòng trong `src/lib/repo/index.ts`.
- **Phòng trống và giá** (`searchRooms`) gọi qua backend Rooty, không gọi thẳng Gohost từ trình duyệt. Backend giữ API key, cache, chịu rate limit 60 lượt/5 phút và tính lại giá. Lời gọi tương ứng: `GET /properties/{tenant_id}/room_types/search`.
- **Nội dung** (ảnh, mô tả, tiện ích, chính sách) Gohost API không có, nên vẫn lấy từ CMS của Rooty.
- Tên field giữ theo Gohost: `tenant_id`, `room_type_id`, `rate_plan_id`, `has_breakfast`, `days_breakdown`, `quantity`.

Các trang của bản demo cũ (admin, đại lý, tìm kiếm, đặt phòng nhiều bước…) đã chuyển sang `demo/_luu-tru-ban-demo-cu-2026-10-07/`, không còn trong build.

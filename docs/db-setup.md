# Postgres cho rootyhospitality.com — dựng, migrate, seed, phân quyền

Một Postgres server chứa nhiều database, mỗi project một database. Project này: database **`hospitality`**, user riêng **`hospitality_app`**, schema `public`.

## 1. Tạo user + database (chạy bằng tài khoản quản trị Postgres)

```sql
CREATE ROLE hospitality_app LOGIN PASSWORD 'đặt-mật-khẩu-mạnh-chỉ-chữ-và-số';
CREATE DATABASE hospitality OWNER hospitality_app;
REVOKE CONNECT ON DATABASE hospitality FROM PUBLIC;
GRANT CONNECT ON DATABASE hospitality TO hospitality_app;
```

- Postgres 15+: user là chủ database nên tạo bảng trong `public` được. Kiểm bằng `yarn db:check` (dòng "Tạo bảng public: CÓ").
- Mật khẩu có ký tự `@ : / # ?` thì phải mã hoá URL trong `DATABASE_URL` — dễ nhất là chỉ dùng chữ + số.

## 1b. Dùng chung database với dự án khác (prod: `crm_pl30` trên Render)

Bảng của web nằm trong schema riêng `hospitality`, không đụng schema của dự án khác (`crm`, `b2b_dev`, `public`). Chỉ cần thêm `schema=hospitality` vào `DATABASE_URL`:

- `prisma migrate deploy` đọc tham số này → tạo schema (nếu chưa có) + bảng + `_prisma_migrations` trong đó.
- App, seed, script: `src/lib/pg.ts` đặt schema cho Prisma và `search_path` cho SQL tay.
- `yarn db:check` in schema đích, các schema khác trong database, schema đích rỗng không.

## 2. `DATABASE_URL`

```
postgresql://hospitality_app:<mật khẩu>@<host>:5432/hospitality?sslmode=require
```

- Máy dev (Postgres cài trên máy): bỏ `?sslmode=require`, host `localhost`.
- Prod (crm_pl30): `…/crm_pl30?sslmode=require&schema=hospitality`.
- Render Postgres: dùng **Internal Database URL** cho web service cùng region (nhanh, không ra internet); thêm `?sslmode=require` khi dùng External URL.
- Số kết nối mỗi tiến trình đặt trong code (`src/lib/pg.ts`, pool `max: 5`) — tham số `connection_limit` trên URL không có tác dụng với driver `pg`.
- Mọi kết nối đặt `TimeZone=UTC` (code tự làm) vì Prisma lưu giờ UTC không kèm múi giờ.

## 3. Áp schema + dữ liệu đầu

```bash
yarn db:check            # CHỈ ĐỌC: in host, database, user, phiên bản, DB rỗng không, quyền tạo bảng
yarn db:migrate:deploy   # áp các migration trong prisma/migrations (production chỉ dùng lệnh này)
yarn db:seed             # nạp khách sạn, hạng phòng, ảnh, tiện ích, chính sách, lịch tồn 365 ngày từ src/content (chạy lại không trùng)
yarn db:import-gohost    # (tuỳ chọn) chép giá 90 ngày tới từ Gohost vào lịch giá — cần GOHOST_API_KEY/SECRET
yarn check:booking       # (tuỳ chọn, chỉ máy dev / staging) kiểm giữ phòng, webhook, hết hạn, hoàn tiền trên DB thật; tự dọn dữ liệu thử
```

Seed **không** tạo giá (src/content không có giá): sau seed, nhập giá ở admin (tab Lịch giá & tồn) hoặc `yarn db:import-gohost`.
Seed để mỗi hạng phòng **1 phòng / đêm** bán trên web (`WEB_ROOMS_PER_TYPE` ở đầu `prisma/seed.ts`) — số còn lại bán OTA qua Gohost; lễ tân phải đóng đúng số phòng web trên Gohost.

## 4. Quyền admin

Đăng nhập web bằng Google hoặc email + mã, rồi chạy:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'ten@rootytrip.com';   -- toàn quyền
UPDATE "User" SET role = 'STAFF' WHERE email = 'letan@...';           -- chỉ xem booking, nhận / trả phòng
```

Tài khoản `ADMIN_USER` / `ADMIN_PASSWORD` trong env luôn vào được `/admin` với quyền ADMIN (đường dự phòng).

## 5. Đổi schema về sau

1. Sửa `prisma/schema.prisma` trên máy dev.
2. `yarn prisma migrate dev --name <ten-thay-doi>` — **chỉ** trên Postgres máy dev; sinh thư mục mới trong `prisma/migrations`.
3. Commit thư mục migration. Production chạy `yarn db:migrate:deploy` (Render: Pre-deploy command).

Không bao giờ chạy `migrate dev`, `migrate reset`, `db push` trên production.

## 6. Sao lưu

Render Postgres (bản trả phí) có backup hằng ngày + khôi phục theo thời điểm. Ngoài ra trước mỗi lần migrate lớn: `pg_dump -Fc "$DATABASE_URL" > hospitality-$(date +%F).dump`.

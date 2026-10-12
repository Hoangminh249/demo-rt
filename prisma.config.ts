// Cấu hình Prisma CLI (Prisma 7). App đọc DATABASE_URL qua src/lib/db.ts, không qua file này.
import { defineConfig } from 'prisma/config'

// Prisma 7 không tự nạp .env cho CLI. Máy dev: đọc .env nếu có; Render: biến môi trường có sẵn.
try { process.loadEnvFile() } catch {}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations', seed: 'tsx prisma/seed.ts' },
  // Không dùng env('DATABASE_URL'): hàm đó throw khi thiếu biến → `prisma generate`/`validate` hỏng lúc chưa có DB.
  // ponytail: URL giữ chỗ để `migrate diff --from-empty` (offline) chạy được — schema engine 7.10 bắt buộc có datasource,
  // thiếu thì im lặng exit 0 không ra SQL. Không lệnh nào trong PREPARE mở kết nối tới URL này.
  datasource: { url: process.env.DATABASE_URL ?? 'postgresql://offline:offline@127.0.0.1:1/offline' },
})

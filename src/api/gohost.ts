// Endpoint Gohost (chỉ GET) — mỗi hàm một endpoint, query riêng của endpoint khai báo ngay tại đây.
// Gọi qua HTTP client src/lib/gohost.ts (key, ngân sách lượt, lỗi). Chỉ server. Web không phụ thuộc Gohost: chỉ admin (Kết nối Gohost) + script nhập giá dùng.
import 'server-only'
import { unstable_cache } from 'next/cache'
import { get, list } from '@/lib/gohost'
import type { GhProperty } from '@/types/gohost'

// ponytail: unstable_cache — Next 16 đã có 'use cache' thay thế nhưng phải bật cacheComponents (đổi cả cách dựng trang).
// Chỉ lưu kết quả trả về thành công; lần làm mới bị lỗi thì vẫn trả bản cũ.

/** GET /properties — mọi property của tổ chức + hạng phòng + gói giá (giá mặc định T2 → CN). Cache 1 giờ. */
const properties = unstable_cache(
  async () => list<GhProperty>((await get('/properties')).data),
  ['gohost-properties'],
  { revalidate: 3600 },
)

export const gohostApi = { properties }
